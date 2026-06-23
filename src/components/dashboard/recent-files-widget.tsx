"use client";

import { useRecentFiles } from "@/hooks/use-files";
import { FileCard } from "@/components/dashboard/file-card";
import { Clock } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";

export function RecentFilesWidget() {
  const { data: files, isLoading, isError } = useRecentFiles(5);

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Recent Files</span>
        </div>
        <Link
          href="/dashboard/files"
          className="text-xs font-bold text-accent hover:text-accent/80 hover:underline underline-offset-4 transition-all"
        >
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl glass-panel animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-surface-border" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-surface-border rounded" />
                <div className="h-2 w-24 bg-surface-border rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="p-6 text-center border border-destructive/20 bg-destructive/5 rounded-xl">
          <p className="text-xs font-medium text-destructive">
            Failed to load recent files.
          </p>
        </div>
      )}

      {!isLoading && !isError && files && files.length === 0 && (
        <div className="p-8 text-center glass-panel rounded-xl border-dashed">
          <p className="text-sm font-semibold text-foreground">No files yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload your first document to see it here.
          </p>
        </div>
      )}

      {!isLoading && !isError && files && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <FileCard key={file.id} file={file} view="list" />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
