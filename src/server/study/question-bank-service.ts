import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { AIService } from "@/server/ai/ai-service";
import {
  QuestionBankItem,
  QuestionBankFilters,
  QuestionBankStats,
  QuestionDifficulty,
} from "@/types/study/question-bank.types";

export class QuestionBankService {
  /**
   * Generate a batch of questions from a source PDF and persist them to the question_bank table.
   */
  static async generateQuestions(
    userId: string,
    fileId: string,
    subject: string,
    unit?: string
  ): Promise<QuestionBankItem[]> {
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

    // 2. Rate limit
    const rateLimit = await AIService.checkRateLimit(userId, "summary");
    if (!rateLimit.allowed) {
      throw new Error("Rate limit exceeded. Please wait and try again in an hour.");
    }

    // 3. Ensure document is chunked
    const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
    await DocumentProcessor.ensureDocumentProcessed(fileId, userId);

    // 4. Fetch all document chunks
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      throw new Error("No extracted content available for this file. Please process/OCR the file first.");
    }

    const fullContent = chunks.map((c) => c.content).join("\n\n");

    // 5. Build AI prompt
    const systemInstruction =
      "You are an expert academic question paper setter. Generate high-quality exam questions categorized by difficulty and marks from the given document content. Output ONLY valid JSON.";

    const unitClause = unit ? `Focus specifically on the unit/topic: "${unit}".` : "Cover all major topics from the document.";

    const prompt = `Generate a comprehensive question bank from the following document.
Subject: ${subject}
${unitClause}

For each question, provide:
- difficulty: "easy", "medium", or "hard"
- marks: 1, 2, 5, or 7
- question: the full question text
- answer: a detailed model answer or key points for marking
- unit: the specific unit/topic name this question belongs to

Generate at least 15 questions with a balanced mix of:
- 5+ easy questions (1-2 marks: definitions, recall)
- 5+ medium questions (2-5 marks: explanations, comparisons)
- 5+ hard questions (5-7 marks: analysis, case studies, detailed processes)

Output as JSON:
{
  "questions": [
    {
      "difficulty": "easy" | "medium" | "hard",
      "marks": number,
      "question": "string",
      "answer": "string",
      "unit": "string"
    }
  ]
}

Document content:
${fullContent}`;

    // 6. Call Gemini
    const result = await GeminiService.generateJson(prompt, systemInstruction);

    interface RawQuestion {
      difficulty?: string;
      marks?: number;
      question?: string;
      answer?: string;
      unit?: string;
    }

    let parsed: { questions: RawQuestion[] };

    try {
      parsed = JSON.parse(result.text);
    } catch {
      console.error("Failed to parse question bank JSON:", result.text);
      throw new Error("Failed to generate valid question bank from AI.");
    }

    if (!parsed.questions || parsed.questions.length === 0) {
      throw new Error("AI did not generate any questions.");
    }

    // 7. Validate and normalize
    const validDifficulties: QuestionDifficulty[] = ["easy", "medium", "hard"];
    const questionsToInsert = parsed.questions
      .filter((q) => q.question && q.answer)
      .map((q) => ({
        user_id: userId,
        source_file_id: fileId,
        subject,
        unit: q.unit || unit || null,
        difficulty: validDifficulties.includes(q.difficulty as QuestionDifficulty)
          ? (q.difficulty as QuestionDifficulty)
          : "medium",
        marks: [1, 2, 5, 7].includes(q.marks || 0) ? q.marks! : 2,
        question: q.question!,
        answer: q.answer!,
      }));

    if (questionsToInsert.length === 0) {
      throw new Error("No valid questions could be extracted.");
    }

    // 8. Insert into database
    const { data: inserted, error: insertError } = await supabase
      .from("question_bank")
      .insert(questionsToInsert)
      .select();

    if (insertError || !inserted) {
      throw new Error("Failed to save questions: " + insertError?.message);
    }

    // 9. Log usage
    await AIService.logUsage(
      userId,
      "question_bank",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return inserted as QuestionBankItem[];
  }

  /**
   * Fetch questions with optional filters (subject, unit, difficulty, marks, sourceFileId).
   */
  static async getQuestions(
    userId: string,
    filters?: QuestionBankFilters
  ): Promise<QuestionBankItem[]> {
    const supabase = await createClient();

    let query = supabase
      .from("question_bank")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (filters?.subject) {
      query = query.eq("subject", filters.subject);
    }
    if (filters?.unit) {
      query = query.eq("unit", filters.unit);
    }
    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }
    if (filters?.marks) {
      query = query.eq("marks", filters.marks);
    }
    if (filters?.sourceFileId) {
      query = query.eq("source_file_id", filters.sourceFileId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("Failed to fetch questions: " + error.message);
    }

    return (data as QuestionBankItem[]) || [];
  }

  /**
   * Get distinct subjects for filter dropdowns.
   */
  static async getSubjects(userId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("question_bank")
      .select("subject")
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to fetch subjects: " + error.message);
    }

    const unique = [...new Set((data || []).map((d) => d.subject))];
    return unique.sort();
  }

  /**
   * Get distinct units for a given subject.
   */
  static async getUnits(userId: string, subject: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("question_bank")
      .select("unit")
      .eq("user_id", userId)
      .eq("subject", subject);

    if (error) {
      throw new Error("Failed to fetch units: " + error.message);
    }

    const unique = [...new Set((data || []).map((d) => d.unit).filter(Boolean))] as string[];
    return unique.sort();
  }

  /**
   * Get question bank statistics for the user.
   */
  static async getStats(userId: string): Promise<QuestionBankStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("question_bank")
      .select("subject, difficulty, marks")
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to fetch stats: " + error.message);
    }

    const questions = data || [];
    const subjects = [...new Set(questions.map((q) => q.subject))].sort();
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    const byMarks: Record<number, number> = {};

    for (const q of questions) {
      if (q.difficulty === "easy" || q.difficulty === "medium" || q.difficulty === "hard") {
        byDifficulty[q.difficulty]++;
      }
      byMarks[q.marks] = (byMarks[q.marks] || 0) + 1;
    }

    return {
      totalQuestions: questions.length,
      subjects,
      byDifficulty,
      byMarks,
    };
  }

  /**
   * Delete a specific question.
   */
  static async deleteQuestion(userId: string, questionId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("question_bank")
      .delete()
      .eq("id", questionId)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete question: " + error.message);
    }
  }

  /**
   * Delete all questions for a subject.
   */
  static async deleteBySubject(userId: string, subject: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("question_bank")
      .delete()
      .eq("user_id", userId)
      .eq("subject", subject);

    if (error) {
      throw new Error("Failed to delete subject questions: " + error.message);
    }
  }
}
