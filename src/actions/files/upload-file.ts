"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadFileService } from "@/server/files/file-service";
import type { FileRow } from "@/types/files.types";

export interface UploadFileActionResult {
  file?: FileRow;
  error?: string;
}

export async function uploadFileAction(formData: FormData): Promise<UploadFileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFile = formData.get("file");
  if (!(rawFile instanceof File)) {
    return { error: "No file provided" };
  }

  try {
    const fileBuffer = Buffer.from(await rawFile.arrayBuffer());

    const fileRecord = await uploadFileService({
      fileBuffer,
      fileName: rawFile.name,
      mimeType: rawFile.type,
      fileSize: rawFile.size,
      userId: user.id,
    });

    return { file: fileRecord };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { error: message };
  }
}
