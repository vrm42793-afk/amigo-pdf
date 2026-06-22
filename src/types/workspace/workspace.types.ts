export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  item_type: "file" | "note" | "flashcard" | "quiz";
  item_id: string;
  created_at: string;
}

export interface ResolvedCollectionItem {
  id: string; // The collection_item.id (used for removing)
  item_type: "file" | "note" | "flashcard" | "quiz";
  item_id: string; // The underlying entity ID
  title: string;
  description?: string;
  created_at: string;
}

export interface SearchResult {
  item_type: "file" | "note" | "flashcard" | "quiz" | "chat";
  item_id: string;
  title: string;
  content_snippet: string;
  created_at: string;
}
