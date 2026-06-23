"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveFileRecordAction } from "@/actions/files/save-file-record";
import type { UploadQueueItem } from "@/types/files.types";

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
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

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
          // 1. Get Supabase client
          const supabase = createClient();
          const { data: authData } = await supabase.auth.getUser();
          
          if (!authData.user) {
            throw new Error("Unauthorized");
          }

          const fileExt = file.name.split('.').pop() || "pdf";
          const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
          const filePath = `${authData.user.id}/${uniqueFileName}`;

          // Simulate progress
          const progressInterval = setInterval(() => {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id && q.progress < 85
                  ? { ...q, progress: q.progress + 15 }
                  : q
              )
            );
          }, 300);

          // 2. Upload directly to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("user_files")
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          clearInterval(progressInterval);

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          if (!uploadData?.path) {
             throw new Error("Upload succeeded but no path returned");
          }

          const { data: { publicUrl } } = supabase.storage
            .from("user_files")
            .getPublicUrl(uploadData.path);

          // 3. Save File Record
          // We pass the storage path as 'publicId' so the backend can delete/rename
          const result = await saveFileRecordAction({
            fileName: file.name,
            mimeType: file.type || "application/pdf",
            fileSize: file.size,
            publicId: uploadData.path,
            secureUrl: publicUrl, // Save the actual public URL
          });

          if (result.error) {
            throw new Error(result.error);
          }

          updateQueueItem(item.id, { status: "complete", progress: 100, result: result.file });
          toast.success(`${file.name} uploaded successfully`);
          // Invalidate file list cache
          queryClient.invalidateQueries({ queryKey: ["files"] });
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
