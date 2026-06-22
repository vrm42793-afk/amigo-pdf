import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { AIService } from "@/server/ai/ai-service";
import { getFileById } from "@/server/files/file-repository";
import { InterviewSession } from "@/types/study/study.types";

export class InterviewService {
  /**
   * Start a new mock interview session, generating the first question.
   */
  static async startSession(userId: string, fileId: string): Promise<InterviewSession> {
    const supabase = await createClient();

    // 1. Verify file ownership
    const file = await getFileById(fileId, userId);
    if (!file) {
      throw new Error("Unauthorized or file not found.");
    }

    // 2. Ensure document chunks exist
    const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
    await DocumentProcessor.ensureDocumentProcessed(fileId, userId);

    // 3. Fetch first few chunks for context
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true })
      .limit(5);

    const context = (chunks || []).map((c) => c.content).join("\n\n");

    // 4. Generate first question using Gemini
    const prompt = `You are a professional technical interviewer testing a student on the topics inside this document.
Formulate a direct, challenging question to assess their understanding of the core concepts in the text.
Do not ask multiple questions. Ask exactly one question.
Document title: ${file.name}

Document content:
${context}`;

    const systemInstruction = "You are a professional mock interviewer. You ask challenging, clear technical questions.";
    const result = await GeminiService.generateText(prompt, systemInstruction);
    const question = result.text.trim();

    // 5. Create active session in database
    const { data: session, error } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: userId,
        file_id: fileId,
        status: "active",
        current_question_index: 1,
        dialogue_history: [
          {
            role: "assistant",
            text: question,
          },
        ],
      })
      .select()
      .single();

    if (error || !session) {
      throw new Error("Failed to start mock interview session: " + error?.message);
    }

    // 6. Log usage
    await AIService.logUsage(
      userId,
      "chat",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return session as InterviewSession;
  }

  /**
   * Submit an answer, receive scoring/feedback, and generate the next question.
   */
  static async submitAnswer(
    userId: string,
    sessionId: string,
    answerText: string
  ): Promise<InterviewSession> {
    const supabase = await createClient();

    // 1. Fetch active session
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session || session.status !== "active") {
      throw new Error("Mock interview session not found or already completed.");
    }

    // Get the last question asked
    const history = session.dialogue_history as InterviewSession["dialogue_history"];
    const lastQuestion = history[history.length - 1]?.text || "Explain the main topic.";

    // 2. Fetch doc chunks for visual context
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", session.file_id)
      .order("chunk_index", { ascending: true })
      .limit(10);

    const context = (chunks || []).map((c) => c.content).join("\n\n");

    const totalQuestionsLimit = 5;
    const isLastRound = session.current_question_index >= totalQuestionsLimit;

    // 3. Prompt Gemini to evaluate last answer and yield feedback + next question
    const systemInstruction = "You are a professional mock interviewer. You evaluate student responses in JSON format.";
    const prompt = `Read the student's answer to your last question and evaluate it.
Last Question: ${lastQuestion}
Student Answer: ${answerText}

Perform the following tasks:
1. Grade the answer on a scale from 0 to 100.
2. Provide constructive feedback detailing what they got correct and what key points they missed.
3. If this is round ${session.current_question_index} of ${totalQuestionsLimit} (isLastRound: ${isLastRound}), write "Interview complete." under next_question. Otherwise, formulate the next challenging question based on the document content.

Output your response ONLY as a JSON object matching this schema:
{
  "score": number,
  "feedback": "string",
  "next_question": "string"
}

Document content:
${context}`;

    const result = await GeminiService.generateJson(prompt, systemInstruction);
    let parsed: { score: number; feedback: string; next_question: string };

    try {
      parsed = JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse mock interview evaluation JSON:", result.text, e);
      throw new Error("Failed to evaluate your answer. Please try again.");
    }

    // 4. Update dialog history
    const nextHistory = [
      ...history,
      {
        role: "user",
        text: answerText,
        feedback: parsed.feedback,
        score: parsed.score,
      },
    ];

    let nextStatus = "active";
    if (isLastRound || parsed.next_question === "Interview complete.") {
      nextStatus = "completed";
    } else {
      nextHistory.push({
        role: "assistant",
        text: parsed.next_question,
      });
    }

    // 5. Update session in database
    const { data: updatedSession, error: updateError } = await supabase
      .from("interview_sessions")
      .update({
        status: nextStatus,
        current_question_index: session.current_question_index + (nextStatus === "active" ? 1 : 0),
        dialogue_history: nextHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      throw new Error("Failed to update interview session: " + updateError?.message);
    }

    // 6. Log usage
    await AIService.logUsage(
      userId,
      "chat",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return updatedSession as InterviewSession;
  }

  /**
   * Fetch all interview sessions for a user's file.
   */
  static async getSessions(userId: string, fileId: string): Promise<InterviewSession[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch mock interview sessions: " + error.message);
    }
    return data as InterviewSession[];
  }
}
