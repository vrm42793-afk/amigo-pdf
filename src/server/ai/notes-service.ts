import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { getPrompt } from "@/lib/gemini/prompt-library";
import { AIService } from "./ai-service";
import { AINoteType, AINote } from "@/types/ai/ai.types";

export class NotesService {
  /**
   * Generate and persist study notes from a document.
   */
  static async generateNotes(
    userId: string,
    fileId: string,
    noteType: AINoteType,
    title: string
  ): Promise<AINote> {
    const supabase = await createClient();

    // 1. Verify file ownership
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, name")
      .eq("id", fileId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fileError || !file) {
      throw new Error("Unauthorized or file not found.");
    }

    // 2. Enforce rate limiting
    const rateLimit = await AIService.checkRateLimit(userId, "notes");
    if (!rateLimit.allowed) {
      throw new Error("Rate limit exceeded. Please wait and try again in an hour.");
    }

    // 3. Ensure document is processed and chunks exist
    const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
    await DocumentProcessor.ensureDocumentProcessed(fileId, userId);

    // 4. Fetch document chunks
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      throw new Error("No extracted content available for this file. Please process/OCR the file first.");
    }

    const fullContent = chunks.map((c) => c.content).join("\n\n");

    // 4. Construct prompt and generate
    const promptTemplate = await getPrompt("notes");
    const formattedPrompt = promptTemplate
      .replace("{note_type}", noteType)
      .replace("{content}", fullContent);

    const result = await GeminiService.generateNotes(formattedPrompt);

    // 5. Save generated notes in public.notes
    const noteTitle = title || `${noteType.toUpperCase()} Notes - ${file.name}`;
    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        file_id: fileId,
        title: noteTitle,
        content: result.text,
        notes_type: noteType,
        note_type: noteType,
        ai_generated: true
      })
      .select()
      .single();

    if (insertError || !note) {
      throw new Error("Failed to save generated notes: " + insertError?.message);
    }

    // 6. Log token usage
    await AIService.logUsage(
      userId,
      "notes",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return {
      id: note.id,
      user_id: note.user_id,
      file_id: note.file_id,
      title: note.title,
      content: note.content,
      notes_type: note.notes_type,
      note_type: note.note_type as AINoteType,
      ai_generated: note.ai_generated,
      created_at: note.created_at,
      updated_at: note.updated_at
    };
  }

  /**
   * Fetch all notes for a user, optionally filtered by file.
   */
  static async getUserNotes(userId: string, fileId?: string | null): Promise<AINote[]> {
    const supabase = await createClient();
    let query = supabase
      .from("notes")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fileId !== undefined) {
      if (fileId === null) {
        query = query.is("file_id", null);
      } else {
        query = query.eq("file_id", fileId);
      }
    }

    const { data, error } = await query;
    if (error) {
      throw new Error("Failed to fetch notes: " + error.message);
    }

    return (data || []).map((note) => ({
      id: note.id,
      user_id: note.user_id,
      file_id: note.file_id,
      title: note.title,
      content: note.content,
      notes_type: note.notes_type,
      note_type: (note.note_type || note.notes_type) as AINoteType,
      ai_generated: note.ai_generated || false,
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  }

  /**
   * Delete notes record. Performs ownership check.
   */
  static async deleteNote(userId: string, noteId: string): Promise<void> {
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", noteId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError || !data) {
      throw new Error("Unauthorized or note not found.");
    }

    await supabase.from("notes").delete().eq("id", noteId);
  }
}
