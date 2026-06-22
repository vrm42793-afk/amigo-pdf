"use client";

import { useState, useCallback } from "react";
import { uploadFileAction } from "@/actions/files/upload-file";
import type { UploadQueueItem } from "@/types/files.types";
import { randomUUID } from "crypto";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg"];

function validateClientFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) return `${file.name}: exceeds 100MB limit`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) return `${file.name}: unsupported file type`;
  return null;
}

export function useFileUpload() {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const queryClient = useQueryClient();

  const updateQueueItem = useCallback(
    (id: string, updates: Partial<UploadQueueItem>) => {
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const newItems: UploadQueueItem[] = [];
      const validFiles: { item: UploadQueueItem; file: File }[] = [];

      for (const file of files) {
        const validationError = validateClientFile(file);
        const id = randomUUID();

        if (validationError) {
          toast.error(validationError);
          continue;
        }

        const item: UploadQueueItem = {
          id,
          file,
          progress: 0,
          status: "pending",
        };
        newItems.push(item);
        validFiles.push({ item, file });
      }

      if (newItems.length === 0) return;
      setQueue((prev) => [...prev, ...newItems]);

      // Upload files sequentially to avoid overwhelming the server
      for (const { item, file } of validFiles) {
        updateQueueItem(item.id, { status: "uploading", progress: 10 });

        try {
          const formData = new FormData();
          formData.append("file", file);

          // Simulate progress while uploading (real progress requires XHR)
          const progressInterval = setInterval(() => {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id && q.progress < 85
                  ? { ...q, progress: q.progress + 15 }
                  : q
              )
            );
          }, 300);

          const result = await uploadFileAction(formData);
          clearInterval(progressInterval);

          if (result.error) {
            updateQueueItem(item.id, { status: "error", errorMessage: result.error, progress: 0 });
            toast.error(`Failed to upload ${file.name}: ${result.error}`);
          } else {
            updateQueueItem(item.id, { status: "complete", progress: 100, result: result.file });
            toast.success(`${file.name} uploaded successfully`);
            // Invalidate file list cache
            queryClient.invalidateQueries({ queryKey: ["files"] });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          updateQueueItem(item.id, { status: "error", errorMessage: message, progress: 0 });
          toast.error(`Failed to upload ${file.name}: ${message}`);
        }
      }
    },
    [updateQueueItem, queryClient]
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== "complete"));
  }, []);

  const retryUpload = useCallback(
    (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (item) {
        uploadFiles([item.file]);
        removeFromQueue(id);
      }
    },
    [queue, uploadFiles, removeFromQueue]
  );

  return { queue, uploadFiles, removeFromQueue, clearCompleted, retryUpload };
}
