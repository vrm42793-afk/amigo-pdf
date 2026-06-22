"use server";

import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/server/ai/chat-service";
import { z } from "zod";

const createSessionSchema = z.object({
  fileId: z.string().uuid().nullable(),
  title: z.string().min(1, "Title is required").max(100)
});

const deleteSessionSchema = z.object({
  sessionId: z.string().uuid()
});

export async function createChatSession(formData: { fileId: string | null; title: string }) {
  try {
    const validated = createSessionSchema.parse(formData);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const session = await ChatService.createSession(user.id, validated.fileId, validated.title);
    return { success: true, data: session };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create chat session" };
  }
}

export async function getChatSessions(fileId?: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const sessions = await ChatService.getSessions(user.id, fileId);
    return { success: true, data: sessions };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch chat sessions" };
  }
}

export async function getChatMessages(sessionId: string) {
  try {
    const validatedId = z.string().uuid().parse(sessionId);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const messages = await ChatService.getSessionMessages(user.id, validatedId);
    return { success: true, data: messages };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch chat messages" };
  }
}

export async function deleteChatSession(sessionId: string) {
  try {
    const validated = deleteSessionSchema.parse({ sessionId });
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await ChatService.deleteSession(user.id, validated.sessionId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete chat session" };
  }
}

export async function getChatStream(userId: string, sessionId: string, message: string) {
  return ChatService.streamChatResponse(userId, sessionId, message);
}
