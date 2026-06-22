import { createClient } from "@/lib/supabase/server";
import { RetrievalService } from "@/lib/gemini/retrieval";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { getPrompt } from "@/lib/gemini/prompt-library";
import { AIService } from "./ai-service";
import { AIChatMessage, AIChatSession, AISource } from "@/types/ai/ai.types";

export class ChatService {
  /**
   * Create a new chat session.
   */
  static async createSession(userId: string, fileId: string | null, title: string): Promise<AIChatSession> {
    const supabase = await createClient();
    
    // If fileId is provided, check ownership of file
    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("id")
        .eq("id", fileId)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (fileError || !file) {
        throw new Error("Unauthorized or invalid file.");
      }
    }

    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        file_id: fileId,
        title
      })
      .select()
      .single();

    if (error || !session) {
      throw new Error("Failed to create chat session: " + error?.message);
    }

    return session;
  }

  /**
   * Fetch all chat sessions for a user, optionally filtered by file.
   */
  static async getSessions(userId: string, fileId?: string | null): Promise<AIChatSession[]> {
    const supabase = await createClient();
    let query = supabase
      .from("chat_sessions")
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
      throw new Error("Failed to fetch sessions: " + error.message);
    }

    return data || [];
  }

  /**
   * Fetch messages of a session. Performs ownership check.
   */
  static async getSessionMessages(userId: string, sessionId: string): Promise<AIChatMessage[]> {
    const supabase = await createClient();

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (sessionError || !session) {
      throw new Error("Unauthorized or session not found.");
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("id, role, message, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("Failed to fetch messages: " + error.message);
    }

    // Map DB schema role (text) to exact type
    return (messages || []).map(m => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      message: m.message,
      created_at: m.created_at
    }));
  }

  /**
   * Delete a chat session. Performs ownership check.
   */
  static async deleteSession(userId: string, sessionId: string): Promise<void> {
    const supabase = await createClient();

    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (sessionError || !session) {
      throw new Error("Unauthorized or session not found.");
    }

    await supabase.from("chat_sessions").delete().eq("id", sessionId);
  }

  /**
   * Decoupled generator for streaming a response.
   * Performs retrieval, saves messages, yields chunks, and logs token usage.
   */
  static async *streamChatResponse(
    userId: string,
    sessionId: string,
    message: string
  ): AsyncGenerator<{ text: string; sources?: AISource[] }> {
    const supabase = await createClient();

    // 1. Verify session ownership and get file_id
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("file_id, title")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (sessionError || !session) {
      throw new Error("Unauthorized or session not found.");
    }

    // 2. Enforce AI rate limiting
    const rateLimit = await AIService.checkRateLimit(userId, "chat");
    if (!rateLimit.allowed) {
      yield { text: "Rate limit exceeded. Please wait and try again in an hour." };
      return;
    }

    // 3. Save user query in chat_messages table
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      message
    });

    // 4. Retrieve context if session is tied to a file
    let sources: AISource[] = [];
    let contextText = "No document context available.";
    
    if (session.file_id) {
      const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
      try {
        await DocumentProcessor.ensureDocumentProcessed(session.file_id, userId);
        sources = await RetrievalService.retrieveRelevantChunks(session.file_id, message);
      } catch (err: unknown) {
        console.error("Document preprocessing failed:", err);
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        yield { text: `[System Note: Failed to process document. Chatting without context. Error: ${errMsg}]` };
      }
      
      if (sources.length > 0) {
        contextText = sources
          .map((s, idx) => `[Source ${idx + 1}] (Page ${s.pageNumber ?? "unknown"}, Section: ${s.sectionTitle ?? "General"}):\n${s.chunkText}`)
          .join("\n\n");
      }
    }

    // Yield sources immediately to the frontend so it can display them
    if (sources.length > 0) {
      yield { text: "", sources };
    }

    // 5. Build prompt
    const basePrompt = await getPrompt("chat");
    const systemPrompt = basePrompt
      .replace("{context}", contextText)
      .replace("{query}", message);

    // 6. Request streaming from Gemini Service
    let assistantText = "";
    let finalInputTokens = 0;
    let finalOutputTokens = 0;

    const stream = GeminiService.streamResponse(message, systemPrompt);

    for await (const chunk of stream) {
      if (chunk.text) {
        assistantText += chunk.text;
        yield { text: chunk.text };
      }
      if (chunk.tokensInput !== undefined) {
        finalInputTokens = chunk.tokensInput;
      }
      if (chunk.tokensOutput !== undefined) {
        finalOutputTokens = chunk.tokensOutput;
      }
    }

    // 7. Save assistant response to database
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      message: assistantText
    });

    // 8. Log usage
    await AIService.logUsage(userId, "chat", finalInputTokens, finalOutputTokens, "gemini-2.5-flash");
  }
}
