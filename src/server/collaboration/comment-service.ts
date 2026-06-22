import { createClient } from "@/lib/supabase/server";

export type CommentEntityType = "file" | "study_note" | "flashcard" | "quiz" | "collection";

export interface CommentRow {
  id: string;
  user_id: string;
  entity_type: CommentEntityType;
  entity_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: { name: string; email: string; avatar: string };
  replies?: CommentRow[];
}

export class CommentService {
  /**
   * Fetch a full comment thread (parents + their direct replies).
   */
  static async getCommentThread(entityType: CommentEntityType, entityId: string): Promise<CommentRow[]> {
    const supabase = await createClient();

    // 1. Fetch parents
    const { data: parents, error: pErr } = await supabase
      .from("comments")
      .select(`
        *,
        user:users!comments_user_id_fkey(name, email, avatar)
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .is("parent_id", null)
      .order("created_at", { ascending: true });

    if (pErr) throw new Error("Failed to fetch comments: " + pErr.message);

    if (!parents || parents.length === 0) return [];

    // 2. Fetch replies
    const parentIds = parents.map((p) => p.id);
    const { data: replies, error: rErr } = await supabase
      .from("comments")
      .select(`
        *,
        user:users!comments_user_id_fkey(name, email, avatar)
      `)
      .in("parent_id", parentIds)
      .order("created_at", { ascending: true });

    if (rErr) throw new Error("Failed to fetch replies: " + rErr.message);

    // 3. Assemble tree
    return parents.map((parent) => ({
      ...parent,
      replies: (replies || []).filter((r) => r.parent_id === parent.id),
    })) as unknown as CommentRow[];
  }

  /**
   * Create a new comment or reply.
   */
  static async createComment(
    userId: string,
    entityType: CommentEntityType,
    entityId: string,
    content: string,
    parentId?: string
  ): Promise<CommentRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        content,
        parent_id: parentId || null,
      })
      .select(`
        *,
        user:users!comments_user_id_fkey(name, email, avatar)
      `)
      .single();

    if (error) throw new Error("Failed to create comment: " + error.message);

    // If it's a reply, send a simple notification to the parent author
    if (parentId) {
      const { data: parent } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", parentId)
        .maybeSingle();

      if (parent && parent.user_id !== userId) {
        await supabase.from("notifications").insert({
          user_id: parent.user_id,
          title: "New Reply",
          message: "Someone replied to your comment.",
        });
      }
    }

    return data as unknown as CommentRow;
  }

  /**
   * Update an existing comment.
   */
  static async updateComment(userId: string, commentId: string, content: string): Promise<CommentRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comments")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", userId)
      .select(`
        *,
        user:users!comments_user_id_fkey(name, email, avatar)
      `)
      .single();

    if (error) throw new Error("Failed to update comment: " + error.message);

    return data as unknown as CommentRow;
  }

  /**
   * Delete a comment (and automatically its replies via cascade).
   */
  static async deleteComment(userId: string, commentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) throw new Error("Failed to delete comment: " + error.message);
  }
}
