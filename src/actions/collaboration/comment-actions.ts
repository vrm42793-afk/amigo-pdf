"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CommentService, CommentEntityType } from "@/server/collaboration/comment-service";

const getCommentsSchema = z.object({
  entityType: z.enum(["file", "study_note", "flashcard", "quiz", "collection"]),
  entityId: z.string().uuid(),
});

const createCommentSchema = z.object({
  entityType: z.enum(["file", "study_note", "flashcard", "quiz", "collection"]),
  entityId: z.string().uuid(),
  content: z.string().min(1, "Comment cannot be empty"),
  parentId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1, "Comment cannot be empty"),
});

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export async function getCommentsAction(entityType: CommentEntityType, entityId: string) {
  try {
    const validated = getCommentsSchema.parse({ entityType, entityId });

    // RLS will ensure user has access via entity table matching or shared ownership, but for v1
    // any authenticated user can read comments (secured by app logic rendering).
    
    const data = await CommentService.getCommentThread(validated.entityType, validated.entityId);
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch comments",
    };
  }
}

export async function createCommentAction(formData: {
  entityType: CommentEntityType;
  entityId: string;
  content: string;
  parentId?: string;
}) {
  try {
    const validated = createCommentSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    const data = await CommentService.createComment(
      user.id,
      validated.entityType,
      validated.entityId,
      validated.content,
      validated.parentId
    );

    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to post comment",
    };
  }
}

export async function updateCommentAction(formData: { commentId: string; content: string }) {
  try {
    const validated = updateCommentSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    const data = await CommentService.updateComment(user.id, validated.commentId, validated.content);

    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update comment",
    };
  }
}

export async function deleteCommentAction(commentId: string) {
  try {
    const validated = deleteCommentSchema.parse({ commentId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized. Please log in.");

    await CommentService.deleteComment(user.id, validated.commentId);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete comment",
    };
  }
}
