import { createClient } from "@/lib/supabase/server";
import { QuizBattle, BattleParticipant, BattlePayload, BattleScore } from "@/types/quiz-battle/quiz-battle.types";

export class BattleService {
  /**
   * Creates a new multiplayer quiz battle from a specific collection context or globally.
   */
  static async createBattle(
    title: string,
    collectionId: string | null,
    questionCount: number = 10,
    timeLimitMinutes: number = 5
  ): Promise<QuizBattle> {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("quiz_battles")
      .insert({
        title,
        collection_id: collectionId,
        creator_id: userData.user.id,
        status: "lobby",
        question_count: questionCount,
        time_limit_minutes: timeLimitMinutes,
      })
      .select(`
        *,
        creator:users!quiz_battles_creator_id_fkey(name, email, avatar)
      `)
      .single();

    if (error) throw new Error("Failed to create battle.");

    // Automatically join the creator as the first participant
    await this.joinBattle(data.id, userData.user.id);

    return data as unknown as QuizBattle;
  }

  /**
   * Joins a user to a battle.
   */
  static async joinBattle(battleId: string, userId?: string): Promise<BattleParticipant> {
    const supabase = await createClient();
    
    let uid = userId;
    if (!uid) {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Unauthorized");
      uid = userData.user.id;
    }

    // Check if battle exists and is in lobby
    const { data: battle } = await supabase.from("quiz_battles").select("status").eq("id", battleId).single();
    if (!battle) throw new Error("Battle not found");
    if (battle.status !== "lobby") throw new Error("Battle is already active or finished.");

    const { data, error } = await supabase
      .from("battle_participants")
      .insert({
        battle_id: battleId,
        user_id: uid,
        status: "joined",
      })
      .select(`
        *,
        user:users!battle_participants_user_id_fkey(name, email, avatar)
      `)
      .single();

    if (error) {
      // If already joined, just fetch it
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from("battle_participants")
          .select(`*, user:users!battle_participants_user_id_fkey(name, email, avatar)`)
          .eq("battle_id", battleId)
          .eq("user_id", uid)
          .single();
        return existing as unknown as BattleParticipant;
      }
      throw new Error("Failed to join battle.");
    }

    return data as unknown as BattleParticipant;
  }

  /**
   * Changes the state of the battle (lobby -> active -> finished).
   */
  static async updateBattleStatus(battleId: string, status: "lobby" | "active" | "finished"): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quiz_battles")
      .update({ status })
      .eq("id", battleId);

    if (error) throw new Error("Failed to update battle status.");
    
    if (status === "active") {
      // update all participants to playing
      await supabase
        .from("battle_participants")
        .update({ status: "playing" })
        .eq("battle_id", battleId);
    }
  }

  /**
   * Fetches the full lobby/active payload for a battle.
   */
  static async getBattlePayload(battleId: string): Promise<BattlePayload> {
    const supabase = await createClient();

    const { data: battle, error: battleErr } = await supabase
      .from("quiz_battles")
      .select(`
        *,
        creator:users!quiz_battles_creator_id_fkey(name, email, avatar)
      `)
      .eq("id", battleId)
      .single();

    if (battleErr) throw new Error("Battle not found.");

    const { data: participants, error: partErr } = await supabase
      .from("battle_participants")
      .select(`
        *,
        user:users!battle_participants_user_id_fkey(name, email, avatar)
      `)
      .eq("battle_id", battleId)
      .order("joined_at", { ascending: true });

    if (partErr) throw new Error("Failed to fetch participants.");

    let scores: BattleScore[] = [];
    if (battle.status === "finished") {
      const { data: s } = await supabase
        .from("battle_scores")
        .select(`*, user:users!battle_scores_user_id_fkey(name, email, avatar)`)
        .eq("battle_id", battleId)
        .order("rank", { ascending: true });
      if (s) scores = s as unknown as BattleScore[];
    }

    return {
      battle: battle as unknown as QuizBattle,
      participants: participants as unknown as BattleParticipant[],
      scores: scores.length > 0 ? scores : undefined,
    };
  }

  /**
   * Leave battle
   */
  static async leaveBattle(battleId: string): Promise<void> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("battle_participants")
      .delete()
      .eq("battle_id", battleId)
      .eq("user_id", userData.user.id);

    if (error) throw new Error("Failed to leave battle.");
  }
}
