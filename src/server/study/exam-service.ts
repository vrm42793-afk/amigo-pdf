import { createClient } from "@/lib/supabase/server";
import { GeminiService } from "@/lib/gemini/gemini-service";
import { AIService } from "@/server/ai/ai-service";
import { Exam, ExamQuestion } from "@/types/study/study.types";

export class ExamService {
  /**
   * Generate a balanced mock exam from document text.
   */
  static async generateExam(
    userId: string,
    fileId: string,
    customTitle?: string
  ): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
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

    // 2. Enforce rate limiting
    const rateLimit = await AIService.checkRateLimit(userId, "summary");
    if (!rateLimit.allowed) {
      throw new Error("Rate limit exceeded. Please wait and try again in an hour.");
    }

    // 3. Ensure document is processed and chunks exist
    const { DocumentProcessor } = await import("@/lib/gemini/document-processor");
    await DocumentProcessor.ensureDocumentProcessed(fileId, userId);

    // 4. Fetch all document chunks ordered by chunk_index
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      throw new Error("No extracted content available for this file. Please process/OCR the file first.");
    }

    const fullContent = chunks.map((c) => c.content).join("\n\n");

    // 5. Build prompt for structured JSON exam generation
    const systemInstruction = "You are an expert academic examiner. Your job is to generate balanced university exams formatted in strict JSON.";
    const prompt = `Generate a realistic mock exam based on the following document content.
The exam should contain a balanced list of:
- 1-mark questions (definitions, direct recall)
- 2-mark questions (brief explanations, short definitions)
- 5-mark questions (medium length, conceptual descriptions)
- 7-mark questions (long analysis, case studies, or detailed process walkthroughs)
Each question must include a detailed marking_guide (specifying the correct answer or key points a student needs to write to score the marks) and a page_reference (estimating which page number the question was drawn from).
Document title: ${file.name}

Output your response ONLY as a JSON object matching this schema:
{
  "title": "Mock Exam title",
  "duration_minutes": 180,
  "questions": [
    {
      "marks": 1 | 2 | 5 | 7,
      "question_text": "string",
      "marking_guide": "string",
      "page_reference": number
    }
  ]
}

Document content:
${fullContent}`;

    // 6. Invoke Gemini Client in JSON mode
    const result = await GeminiService.generateJson(prompt, systemInstruction);
    interface RawExamQuestion {
      marks?: number;
      question_text?: string;
      marking_guide?: string;
      page_reference?: number;
    }
    let parsed: { title: string; duration_minutes: number; questions: RawExamQuestion[] };

    try {
      parsed = JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse mock exam JSON output:", result.text, e);
      throw new Error("Failed to generate a valid exam format from AI.");
    }

    // 7. Save exam parent details
    const examTitle = customTitle || parsed.title || `Mock Exam: ${file.name}`;
    const duration = parsed.duration_minutes || 180;

    const { data: newExam, error: examError } = await supabase
      .from("exams")
      .insert({
        user_id: userId,
        file_id: fileId,
        title: examTitle,
        duration_minutes: duration,
      })
      .select()
      .single();

    if (examError || !newExam) {
      throw new Error("Failed to create exam record: " + examError?.message);
    }

    // 8. Save exam questions list
    const questionsToInsert = (parsed.questions || []).map((q) => ({
      exam_id: newExam.id,
      marks: q.marks === 1 || q.marks === 2 || q.marks === 5 || q.marks === 7 ? q.marks : 2,
      question_text: q.question_text || "Explain this concept.",
      marking_guide: q.marking_guide || "Refer to study guide.",
      page_reference: q.page_reference || null,
    }));

    if (questionsToInsert.length === 0) {
      throw new Error("No exam questions generated.");
    }

    const { data: examQuestions, error: questionsError } = await supabase
      .from("exam_questions")
      .insert(questionsToInsert)
      .select();

    if (questionsError || !examQuestions) {
      throw new Error("Failed to save exam questions: " + questionsError?.message);
    }

    // 9. Log token usage
    await AIService.logUsage(
      userId,
      "quiz",
      result.tokensInput,
      result.tokensOutput,
      "gemini-2.5-flash"
    );

    return {
      exam: newExam as Exam,
      questions: examQuestions as ExamQuestion[],
    };
  }

  /**
   * Fetch all exams generated for a user's file.
   */
  static async getExams(userId: string, fileId: string): Promise<Exam[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch exams: " + error.message);
    }
    return (data as Exam[]) || [];
  }

  /**
   * Fetch exam questions for a specific exam ID.
   */
  static async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("exam_id", examId)
      .order("marks", { ascending: true }); // sort shorter questions first

    if (error) {
      throw new Error("Failed to fetch exam questions: " + error.message);
    }
    return (data as ExamQuestion[]) || [];
  }
}
