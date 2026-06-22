"use server";

import { createClient } from "@/lib/supabase/server";
import { FlashcardService } from "@/server/ai/flashcard-service";
import { z } from "zod";

const generateDeckSchema = z.object({
  fileId: z.string().uuid(),
  deckName: z.string().max(100).optional()
});

export async function generateFlashcardDeck(formData: { fileId: string; deckName?: string }) {
  try {
    const validated = generateDeckSchema.parse(formData);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const deck = await FlashcardService.generateDeck(
      user.id,
      validated.fileId,
      validated.deckName
    );

    return { success: true, data: deck };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to generate flashcard deck" };
  }
}

export async function getUserDecks(fileId?: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const decks = await FlashcardService.getUserDecks(user.id, fileId);
    return { success: true, data: decks };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch flashcard decks" };
  }
}

export async function deleteFlashcardDeck(deckId: string) {
  try {
    const validatedId = z.string().uuid().parse(deckId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await FlashcardService.deleteDeck(user.id, validatedId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete flashcard deck" };
  }
}
