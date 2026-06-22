"use server";

import { createClient } from "@/lib/supabase/server";
import { extractPages } from "@/lib/pdf/extract-service";
import { validatePdf } from "@/lib/pdf/pdf-service";
import { z } from "zod";

const schema = z.object({
  pages: z.array(z.number().int().min(1)).min(1, "At least one page is required"),
});

export interface ExtractPagesActionResult {
  buffer?: string;
  pageCount?: number;
  sizeBytes?: number;
  error?: string;
}

function parsePages(raw: FormDataEntryValue | null): number[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));
}

export async function extractPagesAction(formData: FormData): Promise<ExtractPagesActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No PDF file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF" };

  const pages = parsePages(formData.get("pages"));
  const validated = schema.safeParse({ pages });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const buf = Buffer.from(await file.arrayBuffer());
  const validation = await validatePdf(buf);
  if (!validation.valid) return { error: validation.error };

  try {
    const result = await extractPages({ buffer: buf, pages: validated.data.pages });
    return {
      buffer: result.buffer.toString("base64"),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Extract failed" };
  }
}
