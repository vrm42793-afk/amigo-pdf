"use server";

import { createClient } from "@/lib/supabase/server";
import { createSearchablePdf } from "@/lib/ocr/searchable-pdf-service";
import { createOcrJob, updateOcrJobProgress, completeOcrJob, failOcrJob } from "@/lib/ocr/ocr-service";
import { z } from "zod";
import type { Json } from "@/types/database.types";

const schema = z.object({
  language: z.enum(["eng", "spa", "fra", "deu", "hin", "tel", "tam", "kan"]).optional(),
});

export interface SearchablePdfActionResult {
  jobId?: string;
  buffer?: string;
  pageCount?: number;
  sizeBytes?: number;
  error?: string;
}

export async function createSearchablePdfAction(formData: FormData): Promise<SearchablePdfActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF for searchable PDF generation" };

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
    
    const result = await createSearchablePdf({ buffer: buf, language: validated.data.language }, (progress) => {
      updateOcrJobProgress(jobId, progress).catch(() => {});
    });
    
    await completeOcrJob(jobId, { status: "success", generatedPdfSize: result.sizeBytes } as unknown as Json);
    return {
      jobId,
      buffer: result.buffer.toString("base64"),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Searchable PDF generation failed";
    await failOcrJob(jobId, msg);
    return { jobId, error: msg };
  }
}
