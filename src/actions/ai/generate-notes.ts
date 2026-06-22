"use server";

import { createClient } from "@/lib/supabase/server";
import { NotesService } from "@/server/ai/notes-service";
import { AINoteType } from "@/types/ai/ai.types";
import { z } from "zod";

const generateNotesSchema = z.object({
  fileId: z.string().uuid(),
  noteType: z.enum(["study", "structured", "bullet", "revision"]),
  title: z.string().max(100).optional()
});

export async function generateStudyNotes(formData: { fileId: string; noteType: string; title?: string }) {
  try {
    const validated = generateNotesSchema.parse(formData);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const note = await NotesService.generateNotes(
      user.id,
      validated.fileId,
      validated.noteType as AINoteType,
      validated.title || ""
    );

    return { success: true, data: note };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to generate study notes" };
  }
}

export async function getUserNotes(fileId?: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const notes = await NotesService.getUserNotes(user.id, fileId);
    return { success: true, data: notes };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch notes" };
  }
}

export async function deleteNote(noteId: string) {
  try {
    const validatedId = z.string().uuid().parse(noteId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await NotesService.deleteNote(user.id, validatedId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete note" };
  }
}
