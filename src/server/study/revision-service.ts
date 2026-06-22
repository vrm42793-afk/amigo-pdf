import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { AIService } from "@/server/ai/ai-service";
import { StudyNote, StudyNoteType } from "@/types/study/study.types";

export class RevisionService {
  /**
   * Retrieve or generate structured study notes of the specified type.
   */
  static async getRevisionNotes(
    userId: string,
    fileId: string,
    type: StudyNoteType
  ): Promise<StudyNote> {
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
      .eq("type", type)
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

    // 6. Formulate system instruction and prompt based on note type
    let systemInstruction = "";
    let prompt = "";

    if (type === "unit_notes") {
      systemInstruction = "You are an expert university professor. Your job is to create detailed, comprehensive, unit-by-unit revision study notes.";
      prompt = `Generate structured, comprehensive, unit-wise revision study notes based on the following document content.
Divide the notes clearly into units or chapters. Use detailed bullet points, bold terminology definitions, and clean headings.
Document title: ${file.name}

Document content:
${fullContent}`;
    } else if (type === "summary_sheet") {
      systemInstruction = "You are an expert academic tutor specializing in last-minute test preparation cram notes.";
      prompt = `Create a concise, high-impact last-minute revision summary sheet from the following document content.
Focus on highly testable definitions, core formulas, bulleted quick-cram summaries, and primary facts. Keep it easy to read rapidly.
Document title: ${file.name}

Document content:
${fullContent}`;
    } else if (type === "formula_sheet") {
      systemInstruction = "You are an expert mathematics, physics, and science tutor specializing in extracting technical reference metrics.";
      prompt = `Extract all formulas, equations, mathematical relationships, chemical formulas, physical constants, and variables from the following document content.
For each formula, list:
- The formula itself (formatted in clear notation or LaTeX-like text)
- Variable descriptions (what each letter or constant represents)
- Simple, clear explanations of when and how to apply it.
If the document content does not contain equations or mathematical formulas, explain the main process workflows, quantitative metrics, or core scientific principles instead.
Document title: ${file.name}

Document content:
${fullContent}`;
    }

    // 7. Invoke Gemini Client
    const result = await GeminiService.generateText(prompt, systemInstruction);

    // 8. Insert record in study_notes table
    const titleText = type === "unit_notes"
      ? `Unit-wise Study Notes: ${file.name}`
      : type === "summary_sheet"
        ? `Last-Minute Cram Sheet: ${file.name}`
        : `Formula & Technical Reference: ${file.name}`;

    const { data: newNote, error: insertError } = await supabase
      .from("study_notes")
      .insert({
        user_id: userId,
        file_id: fileId,
        type,
        title: titleText,
        content: result.text,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error("Failed to save study notes: " + insertError.message);
    }

    // 9. Log token usage
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
