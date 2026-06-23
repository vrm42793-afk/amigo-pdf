"use client";

import { useState, useCallback } from "react";
import { getUploadSignature } from "@/actions/files/get-upload-signature";
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
          // 1. Get Signature
          const sigRes = await getUploadSignature(file.name);
          if (sigRes.error) {
            throw new Error(sigRes.error);
          }

          // 2. Upload directly to Cloudinary
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", sigRes.apiKey);
          formData.append("timestamp", sigRes.timestamp.toString());
          formData.append("signature", sigRes.signature);
          formData.append("folder", sigRes.folder);
          formData.append("public_id", sigRes.publicId);
          formData.append("resource_type", "raw"); // Important for PDFs

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

          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigRes.cloudName}/raw/upload`;
          
          const uploadRes = await fetch(cloudinaryUrl, {
            method: "POST",
            body: formData,
          });

          clearInterval(progressInterval);

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Cloudinary upload failed with status ${uploadRes.status}`);
          }

          const uploadData = await uploadRes.json();

          // 3. Save File Record
          const result = await saveFileRecordAction({
            fileName: file.name,
            mimeType: file.type || "application/pdf",
            fileSize: file.size,
            publicId: uploadData.public_id,
            secureUrl: uploadData.secure_url,
          });

          if (result.error) {
            throw new Error(result.error);
          }

          updateQueueItem(item.id, { status: "complete", progress: 100, result: result.file });
          toast.success(`${file.name} uploaded successfully`);
          // Invalidate file list cache
          queryClient.invalidateQueries({ queryKey: ["files"] });
        } catch (err) {
          let message = err instanceof Error ? err.message : "Upload failed";
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
