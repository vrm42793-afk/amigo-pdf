"use server";

import { createClient } from "@/lib/supabase/server";
import { insertFile, incrementUserStorageUsed } from "@/server/files/file-repository";
import type { FileRow } from "@/types/files.types";

export interface SaveFileRecordInput {
  fileName: string;
  mimeType: string;
  fileSize: number;
  publicId: string;
  secureUrl: string;
}

export interface SaveFileRecordResult {
  file?: FileRow;
  error?: string;
}

export async function saveFileRecordAction(input: SaveFileRecordInput): Promise<SaveFileRecordResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const fileRecord = await insertFile({
      user_id: user.id,
      name: input.fileName,
      size: input.fileSize,
      type: input.mimeType,
      cloudinary_public_id: input.publicId,
      cloudinary_secure_url: input.secureUrl,
      ocr_status: "pending",
      is_deleted: false,
    });

    // Update storage quota asynchronously (best-effort)
    await incrementUserStorageUsed(user.id, input.fileSize).catch(console.error);

    return { file: fileRecord };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save file record";
    return { error: message };
  }
}
