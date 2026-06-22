"use server";

import { createClient } from "@/lib/supabase/server";
import { splitPdf, parsePageRangeString } from "@/lib/pdf/split-service";
import { validatePdf } from "@/lib/pdf/pdf-service";
import { z } from "zod";

const splitSchema = z.object({
  rangeString: z
    .string()
    .min(1, "Page ranges are required")
    .regex(/^[\d,\-\s]+$/, "Invalid range format. Use: 1-3, 5, 7-10"),
});

export interface SplitPdfActionResult {
  parts?: Array<{ buffer: string; pageCount: number; sizeBytes: number }>;
  error?: string;
}

export async function splitPdfAction(formData: FormData): Promise<SplitPdfActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No PDF file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF" };

  const rangeStringRaw = formData.get("rangeString");
  const validated = splitSchema.safeParse({ rangeString: rangeStringRaw });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const buf = Buffer.from(await file.arrayBuffer());
  const validation = await validatePdf(buf);
  if (!validation.valid) return { error: validation.error };

  try {
    const ranges = parsePageRangeString(validated.data.rangeString);
    const result = await splitPdf({ buffer: buf, ranges });
    return {
      parts: result.parts.map((p) => ({
        buffer: p.buffer.toString("base64"),
        pageCount: p.pageCount,
        sizeBytes: p.sizeBytes,
      })),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Split failed" };
  }
}
