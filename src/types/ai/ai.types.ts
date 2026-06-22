export type AISummaryType = 'short' | 'detailed' | 'executive' | 'chapter' | 'bullet';
export type AINoteType = 'study' | 'structured' | 'bullet' | 'revision';
export type AIFlashcardDifficulty = 'easy' | 'medium' | 'hard';
export type AIQuizDifficulty = 'easy' | 'medium' | 'hard';
export type AIQuizType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  created_at: string;
}

export interface AIChatSession {
  id: string;
  user_id: string;
  file_id: string | null;
  title: string;
  created_at: string;
}

export interface AISource {
  chunkText: string;
  pageNumber: number | null;
  similarityScore: number;
  sectionTitle: string | null;
}

export interface AIChatResponse {
  message: string;
  sources?: AISource[];
}

export interface AISummary {
  id: string;
  user_id: string;
  file_id: string;
  summary_type: AISummaryType;
  content: string;
  created_at: string;
}

export interface AINote {
  id: string;
  user_id: string;
  file_id: string | null;
  title: string;
  content: string;
  notes_type: string;
  note_type: AINoteType;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIFlashcard {
  question: string;
  answer: string;
  difficulty: AIFlashcardDifficulty;
  topic: string;
  source_page: number | null;
}

export interface AIFlashcardDeck {
  id: string;
  user_id: string;
  file_id: string | null;
  deck_name: string;
  cards: AIFlashcard[];
  created_at: string;
  updated_at: string;
}

export interface AIQuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

export interface AIQuiz {
  id: string;
  user_id: string;
  file_id: string | null;
  title: string;
  created_at: string;
  questions?: AIQuizQuestion[];
}

export interface AIUsageRecord {
  id: string;
  user_id: string;
  feature: string;
  tokens_input: number;
  tokens_output: number;
  model: string;
  cost_estimate: number;
  created_at: string;
}
