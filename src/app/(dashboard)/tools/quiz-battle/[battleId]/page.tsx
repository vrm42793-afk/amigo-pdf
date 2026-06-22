"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getBattlePayloadAction,
  getBattleQuestionsAction,
  submitAnswerAction,
  finishBattleAction,
  updateBattleStatusAction,
  joinBattleAction,
  leaveBattleAction
} from "@/actions/quiz-battle/battle-actions";
import { QuizBattle, BattleParticipant, BattleScore } from "@/types/quiz-battle/quiz-battle.types";
import { QuestionBankItem } from "@/types/study/question-bank.types";
import { Button } from "@/components/ui/button";
import { Loader2, Swords, Clock, Users, Trophy, ChevronRight, XCircle, Database } from "lucide-react";

export default function QuizBattlePage() {
  const { battleId } = useParams() as { battleId: string };
  const router = useRouter();

  const [battle, setBattle] = useState<QuizBattle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [scores, setScores] = useState<BattleScore[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Gameplay state
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30s per question
  const [isFinished, setIsFinished] = useState(false);

  // Initialize
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) setCurrentUserId(data.user.id);

      const res = await getBattlePayloadAction(battleId);
      if (res.success && res.data) {
        setBattle(res.data.battle);
        setParticipants(res.data.participants);
        if (res.data.scores) setScores(res.data.scores);
        
        if (res.data.battle.status === "active") {
          // If already active, fetch questions
          fetchQuestions(res.data.battle.question_count, res.data.battle.collection_id);
        }
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!battleId) return;
    const supabase = createClient();

    const channel = supabase.channel(`battle_${battleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_battles", filter: `id=eq.${battleId}` }, (payload) => {
        const updatedBattle = payload.new as QuizBattle;
        setBattle(updatedBattle);
        if (updatedBattle.status === "active" && questions.length === 0) {
          fetchQuestions(updatedBattle.question_count, updatedBattle.collection_id);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_participants", filter: `battle_id=eq.${battleId}` }, async () => {
        // Refresh payload to get user relations
        const res = await getBattlePayloadAction(battleId);
        if (res.success && res.data) setParticipants(res.data.participants);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_scores", filter: `battle_id=eq.${battleId}` }, async () => {
        const res = await getBattlePayloadAction(battleId);
        if (res.success && res.data && res.data.scores) setScores(res.data.scores);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, questions.length]);

  // Timer logic for gameplay
  useEffect(() => {
    if (battle?.status !== "active" || isFinished || questions.length === 0) return;
    
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time's up for this question, auto submit wrong
      if (!selectedAnswer && !isSubmitting) {
        handleNextQuestion("TIMEOUT_WRONG");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, battle?.status, isFinished, questions.length]);


  const fetchQuestions = async (limit: number, collectionId: string | null) => {
    const res = await getBattleQuestionsAction(battleId, limit, collectionId);
    if (res.success && res.data) {
      setQuestions(res.data);
      setTimeRemaining(30);
    }
  };

  const handleStartBattle = async () => {
    await updateBattleStatusAction(battleId, "active");
  };

  const handleJoinBattle = async () => {
    const res = await joinBattleAction(battleId);
    if (res.success) {
      const payload = await getBattlePayloadAction(battleId);
      if (payload.success && payload.data) setParticipants(payload.data.participants);
    }
  };

  const handleLeaveBattle = async () => {
    await leaveBattleAction(battleId);
    router.push("/dashboard/collaboration");
  };

  const handleNextQuestion = async (forcedAnswer?: string) => {
    setIsSubmitting(true);
    const answer = forcedAnswer || selectedAnswer || "";
    const question = questions[currentQuestionIndex];
    const isCorrect = answer === question.answer; // In a real app we might do semantic matching or strict multiple choice

    await submitAnswerAction(battleId, question.id, answer, isCorrect, 30 - timeRemaining);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeRemaining(30);
      setIsSubmitting(false);
    } else {
      // Finish
      setIsFinished(true);
      await finishBattleAction(battleId);
    }
  };


  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!battle) return <div className="text-center p-12 text-muted-foreground">Battle not found.</div>;

  const isCreator = currentUserId === battle.creator_id;
  const hasJoined = participants.some(p => p.user_id === currentUserId);

  // --- LOBBY VIEW ---
  if (battle.status === "lobby") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 mt-10">
        <div className="glass p-8 rounded-2xl border border-border text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Swords className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{battle.title}</h1>
          <p className="text-muted-foreground">Waiting for players to join the battle...</p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">
              <Clock className="inline h-4 w-4 mr-2" /> {battle.time_limit_minutes} Min Limit
            </div>
            <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">
              <Database className="inline h-4 w-4 mr-2" /> {battle.question_count} Questions
            </div>
          </div>

          <div className="pt-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Participants ({participants.length})</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {participants.map(p => (
                <div key={p.id} className="px-4 py-2 border border-border rounded-full flex items-center gap-2 bg-background shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold uppercase">
                    {p.user?.name?.[0] || "U"}
                  </div>
                  <span className="text-sm font-medium">{p.user?.name || "Unknown"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex justify-center gap-4">
            {!hasJoined && (
              <Button onClick={handleJoinBattle} size="lg" className="px-8">
                Join Battle
              </Button>
            )}
            {hasJoined && (
              <Button variant="outline" onClick={handleLeaveBattle} size="lg">
                Leave Lobby
              </Button>
            )}
            {isCreator && (
              <Button onClick={handleStartBattle} size="lg" className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                Start Battle Now
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- GAMEPLAY VIEW ---
  if (battle.status === "active" && !isFinished) {
    if (questions.length === 0) return <div className="text-center p-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> Loading questions...</div>;
    
    const question = questions[currentQuestionIndex];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-10">
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Swords className="h-5 w-5" /> Quiz Battle
          </div>
          <div className="font-bold text-lg text-foreground">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>
          <div className={`font-mono font-bold text-lg px-3 py-1 rounded-md ${timeRemaining <= 10 ? 'bg-red-100 text-red-600' : 'bg-muted text-foreground'}`}>
            00:{timeRemaining.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border border-border space-y-8">
          <h2 className="text-2xl font-medium text-foreground leading-relaxed">
            {question.question}
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Type your exact answer below:</p>
            <textarea
              className="w-full h-32 p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none resize-none font-medium"
              placeholder="Your answer..."
              value={selectedAnswer || ""}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              size="lg" 
              onClick={() => handleNextQuestion()} 
              disabled={!selectedAnswer || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {currentQuestionIndex === questions.length - 1 ? "Finish Battle" : "Next Question"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- LEADERBOARD VIEW ---
  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-10">
      <div className="glass p-8 rounded-2xl border border-border text-center space-y-6">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
        <h1 className="text-4xl font-bold text-foreground">Battle Finished!</h1>
        <p className="text-muted-foreground">Final Results for {battle.title}</p>
        
        {scores.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="mt-8 space-y-3 text-left">
            {scores.map((s, idx) => (
              <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : idx === 1 ? 'bg-zinc-300/10 border-zinc-300/30' : idx === 2 ? 'bg-orange-600/10 border-orange-600/30' : 'bg-background border-border'}`}>
                <div className="flex items-center gap-4">
                  <div className={`font-black text-xl w-8 text-center ${idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-zinc-500' : idx === 2 ? 'text-orange-700' : 'text-muted-foreground'}`}>
                    #{s.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold uppercase">
                    {s.user?.name?.[0] || "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{s.user?.name}</h4>
                    <span className="text-xs text-muted-foreground">{s.accuracy}% Accuracy • {s.time_taken_seconds}s Total</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-primary">
                  {s.score} <span className="text-sm font-medium text-muted-foreground">pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-8">
          <Button onClick={() => router.push("/dashboard/collections")} variant="outline" size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
