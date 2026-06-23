"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, X, FileText, Loader2 } from "lucide-react";
import type { UploadQueueItem } from "@/types/files.types";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
import { GlassProgress } from "@/components/ui-premium/data-display/glass-progress";
import { GlassBadge } from "@/components/ui-premium/data-display/glass-badge";

interface UploadQueueProps {
  queue: UploadQueueItem[];
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onClearCompleted: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadQueue({ queue, onRetry, onRemove, onClearCompleted }: UploadQueueProps) {
  if (queue.length === 0) return null;

  const hasCompleted = queue.some((q) => q.status === "complete");

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground tracking-tight">Upload Queue</h3>
        {hasCompleted && (
          <GlassButton variant="ghost" size="sm" onClick={onClearCompleted} className="text-xs h-7 px-2">
            Clear completed
          </GlassButton>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {queue.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-xl glass-panel px-3 py-3 relative overflow-hidden"
            >
              {/* Icon */}
              <div className="shrink-0 relative z-10">
                {item.status === "complete" && (
                  <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                )}
                {item.status === "error" && (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                {item.status === "uploading" && (
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                )}
                {item.status === "pending" && (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Name and progress */}
              <div className="min-w-0 flex-1 space-y-1.5 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold text-foreground">{item.file.name}</p>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>

                {item.status === "uploading" && (
                  <GlassProgress value={item.progress} className="h-1.5" />
                )}

                {item.status === "error" && (
                  <p className="text-[10px] font-medium text-destructive">{item.errorMessage}</p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-1 relative z-10">
                {item.status === "error" && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="rounded-lg p-1.5 hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                {item.status !== "uploading" && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="rounded-lg p-1.5 hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              {/* Background Glow for success/error */}
              {item.status === "complete" && (
                <div className="absolute inset-0 bg-[#10B981]/5 z-0" />
              )}
              {item.status === "error" && (
                <div className="absolute inset-0 bg-destructive/5 z-0" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
