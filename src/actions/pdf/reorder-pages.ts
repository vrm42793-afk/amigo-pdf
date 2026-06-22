"use server";

import { createClient } from "@/lib/supabase/server";
import { reorderPdfPages } from "@/lib/pdf/reorder-service";
import { validatePdf } from "@/lib/pdf/pdf-service";
import { z } from "zod";

const schema = z.object({
  newOrder: z.array(z.number().int().min(1)).min(1),
});

export interface ReorderPagesActionResult {
  buffer?: string;
  pageCount?: number;
  sizeBytes?: number;
  error?: string;
}

export async function reorderPagesAction(formData: FormData): Promise<ReorderPagesActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No PDF file provided" };
  if (file.type !== "application/pdf") return { error: "File must be a PDF" };

  const newOrderRaw = formData.get("newOrder");
  let newOrder: number[] = [];
  try {
    newOrder = JSON.parse(String(newOrderRaw)) as number[];
  } catch {
    return { error: "Invalid newOrder format. Expected JSON array of page numbers." };
  }

  const validated = schema.safeParse({ newOrder });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const buf = Buffer.from(await file.arrayBuffer());
  const validation = await validatePdf(buf);
  if (!validation.valid) return { error: validation.error };

  try {
    const result = await reorderPdfPages({ buffer: buf, newOrder: validated.data.newOrder });
    return {
      buffer: result.buffer.toString("base64"),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reorder failed" };
  }
}
