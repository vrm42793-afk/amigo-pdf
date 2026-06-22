export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface QuestionBankItem {
  id: string;
  user_id: string;
  source_file_id: string;
  subject: string;
  unit: string | null;
  difficulty: QuestionDifficulty;
  marks: number;
  question: string;
  answer: string;
  created_at: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  time_taken: number;
  attempted_at: string;
}

export interface QuestionBankFilters {
  subject?: string;
  unit?: string;
  difficulty?: QuestionDifficulty;
  marks?: number;
  sourceFileId?: string;
}

export interface QuestionBankStats {
  totalQuestions: number;
  subjects: string[];
  byDifficulty: { easy: number; medium: number; hard: number };
  byMarks: Record<number, number>;
}
