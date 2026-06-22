import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { AIService } from "@/server/ai/ai-service";
import { StudyNote } from "@/types/study/study.types";

export class MindMapService {
  /**
   * Retrieve or generate a Mermaid.js mindmap diagram for a document.
   */
  static async getMindMap(userId: string, fileId: string): Promise<StudyNote> {
    const supabase = await createClient();

    // 1. Verify file ownership/access
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, name")
      .eq("id", fileId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fileError || !file) {
      throw new Error("Unauthorized or file not found.");
    }

    // 2. Check study_notes cache
    const { data: cachedNote } = await supabase
      .from("study_notes")
      .select("*")
      .eq("file_id", fileId)
      .eq("type", "mindmap")
      .maybeSingle();

    if (cachedNote) {
      return cachedNote as StudyNote;
    }

    // 3. Enforce rate limiting
    const rateLimit = await AIService.checkRateLimit(userId, "summary");
    if (!rateLimit.allowed) {
      throw new Error("Rate limit exceeded. Please wait and try again in an hour.");
    }

    // 4. Ensure document is processed and chunks exist
    const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
    await DocumentProcessor.ensureDocumentProcessed(fileId, userId);

    // 5. Fetch all document chunks ordered by chunk_index
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      throw new Error("No extracted content available for this file. Please process/OCR the file first.");
    }

    const fullContent = chunks.map((c) => c.content).join("\n\n");

    // 6. Build prompt for syntax-compliant Mermaid mindmap
    const systemInstruction = "You are an expert tutor who structures document concepts into clean hierarchical mindmap diagrams.";
    const prompt = `Create a hierarchical concept map of the main subjects, topics, and subtopics in the provided document content.
Output the concept map ONLY as a valid Mermaid.js mindmap diagram markup string.
The markup MUST start with "mindmap" on its own line, followed by indentation representing the node hierarchy.
Keep node labels brief (1 to 4 words maximum).
Do NOT include any HTML formatting tags, special characters, or symbols that would break the Mermaid.js parser.
Example structure:
mindmap
  root((Subject Name))
    Core Concept 1
      Subconcept 1a
      Subconcept 1b
    Core Concept 2
      Subconcept 2a

Document title: ${file.name}

Document content:
${fullContent}`;

    // 7. Invoke Gemini Client
    const result = await GeminiService.generateText(prompt, systemInstruction);

    // 8. Clean result: remove markdown code fences if present (e.g. ```mermaid ... ```)
    let cleanText = result.text.trim();
    if (cleanText.startsWith("```mermaid")) {
      cleanText = cleanText.replace(/^```mermaid\s*/, "").replace(/\s*```$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    cleanText = cleanText.trim();

    // 9. Save study note in database
    const { data: newNote, error: insertError } = await supabase
      .from("study_notes")
      .insert({
        user_id: userId,
        file_id: fileId,
        type: "mindmap",
        title: `Mind Map: ${file.name}`,
        content: cleanText,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error("Failed to save mindmap: " + insertError.message);
    }

    // 10. Log token usage
    await AIService.logUsage(
      userId,
      "summary",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return newNote as StudyNote;
  }
}
