export type StudyNoteType = "unit_notes" | "summary_sheet" | "formula_sheet" | "mindmap";

export interface StudyNote {
  id: string;
  user_id: string;
  file_id: string;
  type: StudyNoteType;
  title: string;
  content: string; // Markdown formatted text
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  file_id: string;
  title: string;
  duration_minutes: number;
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  marks: 1 | 2 | 5 | 7;
  question_text: string;
  marking_guide: string;
  page_reference: number | null;
  created_at: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  file_id: string;
  status: "active" | "completed";
  current_question_index: number;
  dialogue_history: {
    role: "assistant" | "user";
    text: string;
    feedback?: string;
    score?: number;
  }[];
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  file_id: string;
  duration_minutes: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}
