"use server";

import { createClient } from "@/lib/supabase/server";
import { ocrImage } from "@/lib/ocr/image-ocr-service";
import { createOcrJob, completeOcrJob, failOcrJob } from "@/lib/ocr/ocr-service";
import { z } from "zod";
import type { OcrImageResult } from "@/types/ocr/ocr.types";
import type { Json } from "@/types/database.types";

const schema = z.object({
  language: z.enum(["eng", "spa", "fra", "deu", "hin", "tel", "tam", "kan"]).optional(),
});

export interface OcrImageActionResult {
  jobId?: string;
  result?: OcrImageResult;
  error?: string;
}

export async function ocrImageAction(formData: FormData): Promise<OcrImageActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No image file provided" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };

  const validated = schema.safeParse({ language: formData.get("language") });
  if (!validated.success) return { error: validated.error.issues[0].message };

  let jobId = "";
  try {
    jobId = await createOcrJob({ userId: user.id });
  } catch {
    return { error: "Failed to initialize OCR job" };
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await ocrImage({ buffer: buf, language: validated.data.language });
    
    await completeOcrJob(jobId, result as unknown as Json);
    return { jobId, result };
  } catch {
    const msg = "OCR failed";
    await failOcrJob(jobId, msg);
    return { jobId, error: msg };
  }
}
