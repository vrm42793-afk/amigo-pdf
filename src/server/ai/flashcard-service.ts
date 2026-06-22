import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { getPrompt } from "@/lib/gemini/prompt-library";
import { AIService } from "./ai-service";
import { AIFlashcard, AIFlashcardDeck } from "@/types/ai/ai.types";
import type { Json } from "@/types/database.types";

export class FlashcardService {
  /**
   * Generate and persist a flashcard deck from a document.
   */
  static async generateDeck(
    userId: string,
    fileId: string,
    deckName?: string
  ): Promise<AIFlashcardDeck> {
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
    const rateLimit = await AIService.checkRateLimit(userId, "flashcards");
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
    const promptTemplate = await getPrompt("flashcards");
    const formattedPrompt = promptTemplate.replace("{content}", fullContent);

    // Call Gemini with JSON mode
    const result = await GeminiService.generateFlashcards(formattedPrompt);

    // Parse the JSON array
    let cards: AIFlashcard[] = [];
    try {
      // Clean up markdown fences if Gemini returned them despite prompt instruction
      let jsonText = result.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      cards = JSON.parse(jsonText) as AIFlashcard[];
    } catch (e) {
      console.error("Failed to parse flashcards JSON:", result.text, e);
      throw new Error("Failed to generate structured flashcards. Please try again.");
    }

    const finalDeckName = deckName || `Flashcards - ${file.name}`;
    const { data: deck, error: insertError } = await supabase
      .from("flashcards")
      .insert({
        user_id: userId,
        file_id: fileId,
        deck_name: finalDeckName,
        cards: cards as unknown as Json // Supabase JSON type casting
      })
      .select()
      .single();

    if (insertError || !deck) {
      throw new Error("Failed to save flashcards deck: " + insertError?.message);
    }

    // 6. Log token usage
    await AIService.logUsage(
      userId,
      "flashcards",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return {
      id: deck.id,
      user_id: deck.user_id,
      file_id: deck.file_id,
      deck_name: deck.deck_name,
      cards: deck.cards as unknown as AIFlashcard[],
      created_at: deck.created_at,
      updated_at: deck.updated_at
    };
  }

  /**
   * Fetch all flashcard decks for a user, optionally filtered by file.
   */
  static async getUserDecks(userId: string, fileId?: string | null): Promise<AIFlashcardDeck[]> {
    const supabase = await createClient();
    let query = supabase
      .from("flashcards")
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
      throw new Error("Failed to fetch flashcard decks: " + error.message);
    }

    return (data || []).map((deck) => ({
      id: deck.id,
      user_id: deck.user_id,
      file_id: deck.file_id,
      deck_name: deck.deck_name,
      cards: deck.cards as unknown as AIFlashcard[],
      created_at: deck.created_at,
      updated_at: deck.updated_at
    }));
  }

  /**
   * Delete a deck. Performs ownership check.
   */
  static async deleteDeck(userId: string, deckId: string): Promise<void> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Unauthorized or deck not found.");
    }

    await supabase.from("flashcards").delete().eq("id", deckId);
  }
}
