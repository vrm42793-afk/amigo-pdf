"use client";

import { DropZone } from "@/components/upload/drop-zone";
import { UploadQueue } from "@/components/upload/upload-queue";
import { useFileUpload } from "@/hooks/use-file-upload";

export function UploadWidget() {
  const { queue, uploadFiles, removeFromQueue, clearCompleted, retryUpload } = useFileUpload();

  const isUploading = queue.some((q) => q.status === "uploading");

  return (
    <div className="space-y-4">
      <DropZone onFilesSelected={uploadFiles} isUploading={isUploading} />
      <UploadQueue
        queue={queue}
        onRetry={retryUpload}
        onRemove={removeFromQueue}
        onClearCompleted={clearCompleted}
      />
    </div>
  );
}
