"use server";

import { createClient } from "@/lib/supabase/server";
import { compressPdf } from "@/lib/pdf/compress-service";
import { validatePdf } from "@/lib/pdf/pdf-service";
import { z } from "zod";
import type { CompressionLevel } from "@/types/pdf/pdf.types";

const schema = z.object({
  level: z.enum(["low", "medium", "high"]),
});

export interface CompressPdfActionResult {
  buffer?: string;
  pageCount?: number;
  sizeBytes?: number;
  originalSizeBytes?: number;
  compressionRatio?: number;
  level?: CompressionLevel;
  error?: string;
}

export async function compressPdfAction(formData: FormData): Promise<CompressPdfActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No PDF file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF" };

  const validated = schema.safeParse({ level: formData.get("level") ?? "medium" });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const buf = Buffer.from(await file.arrayBuffer());
  const validation = await validatePdf(buf);
  if (!validation.valid) return { error: validation.error };

  try {
    const result = await compressPdf({ buffer: buf, level: validated.data.level });
    return {
      buffer: result.buffer.toString("base64"),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
      originalSizeBytes: result.originalSizeBytes,
      compressionRatio: result.compressionRatio,
      level: result.level,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Compress failed" };
  }
}
