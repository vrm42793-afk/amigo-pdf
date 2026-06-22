export type BattleStatus = "lobby" | "active" | "finished";
export type ParticipantStatus = "joined" | "playing" | "finished";

export interface QuizBattle {
  id: string;
  creator_id: string;
  collection_id: string | null;
  title: string;
  status: BattleStatus;
  question_count: number;
  time_limit_minutes: number;
  created_at: string;
  creator?: { name: string; email: string; avatar: string };
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  user_id: string;
  joined_at: string;
  status: ParticipantStatus;
  user?: { name: string; email: string; avatar: string };
}

export interface BattleAnswer {
  id: string;
  battle_id: string;
  participant_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: string;
}

export interface BattleScore {
  id: string;
  battle_id: string;
  user_id: string;
  score: number;
  accuracy: number | null;
  time_taken_seconds: number;
  rank: number | null;
  user?: { name: string; email: string; avatar: string };
}

export interface BattlePayload {
  battle: QuizBattle;
  participants: BattleParticipant[];
  scores?: BattleScore[];
}
