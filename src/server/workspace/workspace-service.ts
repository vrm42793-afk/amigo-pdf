import { createClient } from "@/lib/supabase/server";
import { Collection, CollectionItem, ResolvedCollectionItem, SearchResult } from "@/types/workspace/workspace.types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export class WorkspaceService {
  /**
   * Fetch all collections for a user.
   */
  static async getCollections(userId: string): Promise<Collection[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch collections:", error);
      throw new Error("Failed to fetch collections: " + error.message);
    }

    return data || [];
  }

  /**
   * Create a new collection.
   */
  static async createCollection(
    userId: string,
    name: string,
    description: string | null,
    icon: string,
    color: string
  ): Promise<Collection> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name,
        description,
        icon,
        color,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create collection:", error);
      throw new Error("Failed to create collection: " + error?.message);
    }

    return data;
  }

  /**
   * Delete a collection.
   */
  static async deleteCollection(userId: string, id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete collection:", error);
      throw new Error("Failed to delete collection: " + error.message);
    }
  }

  /**
   * Add an item to a collection.
   */
  static async addItemToCollection(
    userId: string,
    collectionId: string,
    itemType: "file" | "note" | "flashcard" | "quiz",
    itemId: string
  ): Promise<CollectionItem> {
    const supabase = await createClient();

    // 1. Verify that collection belongs to user
    const { data: col, error: colError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (colError || !col) {
      throw new Error("Unauthorized or collection not found.");
    }

    // 2. Add the item
    const { data, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: collectionId,
        item_type: itemType,
        item_id: itemId,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to add item to collection:", error);
      throw new Error("Failed to add item to collection: " + error?.message);
    }

    return data as unknown as CollectionItem;
  }

  /**
   * Remove an item from a collection (using the item's collection_item ID).
   */
  static async removeItemFromCollection(userId: string, collectionId: string, collectionItemId: string): Promise<void> {
    const supabase = await createClient();

    // Verify ownership of the parent collection
    const { data: col, error: colError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (colError || !col) {
      throw new Error("Unauthorized or collection not found.");
    }

    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("id", collectionItemId)
      .eq("collection_id", collectionId);

    if (error) {
      console.error("Failed to remove item from collection:", error);
      throw new Error("Failed to remove item from collection: " + error.message);
    }
  }

  /**
   * Retrieve and resolve details for all items inside a collection.
   */
  static async getCollectionItems(userId: string, collectionId: string): Promise<ResolvedCollectionItem[]> {
    const supabase = await createClient();

    // 1. Verify collection ownership
    const { data: col, error: colError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (colError || !col) {
      throw new Error("Unauthorized or collection not found.");
    }

    // 2. Fetch raw items
    const { data: rawItems, error: itemsError } = await supabase
      .from("collection_items")
      .select("*")
      .eq("collection_id", collectionId);

    if (itemsError || !rawItems) {
      console.error("Failed to fetch collection items:", itemsError);
      throw new Error("Failed to fetch collection items: " + itemsError?.message);
    }

    // 3. Resolve items in parallel
    const resolvePromises = rawItems.map(async (item) => {
      try {
        switch (item.item_type) {
          case "file": {
            const { data: file } = await supabase
              .from("files")
              .select("name, size")
              .eq("id", item.item_id)
              .maybeSingle();

            if (!file) return null;
            return {
              id: item.id,
              item_type: "file" as const,
              item_id: item.item_id,
              title: file.name,
              description: `Size: ${formatBytes(Number(file.size))}`,
              created_at: item.created_at,
            };
          }
          case "note": {
            // First check study_notes table
            const { data: studyNote } = await supabase
              .from("study_notes")
              .select("title, type")
              .eq("id", item.item_id)
              .maybeSingle();

            if (studyNote) {
              return {
                id: item.id,
                item_type: "note" as const,
                item_id: item.item_id,
                title: studyNote.title,
                description: `Study Note (${studyNote.type})`,
                created_at: item.created_at,
              };
            }

            // Fallback to regular notes table
            const { data: regularNote } = await supabase
              .from("notes")
              .select("title, notes_type")
              .eq("id", item.item_id)
              .maybeSingle();

            if (regularNote) {
              return {
                id: item.id,
                item_type: "note" as const,
                item_id: item.item_id,
                title: regularNote.title,
                description: `AI Note (${regularNote.notes_type})`,
                created_at: item.created_at,
              };
            }

            return null;
          }
          case "flashcard": {
            const { data: deck } = await supabase
              .from("flashcards")
              .select("deck_name, cards")
              .eq("id", item.item_id)
              .maybeSingle();

            if (!deck) return null;
            const cardCount = Array.isArray(deck.cards) ? deck.cards.length : 0;
            return {
              id: item.id,
              item_type: "flashcard" as const,
              item_id: item.item_id,
              title: deck.deck_name,
              description: `Deck containing ${cardCount} cards`,
              created_at: item.created_at,
            };
          }
          case "quiz": {
            const { data: quiz } = await supabase
              .from("quizzes")
              .select("title")
              .eq("id", item.item_id)
              .maybeSingle();

            if (!quiz) return null;
            return {
              id: item.id,
              item_type: "quiz" as const,
              item_id: item.item_id,
              title: quiz.title,
              description: "Interactive AI Quiz",
              created_at: item.created_at,
            };
          }
          default:
            return null;
        }
      } catch (err) {
        console.error(`Failed to resolve item ${item.id} of type ${item.item_type}:`, err);
        return null;
      }
    });

    const resolved = await Promise.all(resolvePromises);
    return resolved.filter((item) => item !== null) as ResolvedCollectionItem[];
  }

  /**
   * Search globally across the workspace utilizing search_workspace RPC.
   */
  static async globalSearch(userId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.trim() === "") return [];

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_workspace", {
      p_user_id: userId,
      p_query: query.trim(),
    });

    if (error) {
      console.error("Global search failed:", error);
      throw new Error("Search failed: " + error.message);
    }

    return (data || []) as SearchResult[];
  }
}
