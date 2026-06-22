"use server";

import { createClient } from "@/lib/supabase/server";
import { QuizService } from "@/server/ai/quiz-service";
import { AIQuizType, AIQuizDifficulty } from "@/types/ai/ai.types";
import { z } from "zod";

const generateQuizSchema = z.object({
  fileId: z.string().uuid(),
  quizType: z.enum(["multiple_choice", "true_false", "short_answer"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  title: z.string().max(100).optional()
});

export async function generateQuiz(formData: { fileId: string; quizType: string; difficulty: string; title?: string }) {
  try {
    const validated = generateQuizSchema.parse(formData);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const quiz = await QuizService.generateQuiz(
      user.id,
      validated.fileId,
      validated.quizType as AIQuizType,
      validated.difficulty as AIQuizDifficulty,
      validated.title
    );

    return { success: true, data: quiz };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to generate quiz" };
  }
}

export async function getQuizDetails(quizId: string) {
  try {
    const validatedId = z.string().uuid().parse(quizId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const quiz = await QuizService.getQuiz(user.id, validatedId);
    return { success: true, data: quiz };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch quiz details" };
  }
}

export async function getUserQuizzes(fileId?: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const quizzes = await QuizService.getUserQuizzes(user.id, fileId);
    return { success: true, data: quizzes };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch quizzes" };
  }
}

export async function deleteQuiz(quizId: string) {
  try {
    const validatedId = z.string().uuid().parse(quizId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await QuizService.deleteQuiz(user.id, validatedId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete quiz" };
  }
}
