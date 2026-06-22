"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { QuestionBankService } from "@/server/study/question-bank-service";

const generateQuestionsSchema = z.object({
  fileId: z.string().uuid(),
  subject: z.string().min(1, "Subject is required").max(100),
  unit: z.string().max(100).optional(),
});

const getQuestionsSchema = z.object({
  subject: z.string().optional(),
  unit: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  marks: z.number().int().positive().optional(),
  sourceFileId: z.string().uuid().optional(),
});

const deleteQuestionSchema = z.object({
  questionId: z.string().uuid(),
});

const deleteBySubjectSchema = z.object({
  subject: z.string().min(1),
});

const getUnitsSchema = z.object({
  subject: z.string().min(1),
});

export async function generateQuestionsAction(formData: {
  fileId: string;
  subject: string;
  unit?: string;
}) {
  try {
    const validated = generateQuestionsSchema.parse(formData);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const questions = await QuestionBankService.generateQuestions(
      user.id,
      validated.fileId,
      validated.subject,
      validated.unit
    );

    return { success: true, data: questions };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to generate questions",
    };
  }
}

export async function getQuestionsAction(filters?: {
  subject?: string;
  unit?: string;
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  sourceFileId?: string;
}) {
  try {
    const validated = getQuestionsSchema.parse(filters || {});

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const questions = await QuestionBankService.getQuestions(user.id, validated);
    return { success: true, data: questions };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch questions",
    };
  }
}

export async function getSubjectsAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const subjects = await QuestionBankService.getSubjects(user.id);
    return { success: true, data: subjects };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch subjects",
    };
  }
}

export async function getUnitsAction(subject: string) {
  try {
    const validated = getUnitsSchema.parse({ subject });

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const units = await QuestionBankService.getUnits(user.id, validated.subject);
    return { success: true, data: units };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch units",
    };
  }
}

export async function getQuestionBankStatsAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const stats = await QuestionBankService.getStats(user.id);
    return { success: true, data: stats };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch stats",
    };
  }
}

export async function deleteQuestionAction(questionId: string) {
  try {
    const validated = deleteQuestionSchema.parse({ questionId });

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await QuestionBankService.deleteQuestion(user.id, validated.questionId);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete question",
    };
  }
}

export async function deleteBySubjectAction(subject: string) {
  try {
    const validated = deleteBySubjectSchema.parse({ subject });

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await QuestionBankService.deleteBySubject(user.id, validated.subject);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete subject questions",
    };
  }
}
