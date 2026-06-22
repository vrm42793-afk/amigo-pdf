"use client";

import React, { useState, useEffect } from "react";
import { 
  getCommentsAction, 
  createCommentAction,
  updateCommentAction,
  deleteCommentAction
} from "@/actions/collaboration/comment-actions";
import { CommentEntityType, CommentRow } from "@/server/collaboration/comment-service";
import { MessageSquare, Send, RefreshCw } from "lucide-react";
import CommentCard from "./CommentCard";
import { createClient } from "@/lib/supabase/client";

interface CommentThreadProps {
  entityType: CommentEntityType;
  entityId: string;
}

export default function CommentThread({ entityType, entityId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  
  // New comment state
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = React.useCallback(async () => {
    setIsLoading(true);
    const res = await getCommentsAction(entityType, entityId);
    if (res.success && res.data) {
      setComments(res.data);
    }
    setIsLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) setCurrentUserId(data.user.id);
      loadComments();
    }
    init();
  }, [loadComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const res = await createCommentAction({
      entityType,
      entityId,
      content: newComment.trim()
    });

    if (res.success && res.data) {
      setNewComment("");
      // Add the new parent comment directly to state
      setComments(prev => [...prev, res.data as unknown as CommentRow]);
    }
    setIsSubmitting(false);
  };

  const handleReply = async (parentId: string, content: string) => {
    const res = await createCommentAction({
      entityType,
      entityId,
      content,
      parentId
    });

    if (res.success && res.data) {
      // Append reply to the correct parent in state
      setComments(prev => prev.map(p => {
        if (p.id === parentId) {
          return { ...p, replies: [...(p.replies || []), res.data as unknown as CommentRow] };
        }
        return p;
      }));
    }
  };

  const handleUpdate = async (commentId: string, parentId: string | null, content: string) => {
    const res = await updateCommentAction({ commentId, content });
    if (res.success && res.data) {
      if (parentId) {
        setComments(prev => prev.map(p => {
          if (p.id === parentId) {
            return {
              ...p,
              replies: (p.replies || []).map(r => r.id === commentId ? res.data as unknown as CommentRow : r)
            };
          }
          return p;
        }));
      } else {
        setComments(prev => prev.map(p => p.id === commentId ? res.data as unknown as CommentRow : p));
      }
    }
  };

  const handleDelete = async (commentId: string, parentId: string | null) => {
    const res = await deleteCommentAction(commentId);
    if (res.success) {
      if (parentId) {
        setComments(prev => prev.map(p => {
          if (p.id === parentId) {
            return {
              ...p,
              replies: (p.replies || []).filter(r => r.id !== commentId)
            };
          }
          return p;
        }));
      } else {
        setComments(prev => prev.filter(p => p.id !== commentId));
      }
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-card border-l border-border">
      <div className="h-14 border-b border-border px-4 flex items-center gap-2 shrink-0 bg-muted/20">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Discussions</h3>
        <span className="ml-auto text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
          {comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground opacity-60">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">No comments yet</p>
            <p className="text-xs mt-0.5">Start the conversation</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentCard 
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={(content) => handleReply(comment.id, content)}
              onUpdate={(id, parentId, content) => handleUpdate(id, parentId, content)}
              onDelete={(id, parentId) => handleDelete(id, parentId)}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-background shrink-0">
        <form onSubmit={handlePostComment} className="flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[80px] rounded-md border border-border bg-card px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none resize-none placeholder:text-muted-foreground/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePostComment(e);
              }
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
