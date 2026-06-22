"use server";

import { createClient } from "@/lib/supabase/server";
import { rotatePdf } from "@/lib/pdf/rotate-service";
import { validatePdf } from "@/lib/pdf/pdf-service";
import { z } from "zod";

const schema = z.object({
  degrees: z.union([z.literal(90), z.literal(180), z.literal(270)]),
  pages: z.array(z.number().int().positive()).optional(),
});

export interface RotatePdfActionResult {
  buffer?: string;
  pageCount?: number;
  sizeBytes?: number;
  error?: string;
}

export async function rotatePdfAction(formData: FormData): Promise<RotatePdfActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No PDF file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF" };

  const degreesRaw = parseInt(formData.get("degrees") as string, 10);
  const pagesRaw = formData.get("pages");
  const pages = pagesRaw
    ? String(pagesRaw).split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean)
    : undefined;

  const validated = schema.safeParse({ degrees: degreesRaw, pages });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const buf = Buffer.from(await file.arrayBuffer());
  const validation = await validatePdf(buf);
  if (!validation.valid) return { error: validation.error };

  try {
    const result = await rotatePdf({
      buffer: buf,
      degrees: validated.data.degrees,
      pages: validated.data.pages,
    });
    return {
      buffer: result.buffer.toString("base64"),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Rotate failed" };
  }
}
