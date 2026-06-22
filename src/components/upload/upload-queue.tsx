"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, X, FileText, Loader2 } from "lucide-react";
import type { UploadQueueItem } from "@/types/files.types";
import { Button } from "@/components/ui/button";

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
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Upload Queue</h3>
        {hasCompleted && (
          <Button variant="ghost" size="sm" onClick={onClearCompleted} className="text-xs h-7 px-2">
            Clear completed
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {queue.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5"
            >
              {/* Icon */}
              <div className="shrink-0">
                {item.status === "complete" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {item.status === "error" && (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                {item.status === "uploading" && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {item.status === "pending" && (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Name and progress */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>

                {item.status === "uploading" && (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {item.status === "error" && (
                  <p className="text-xs text-destructive">{item.errorMessage}</p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-1">
                {item.status === "error" && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                {item.status !== "uploading" && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
