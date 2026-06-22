import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { getPrompt } from "@/lib/gemini/prompt-library";
import { AIService } from "./ai-service";
import { AISummaryType } from "@/types/ai/ai.types";

export class SummaryService {
  /**
   * Generate or retrieve a cached summary for a document.
   */
  static async getSummary(
    userId: string,
    fileId: string,
    summaryType: AISummaryType
  ): Promise<string> {
    const supabase = await createClient();

    // 1. Verify file ownership
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id")
      .eq("id", fileId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fileError || !file) {
      throw new Error("Unauthorized or file not found.");
    }

    // 2. Check cache first
    const { data: cachedSummary, error: cacheError } = await supabase
      .from("generated_summaries")
      .select("content")
      .eq("file_id", fileId)
      .eq("summary_type", summaryType)
      .maybeSingle();

    if (!cacheError && cachedSummary) {
      return cachedSummary.content;
    }

    // 3. Enforce rate limiting
    const rateLimit = await AIService.checkRateLimit(userId, "summary");
    if (!rateLimit.allowed) {
      throw new Error("Rate limit exceeded. Please wait and try again in an hour.");
    }

    // 4. Ensure document is processed and chunks exist
    const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
    await DocumentProcessor.ensureDocumentProcessed(fileId, userId);

    // 5. Fetch all document chunks ordered by chunk_index to recreate content
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      throw new Error("No extracted content available for this file. Please process/OCR the file first.");
    }

    const fullContent = chunks.map((c) => c.content).join("\n\n");

    // 5. Load prompt and generate
    const promptTemplate = await getPrompt("summary");
    const formattedPrompt = promptTemplate
      .replace("{summary_type}", summaryType)
      .replace("{content}", fullContent);

    const result = await GeminiService.summarize(formattedPrompt);

    // 6. Cache the generated summary in database
    await supabase.from("generated_summaries").insert({
      user_id: userId,
      file_id: fileId,
      summary_type: summaryType,
      content: result.text
    });

    // 7. Log token usage
    await AIService.logUsage(
      userId,
      "summary",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return result.text;
  }

  /**
   * Fetch all cached summaries for a user/file.
   */
  static async getCachedSummariesForFile(userId: string, fileId: string): Promise<unknown[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("generated_summaries")
      .select("id, summary_type, content, created_at")
      .eq("user_id", userId)
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch cached summaries: " + error.message);
    }
    return data || [];
  }
}
