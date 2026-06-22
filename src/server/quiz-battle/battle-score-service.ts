import { createClient } from "@/lib/supabase/server";
import { BattleScore } from "@/types/quiz-battle/quiz-battle.types";

export class BattleScoreService {
  /**
   * Calculates points for a single answer based on correctness and speed.
   */
  static calculatePoints(isCorrect: boolean, timeTakenSeconds: number, maxTimeLimitPerQuestion = 30): number {
    if (!isCorrect) return 0;
    
    const BASE_SCORE = 10;
    // Speed bonus up to 5 points (faster = more points)
    let speedBonus = 0;
    if (timeTakenSeconds < maxTimeLimitPerQuestion) {
      const percentageFast = 1 - (timeTakenSeconds / maxTimeLimitPerQuestion);
      speedBonus = Math.round(percentageFast * 5);
    }

    return BASE_SCORE + speedBonus;
  }

  /**
   * Computes the final score for a participant and saves it.
   */
  static async computeFinalScore(battleId: string, participantId: string, userId: string): Promise<BattleScore> {
    const supabase = await createClient();

    // Get all answers for this participant
    const { data: answers, error } = await supabase
      .from("battle_answers")
      .select("*")
      .eq("battle_id", battleId)
      .eq("participant_id", participantId);

    if (error) throw new Error("Failed to fetch answers for scoring.");

    let totalScore = 0;
    let correctCount = 0;
    let totalTimeTaken = 0;

    for (const ans of (answers || [])) {
      totalTimeTaken += ans.time_taken_seconds;
      if (ans.is_correct) {
        correctCount++;
        totalScore += this.calculatePoints(true, ans.time_taken_seconds);
      }
    }

    const accuracy = answers && answers.length > 0 
      ? Math.round((correctCount / answers.length) * 100) 
      : 0;

    // Save Score
    const { data: scoreRec, error: scoreErr } = await supabase
      .from("battle_scores")
      .insert({
        battle_id: battleId,
        user_id: userId,
        score: totalScore,
        accuracy,
        time_taken_seconds: totalTimeTaken,
      })
      .select(`
        *,
        user:users!battle_scores_user_id_fkey(name, email, avatar)
      `)
      .single();

    if (scoreErr) {
      // Might already exist due to multiple finish triggers, just fetch it
      const { data: existing } = await supabase
        .from("battle_scores")
        .select(`
          *,
          user:users!battle_scores_user_id_fkey(name, email, avatar)
        `)
        .eq("battle_id", battleId)
        .eq("user_id", userId)
        .single();
      
      if (existing) return existing as unknown as BattleScore;
      throw new Error("Failed to save final score.");
    }

    // Attempt to update ranks for everyone in this battle
    await this.updateLeaderboardRanks(battleId);

    return scoreRec as unknown as BattleScore;
  }

  /**
   * Updates rank column for all participants in a battle.
   */
  static async updateLeaderboardRanks(battleId: string) {
    const supabase = await createClient();

    const { data: scores } = await supabase
      .from("battle_scores")
      .select("id, score, time_taken_seconds")
      .eq("battle_id", battleId)
      .order("score", { ascending: false })
      .order("time_taken_seconds", { ascending: true }); // tie breaker

    if (!scores) return;

    for (let i = 0; i < scores.length; i++) {
      await supabase
        .from("battle_scores")
        .update({ rank: i + 1 })
        .eq("id", scores[i].id);
    }
  }

  /**
   * Fetch leaderboard for a battle.
   */
  static async getLeaderboard(battleId: string): Promise<BattleScore[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("battle_scores")
      .select(`
        *,
        user:users!battle_scores_user_id_fkey(name, email, avatar)
      `)
      .eq("battle_id", battleId)
      .order("rank", { ascending: true });

    if (error) throw new Error("Failed to fetch leaderboard.");

    return data as unknown as BattleScore[];
  }
}
