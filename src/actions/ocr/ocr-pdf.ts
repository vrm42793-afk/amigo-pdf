"use server";

import { createClient } from "@/lib/supabase/server";
import { ocrPdf } from "@/lib/ocr/pdf-ocr-service";
import { createOcrJob, updateOcrJobProgress, completeOcrJob, failOcrJob } from "@/lib/ocr/ocr-service";
import { z } from "zod";
import type { OcrPdfResult } from "@/types/ocr/ocr.types";
import type { Json } from "@/types/database.types";

const schema = z.object({
  language: z.enum(["eng", "spa", "fra", "deu", "hin", "tel", "tam", "kan"]).optional(),
});

export interface OcrPdfActionResult {
  jobId?: string;
  result?: OcrPdfResult;
  error?: string;
}

export async function ocrPdfAction(formData: FormData): Promise<OcrPdfActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No PDF file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF" };

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
    
    // In a real serverless env (Vercel), this may time out for large PDFs.
    // Progress callback updates DB for the frontend to poll.
    const result = await ocrPdf({ buffer: buf, language: validated.data.language }, async (progress) => {
      // Avoid awaiting to not block processing, or await to ensure sync
      updateOcrJobProgress(jobId, progress).catch(() => {});
    });
    
    await completeOcrJob(jobId, result as unknown as Json);
    return { jobId, result };
  } catch {
    const msg = "OCR failed";
    await failOcrJob(jobId, msg);
    return { jobId, error: msg };
  }
}
