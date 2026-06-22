"use server";

import { createClient } from "@/lib/supabase/server";
import { mergePdfs } from "@/lib/pdf/merge-service";
import { validatePdf } from "@/lib/pdf/pdf-service";

export interface MergePdfActionResult {
  buffer?: string; // base64
  pageCount?: number;
  sizeBytes?: number;
  error?: string;
}

export async function mergePdfAction(formData: FormData): Promise<MergePdfActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const files = formData.getAll("files") as File[];
  if (files.length < 2) return { error: "At least 2 PDF files are required" };

  const buffers: Buffer[] = [];
  for (const file of files) {
    if (file.type !== "application/pdf") return { error: `${file.name} is not a PDF` };
    const buf = Buffer.from(await file.arrayBuffer());
    const validation = await validatePdf(buf);
    if (!validation.valid) return { error: `${file.name}: ${validation.error}` };
    buffers.push(buf);
  }

  try {
    const result = await mergePdfs({ buffers, preserveMetadata: true });
    return {
      buffer: result.buffer.toString("base64"),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Merge failed" };
  }
}
