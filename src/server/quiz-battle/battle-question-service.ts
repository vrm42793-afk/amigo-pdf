import { createClient } from "@/lib/supabase/server";
import { QuestionBankItem } from "@/types/study/question-bank.types";
import { BattleAnswer } from "@/types/quiz-battle/quiz-battle.types";
import { BattleScoreService } from "./battle-score-service";

export class BattleQuestionService {
  /**
   * Fetches questions from the question bank for this battle.
   * If a collectionId was provided, it fetches questions that belong to files in that collection.
   * Otherwise, it fetches random questions.
   */
  static async getBattleQuestions(battleId: string, limit: number, collectionId: string | null): Promise<QuestionBankItem[]> {
    const supabase = await createClient();

    let query = supabase
      .from("question_bank")
      .select("*")
      .limit(limit);

    // If it's scoped to a collection, we need to filter by file_id in that collection.
    // However, the question_bank only has file_id. We must join with collection_items.
    if (collectionId) {
      const { data: colItems } = await supabase
        .from("collection_items")
        .select("item_id")
        .eq("collection_id", collectionId)
        .eq("item_type", "file");
      
      const fileIds = colItems?.map(ci => ci.item_id) || [];
      if (fileIds.length > 0) {
        query = query.in("file_id", fileIds);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch questions for battle.");

    // Simple shuffle
    const shuffled = (data as QuestionBankItem[]).sort(() => 0.5 - Math.random());
    return shuffled;
  }

  /**
   * Submits an answer during the battle.
   */
  static async submitAnswer(
    battleId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    timeTakenSeconds: number
  ): Promise<BattleAnswer> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Unauthorized");

    // Get the participant ID
    const { data: participant } = await supabase
      .from("battle_participants")
      .select("id")
      .eq("battle_id", battleId)
      .eq("user_id", userData.user.id)
      .single();

    if (!participant) throw new Error("Participant not found in this battle.");

    const { data, error } = await supabase
      .from("battle_answers")
      .insert({
        battle_id: battleId,
        participant_id: participant.id,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_taken_seconds: timeTakenSeconds,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to submit answer.");

    return data as unknown as BattleAnswer;
  }

  /**
   * Marks a user as finished and triggers scoring.
   */
  static async finishBattle(battleId: string): Promise<void> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Unauthorized");

    const { data: participant } = await supabase
      .from("battle_participants")
      .select("id")
      .eq("battle_id", battleId)
      .eq("user_id", userData.user.id)
      .single();

    if (!participant) return;

    // Update status
    await supabase
      .from("battle_participants")
      .update({ status: "finished" })
      .eq("id", participant.id);

    // Compute their score
    await BattleScoreService.computeFinalScore(battleId, participant.id, userData.user.id);

    // Check if everyone is finished, if so, mark battle as finished
    const { data: allParticipants } = await supabase
      .from("battle_participants")
      .select("status")
      .eq("battle_id", battleId);

    const allFinished = allParticipants?.every(p => p.status === "finished");
    if (allFinished) {
      await supabase
        .from("quiz_battles")
        .update({ status: "finished" })
        .eq("id", battleId);
    }
  }
}
