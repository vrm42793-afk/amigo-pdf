"use client";

import { useRecentFiles } from "@/hooks/use-files";
import { FileCard } from "@/components/dashboard/file-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import Link from "next/link";

export function RecentFilesWidget() {
  const { data: files, isLoading, isError } = useRecentFiles(5);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Recent Files</span>
        </div>
        <Link
          href="/dashboard/files"
          className="text-xs text-primary hover:underline underline-offset-2"
        >
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Failed to load recent files.
        </p>
      )}

      {!isLoading && !isError && files && files.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          No files yet. Upload your first document.
        </p>
      )}

      {!isLoading && !isError && files && files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <FileCard key={file.id} file={file} view="list" />
          ))}
        </div>
      )}
    </div>
  );
}
