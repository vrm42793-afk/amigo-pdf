import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { getPrompt } from "@/lib/gemini/prompt-library";
import { AIService } from "./ai-service";
import { AIQuizType, AIQuizDifficulty, AIQuiz, AIQuizQuestion } from "@/types/ai/ai.types";
import type { Json } from "@/types/database.types";

export class QuizService {
  /**
   * Generate and persist a quiz from a document.
   */
  static async generateQuiz(
    userId: string,
    fileId: string,
    quizType: AIQuizType,
    difficulty: AIQuizDifficulty,
    title?: string
  ): Promise<AIQuiz> {
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
    const rateLimit = await AIService.checkRateLimit(userId, "quiz");
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
    const promptTemplate = await getPrompt("quiz");
    const formattedPrompt = promptTemplate
      .replace("{quiz_type}", quizType)
      .replace("{difficulty}", difficulty)
      .replace("{content}", fullContent);

    // Call Gemini with JSON mode
    const result = await GeminiService.generateQuiz(formattedPrompt);

    // Parse the JSON array
    let questions: AIQuizQuestion[] = [];
    try {
      let jsonText = result.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      questions = JSON.parse(jsonText) as AIQuizQuestion[];
    } catch (e) {
      console.error("Failed to parse quiz questions JSON:", result.text, e);
      throw new Error("Failed to generate structured quiz questions. Please try again.");
    }

    // 5. Insert quiz record into quizzes table
    const quizTitle = title || `Quiz (${difficulty.toUpperCase()}) - ${file.name}`;
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        file_id: fileId,
        title: quizTitle
      })
      .select()
      .single();

    if (quizError || !quiz) {
      throw new Error("Failed to create quiz: " + quizError?.message);
    }

    // 6. Insert questions into quiz_questions table
    const questionsToInsert = questions.map((q) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options as unknown as Json, // jsonb casting
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }));

    const { data: insertedQuestions, error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert)
      .select();

    if (questionsError) {
      // Clean up quiz if question insertion fails
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      throw new Error("Failed to save quiz questions: " + questionsError.message);
    }

    // 7. Log token usage
    await AIService.logUsage(
      userId,
      "quiz",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return {
      id: quiz.id,
      user_id: quiz.user_id,
      file_id: quiz.file_id,
      title: quiz.title,
      created_at: quiz.created_at,
      questions: (insertedQuestions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options as unknown as string[],
        correct_answer: q.correct_answer,
        explanation: q.explanation
      }))
    };
  }

  /**
   * Fetch a single quiz with its questions. Performs ownership check.
   */
  static async getQuiz(userId: string, quizId: string): Promise<AIQuiz> {
    const supabase = await createClient();

    // Verify ownership
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, user_id, file_id, title, created_at")
      .eq("id", quizId)
      .eq("user_id", userId)
      .maybeSingle();

    if (quizError || !quiz) {
      throw new Error("Unauthorized or quiz not found.");
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, question, options, correct_answer, explanation")
      .eq("quiz_id", quizId);

    if (questionsError) {
      throw new Error("Failed to fetch quiz questions: " + questionsError.message);
    }

    return {
      id: quiz.id,
      user_id: quiz.user_id,
      file_id: quiz.file_id,
      title: quiz.title,
      created_at: quiz.created_at,
      questions: (questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options as unknown as string[],
        correct_answer: q.correct_answer,
        explanation: q.explanation
      }))
    };
  }

  /**
   * Fetch all quizzes for a user, optionally filtered by file.
   */
  static async getUserQuizzes(userId: string, fileId?: string | null): Promise<AIQuiz[]> {
    const supabase = await createClient();
    let query = supabase
      .from("quizzes")
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
      throw new Error("Failed to fetch quizzes: " + error.message);
    }

    return data || [];
  }

  /**
   * Delete a quiz. Performs ownership check.
   */
  static async deleteQuiz(userId: string, quizId: string): Promise<void> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Unauthorized or quiz not found.");
    }

    await supabase.from("quizzes").delete().eq("id", quizId);
  }
}
