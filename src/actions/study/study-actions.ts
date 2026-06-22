"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { RevisionService } from "@/server/study/revision-service";
import { ExamService } from "@/server/study/exam-service";
import { MindMapService } from "@/server/study/mindmap-service";
import { SpacedRepetitionService } from "@/server/study/spaced-repetition-service";
import { InterviewService } from "@/server/study/interview-service";
import { AnalyticsService } from "@/server/study/analytics-service";
import { StudyNoteType } from "@/types/study/study.types";

const getRevisionNotesSchema = z.object({
  fileId: z.string().uuid(),
  type: z.enum(["unit_notes", "summary_sheet", "formula_sheet", "mindmap"]),
});

const generateExamSchema = z.object({
  fileId: z.string().uuid(),
  customTitle: z.string().max(100).optional(),
});

const getExamsSchema = z.object({
  fileId: z.string().uuid(),
});

const getExamQuestionsSchema = z.object({
  examId: z.string().uuid(),
});

const getReviewStateSchema = z.object({
  flashcardId: z.string().uuid(),
});

const submitReviewSchema = z.object({
  flashcardId: z.string().uuid(),
  rating: z.number().int().min(0).max(5),
});

const startInterviewSessionSchema = z.object({
  fileId: z.string().uuid(),
});

const submitInterviewAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  answerText: z.string().min(1, "Answer cannot be empty"),
});

const getInterviewSessionsSchema = z.object({
  fileId: z.string().uuid(),
});

const logStudySessionSchema = z.object({
  fileId: z.string().uuid(),
  durationMinutes: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
});

export async function getRevisionNotesAction(formData: {
  fileId: string;
  type: StudyNoteType;
}) {
  try {
    const validated = getRevisionNotesSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    if (validated.type === "mindmap") {
      const mindmap = await MindMapService.getMindMap(user.id, validated.fileId);
      return { success: true, data: mindmap };
    } else {
      const note = await RevisionService.getRevisionNotes(
        user.id,
        validated.fileId,
        validated.type
      );
      return { success: true, data: note };
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to retrieve revision notes",
    };
  }
}

export async function generateExamAction(formData: {
  fileId: string;
  customTitle?: string;
}) {
  try {
    const validated = generateExamSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const examData = await ExamService.generateExam(
      user.id,
      validated.fileId,
      validated.customTitle
    );

    return { success: true, data: examData };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to compile exam sheet",
    };
  }
}

export async function getExamsAction(fileId: string) {
  try {
    const validated = getExamsSchema.parse({ fileId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const exams = await ExamService.getExams(user.id, validated.fileId);
    return { success: true, data: exams };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch exams",
    };
  }
}

export async function getExamQuestionsAction(examId: string) {
  try {
    const validated = getExamQuestionsSchema.parse({ examId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const questions = await ExamService.getExamQuestions(validated.examId);
    return { success: true, data: questions };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch exam questions",
    };
  }
}

export async function getReviewStateAction(flashcardId: string) {
  try {
    const validated = getReviewStateSchema.parse({ flashcardId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const review = await SpacedRepetitionService.getReviewState(user.id, validated.flashcardId);
    return { success: true, data: review };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch review state",
    };
  }
}

export async function submitReviewAction(formData: {
  flashcardId: string;
  rating: number;
}) {
  try {
    const validated = submitReviewSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const review = await SpacedRepetitionService.submitReview(
      user.id,
      validated.flashcardId,
      validated.rating
    );

    return { success: true, data: review };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to submit flashcard review",
    };
  }
}

export async function startInterviewSessionAction(formData: { fileId: string }) {
  try {
    const validated = startInterviewSessionSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const session = await InterviewService.startSession(user.id, validated.fileId);
    return { success: true, data: session };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to initialize interview",
    };
  }
}

export async function submitInterviewAnswerAction(formData: {
  sessionId: string;
  answerText: string;
}) {
  try {
    const validated = submitInterviewAnswerSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const session = await InterviewService.submitAnswer(
      user.id,
      validated.sessionId,
      validated.answerText
    );

    return { success: true, data: session };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to process interview response",
    };
  }
}

export async function getInterviewSessionsAction(fileId: string) {
  try {
    const validated = getInterviewSessionsSchema.parse({ fileId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const sessions = await InterviewService.getSessions(user.id, validated.fileId);
    return { success: true, data: sessions };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to retrieve interview sessions",
    };
  }
}

export async function logStudySessionAction(formData: {
  fileId: string;
  durationMinutes: number;
  startedAt: string;
  endedAt: string;
}) {
  try {
    const validated = logStudySessionSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const session = await AnalyticsService.logStudySession({
      userId: user.id,
      fileId: validated.fileId,
      durationMinutes: validated.durationMinutes,
      startedAt: validated.startedAt,
      endedAt: validated.endedAt,
    });

    return { success: true, data: session };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to log study session",
    };
  }
}
