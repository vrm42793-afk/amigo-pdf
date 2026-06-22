"use client";

import React, { useState } from "react";
import { CommentRow } from "@/server/collaboration/comment-service";
import { MoreVertical, CornerDownRight, Edit2, Trash2, Send, X } from "lucide-react";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

interface CommentCardProps {
  comment: CommentRow;
  currentUserId?: string;
  isReply?: boolean;
  onReply?: (content: string) => void;
  onUpdate: (id: string, parentId: string | null, content: string) => void;
  onDelete: (id: string, parentId: string | null) => void;
}

export default function CommentCard({ 
  comment, 
  currentUserId, 
  isReply = false,
  onReply,
  onUpdate,
  onDelete
}: CommentCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);
  
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = currentUserId === comment.user_id;

  const handleReplySubmit = () => {
    if (!replyContent.trim() || !onReply) return;
    onReply(replyContent.trim());
    setIsReplying(false);
    setReplyContent("");
  };

  const handleEditSubmit = () => {
    if (!editContent.trim()) return;
    onUpdate(comment.id, comment.parent_id, editContent.trim());
    setIsEditing(false);
  };

  return (
    <div className={`flex flex-col ${isReply ? "mt-3" : "mt-0"}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`shrink-0 rounded-full flex items-center justify-center font-bold text-primary border border-primary/20 bg-primary/10 uppercase ${isReply ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'}`}>
          {comment.user?.name?.[0] || comment.user?.email?.[0] || '?'}
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 border border-border rounded-lg rounded-tl-none px-3 py-2.5 relative group">
            <div className="flex items-start justify-between mb-1 gap-2">
              <span className="text-xs font-bold text-foreground truncate">
                {comment.user?.name || comment.user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {timeAgo(comment.created_at)}
              </span>
            </div>
            
            {isEditing ? (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[60px] rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={handleEditSubmit} className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}

            {/* Hover Options Menu */}
            {isOwner && !isEditing && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button 
                    onClick={() => setShowOptions(!showOptions)}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-24 bg-card border border-border rounded-md shadow-md z-10 py-1 overflow-hidden">
                      <button 
                        onClick={() => { setIsEditing(true); setShowOptions(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-muted flex items-center gap-2"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      <button 
                        onClick={() => { onDelete(comment.id, comment.parent_id); setShowOptions(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Bar */}
          {!isReply && !isEditing && (
            <div className="flex items-center gap-4 mt-1.5 ml-1">
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
            </div>
          )}

          {/* Reply Composer */}
          {isReplying && (
             <div className="mt-3 flex gap-2">
               <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 h-8 rounded-md border border-border bg-card px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplySubmit();
                  }}
                  autoFocus
               />
               <button 
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                  className="h-8 w-8 bg-primary text-primary-foreground rounded-md flex items-center justify-center disabled:opacity-50"
                >
                 <Send className="h-3.5 w-3.5" />
               </button>
               <button 
                  onClick={() => setIsReplying(false)}
                  className="h-8 w-8 border border-border text-muted-foreground rounded-md flex items-center justify-center hover:bg-muted"
                >
                 <X className="h-3.5 w-3.5" />
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Replies List */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 ml-4 border-l-2 border-border/50 mt-1 space-y-1">
          {comment.replies.map(reply => (
            <CommentCard 
              key={reply.id} 
              comment={reply} 
              currentUserId={currentUserId}
              isReply={true}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
