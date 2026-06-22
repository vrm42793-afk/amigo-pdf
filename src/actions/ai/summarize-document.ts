"use server";

import { createClient } from "@/lib/supabase/server";
import { SummaryService } from "@/server/ai/summary-service";
import { AISummaryType } from "@/types/ai/ai.types";
import { z } from "zod";

const summarizeSchema = z.object({
  fileId: z.string().uuid(),
  summaryType: z.enum(["short", "detailed", "executive", "chapter", "bullet"])
});

export async function summarizeDocument(formData: { fileId: string; summaryType: string }) {
  try {
    const validated = summarizeSchema.parse(formData);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const summaryText = await SummaryService.getSummary(
      user.id,
      validated.fileId,
      validated.summaryType as AISummaryType
    );
    
    return { success: true, data: summaryText };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to generate summary" };
  }
}

export async function getCachedSummaries(fileId: string) {
  try {
    const validatedId = z.string().uuid().parse(fileId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const summaries = await SummaryService.getCachedSummariesForFile(user.id, validatedId);
    return { success: true, data: summaries };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch cached summaries" };
  }
}
