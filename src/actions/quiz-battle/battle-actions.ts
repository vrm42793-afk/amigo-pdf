/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { ActionResponse } from "@/types/actions.types";
import { QuizBattle, BattlePayload, BattleParticipant, BattleAnswer, BattleScore } from "@/types/quiz-battle/quiz-battle.types";
import { BattleService } from "@/server/quiz-battle/battle-service";
import { BattleQuestionService } from "@/server/quiz-battle/battle-question-service";
import { BattleScoreService } from "@/server/quiz-battle/battle-score-service";
import { QuestionBankItem } from "@/types/study/question-bank.types";

export async function createBattleAction(title: string, collectionId: string | null, questionCount: number = 10, timeLimitMinutes: number = 5): Promise<ActionResponse<QuizBattle>> {
  try {
    const battle = await BattleService.createBattle(title, collectionId, questionCount, timeLimitMinutes);
    return { success: true, data: battle };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create battle." };
  }
}

export async function joinBattleAction(battleId: string): Promise<ActionResponse<BattleParticipant>> {
  try {
    const participant = await BattleService.joinBattle(battleId);
    return { success: true, data: participant };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to join battle." };
  }
}

export async function leaveBattleAction(battleId: string): Promise<ActionResponse<void>> {
  try {
    await BattleService.leaveBattle(battleId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to leave battle." };
  }
}

export async function updateBattleStatusAction(battleId: string, status: "lobby" | "active" | "finished"): Promise<ActionResponse<void>> {
  try {
    await BattleService.updateBattleStatus(battleId, status);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update battle status." };
  }
}

export async function getBattlePayloadAction(battleId: string): Promise<ActionResponse<BattlePayload>> {
  try {
    const payload = await BattleService.getBattlePayload(battleId);
    return { success: true, data: payload };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to get battle payload." };
  }
}

export async function getBattleQuestionsAction(battleId: string, limit: number, collectionId: string | null): Promise<ActionResponse<QuestionBankItem[]>> {
  try {
    const questions = await BattleQuestionService.getBattleQuestions(battleId, limit, collectionId);
    return { success: true, data: questions };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch questions." };
  }
}

export async function submitAnswerAction(battleId: string, questionId: string, selectedAnswer: string, isCorrect: boolean, timeTakenSeconds: number): Promise<ActionResponse<BattleAnswer>> {
  try {
    const ans = await BattleQuestionService.submitAnswer(battleId, questionId, selectedAnswer, isCorrect, timeTakenSeconds);
    return { success: true, data: ans };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit answer." };
  }
}

export async function finishBattleAction(battleId: string): Promise<ActionResponse<void>> {
  try {
    await BattleQuestionService.finishBattle(battleId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to finish battle." };
  }
}

export async function getLeaderboardAction(battleId: string): Promise<ActionResponse<BattleScore[]>> {
  try {
    const scores = await BattleScoreService.getLeaderboard(battleId);
    return { success: true, data: scores };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch leaderboard." };
  }
}
