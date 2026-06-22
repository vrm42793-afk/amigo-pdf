"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { WorkspaceService } from "@/server/workspace/workspace-service";

const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  icon: z.string().default("Folder"),
  color: z.string().default("blue"),
});

const deleteCollectionSchema = z.object({
  id: z.string().uuid(),
});

const addItemToCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  itemType: z.enum(["file", "note", "flashcard", "quiz"]),
  itemId: z.string().uuid(),
});

const removeItemFromCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  collectionItemId: z.string().uuid(),
});

const getCollectionItemsSchema = z.object({
  collectionId: z.string().uuid(),
});

const globalSearchSchema = z.object({
  query: z.string(),
});

export async function getCollectionsAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const collections = await WorkspaceService.getCollections(user.id);
    return { success: true, data: collections };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch collections",
    };
  }
}

export async function createCollectionAction(formData: {
  name: string;
  description?: string | null;
  icon: string;
  color: string;
}) {
  try {
    const validated = createCollectionSchema.parse(formData);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const collection = await WorkspaceService.createCollection(
      user.id,
      validated.name,
      validated.description ?? null,
      validated.icon,
      validated.color
    );
    return { success: true, data: collection };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create collection",
    };
  }
}

export async function deleteCollectionAction(formData: { id: string }) {
  try {
    const validated = deleteCollectionSchema.parse(formData);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await WorkspaceService.deleteCollection(user.id, validated.id);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete collection",
    };
  }
}

export async function addItemToCollectionAction(formData: {
  collectionId: string;
  itemType: "file" | "note" | "flashcard" | "quiz";
  itemId: string;
}) {
  try {
    const validated = addItemToCollectionSchema.parse(formData);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const item = await WorkspaceService.addItemToCollection(
      user.id,
      validated.collectionId,
      validated.itemType,
      validated.itemId
    );
    return { success: true, data: item };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add item to collection",
    };
  }
}

export async function removeItemFromCollectionAction(formData: {
  collectionId: string;
  collectionItemId: string;
}) {
  try {
    const validated = removeItemFromCollectionSchema.parse(formData);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await WorkspaceService.removeItemFromCollection(
      user.id,
      validated.collectionId,
      validated.collectionItemId
    );
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to remove item from collection",
    };
  }
}

export async function getCollectionItemsAction(formData: { collectionId: string }) {
  try {
    const validated = getCollectionItemsSchema.parse(formData);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const items = await WorkspaceService.getCollectionItems(user.id, validated.collectionId);
    return { success: true, data: items };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch collection items",
    };
  }
}

export async function globalSearchAction(formData: { query: string }) {
  try {
    const validated = globalSearchSchema.parse(formData);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const results = await WorkspaceService.globalSearch(user.id, validated.query);
    return { success: true, data: results };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to perform global search",
    };
  }
}

export async function getAvailableWorkspaceAssetsAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    // Fetch all assets in parallel
    const [filesRes, studyNotesRes, notesRes, flashcardsRes, quizzesRes] = await Promise.all([
      supabase.from("files").select("id, name").eq("user_id", user.id).eq("is_deleted", false),
      supabase.from("study_notes").select("id, title, type").eq("user_id", user.id),
      supabase.from("notes").select("id, title, notes_type").eq("user_id", user.id),
      supabase.from("flashcards").select("id, deck_name").eq("user_id", user.id),
      supabase.from("quizzes").select("id, title").eq("user_id", user.id),
    ]);

    const files = (filesRes.data || []).map((f) => ({ id: f.id, title: f.name, type: "file" }));
    
    const studyNotes = (studyNotesRes.data || []).map((n) => ({
      id: n.id,
      title: n.title,
      type: "note",
      sub: `Study Note (${n.type})`,
    }));

    const regularNotes = (notesRes.data || []).map((n) => ({
      id: n.id,
      title: n.title,
      type: "note",
      sub: `AI Note (${n.notes_type})`,
    }));

    const notes = [...studyNotes, ...regularNotes];

    const flashcards = (flashcardsRes.data || []).map((fc) => ({
      id: fc.id,
      title: fc.deck_name,
      type: "flashcard",
    }));

    const quizzes = (quizzesRes.data || []).map((q) => ({
      id: q.id,
      title: q.title,
      type: "quiz",
    }));

    return {
      success: true,
      data: {
        files,
        notes,
        flashcards,
        quizzes,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to load workspace assets",
    };
  }
}

export async function getFileSecureUrlAction(formData: { fileId: string }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: file, error } = await supabase
      .from("files")
      .select("cloudinary_secure_url")
      .eq("id", formData.fileId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !file) {
      throw new Error("File not found or unauthorized");
    }

    return { success: true, url: file.cloudinary_secure_url };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to retrieve file URL",
    };
  }
}


