"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { generateQuiz, getQuizDetails, getUserQuizzes, deleteQuiz } from "@/actions/ai/generate-quiz";
import { FileRow } from "@/types/files.types";
import { AIQuizType, AIQuizDifficulty, AIQuiz, AIQuizQuestion } from "@/types/ai/ai.types";
import { HelpCircle, Sparkles, AlertCircle, CheckCircle, RefreshCw, Trash, Trophy, ArrowRight, Eye, RefreshCw as ResetIcon } from "lucide-react";

export default function AiQuizPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [quizType, setQuizType] = useState<AIQuizType>("multiple_choice");
  const [difficulty, setDifficulty] = useState<AIQuizDifficulty>("medium");
  const [customTitle, setCustomTitle] = useState("");

  const [quizzesList, setQuizzesList] = useState<AIQuiz[]>([]);
  const [activeQuiz, setActiveNote] = useState<AIQuiz | null>(null);

  // Play state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadQuizDetails = useCallback(async (quizId: string) => {
    const res = await getQuizDetails(quizId);
    if (res.success && res.data) {
      setActiveNote(res.data);
      // Reset play state
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShortAnswers({});
      setIsFinished(false);
      setScore(0);
      setShowReview(false);
    }
  }, []);

  // Load files and quizzes on mount
  useEffect(() => {
    async function loadInitialData() {
      const res = await getUserFilesAction();
      if (res.success && res.data) {
        setFiles(res.data);
        if (res.data.length > 0) {
          setSelectedFile(res.data[0]);
        }
      }
      setLoadingFiles(false);

      setLoadingQuizzes(true);
      const quizRes = await getUserQuizzes();
      if (quizRes.success && quizRes.data) {
        setQuizzesList(quizRes.data);
        if (quizRes.data.length > 0) {
          loadQuizDetails(quizRes.data[0].id);
        }
      }
      setLoadingQuizzes(false);
    }
    loadInitialData();
  }, [loadQuizDetails]);

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    const res = await generateQuiz({
      fileId: selectedFile.id,
      quizType,
      difficulty,
      title: customTitle.trim() || undefined
    });

    if (res.success && res.data) {
      setQuizzesList(prev => [res.data!, ...prev]);
      setActiveNote(res.data!);
      setCustomTitle("");
      // Reset play state
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShortAnswers({});
      setIsFinished(false);
      setScore(0);
      setShowReview(false);
      setSuccessMessage("Quiz generated successfully!");
    } else {
      setErrorMessage(res.error || "Failed to generate quiz");
    }
    setIsGenerating(false);
  };

  const handleDeleteQuiz = async (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    const res = await deleteQuiz(quizId);
    if (res.success) {
      setQuizzesList(prev => prev.filter(q => q.id !== quizId));
      if (activeQuiz?.id === quizId) {
        setActiveNote(null);
      }
      setSuccessMessage("Quiz deleted successfully.");
    } else {
      setErrorMessage(res.error || "Failed to delete quiz");
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isFinished) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: option
    }));
  };

  const handleShortAnswerChange = (text: string) => {
    if (isFinished) return;
    setShortAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: text
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuiz?.questions) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate score and finish
      let calculatedScore = 0;
      activeQuiz.questions.forEach((q, idx) => {
        if (q.options && q.options.length > 0) {
          const userAns = selectedAnswers[idx] || "";
          if (userAns.toLowerCase() === q.correct_answer.toLowerCase()) {
            calculatedScore++;
          }
        } else {
          // Short answer matching: case insensitive basic similarity check
          const userAns = (shortAnswers[idx] || "").trim().toLowerCase();
          const correctAns = q.correct_answer.trim().toLowerCase();
          if (userAns === correctAns || correctAns.includes(userAns) && userAns.length > 2) {
            calculatedScore++;
          }
        }
      });
      setScore(calculatedScore);
      setIsFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShortAnswers({});
    setIsFinished(false);
    setScore(0);
    setShowReview(false);
  };

  const activeQuestion: AIQuizQuestion | null = activeQuiz?.questions?.[currentQuestionIndex] || null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          AI Quiz Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Assess your reading comprehension by generating custom quizzes from document files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Block */}
        <div className="space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
              Quiz Setup
            </h3>

            {/* Select Document */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Select Document
              </label>
              {loadingFiles ? (
                <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
              ) : files.length === 0 ? (
                <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please upload a PDF file first.
                </div>
              ) : (
                <select
                  value={selectedFile?.id || ""}
                  onChange={(e) => {
                    const found = files.find(f => f.id === e.target.value);
                    if (found) setSelectedFile(found);
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Quiz Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Custom Quiz Title (Optional)
              </label>
              <input
                type="text"
                placeholder="E.g., Midterm Practice Quiz"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Format choice */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Question Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: "multiple_choice", label: "MCQ" },
                  { val: "true_false", label: "T/F" },
                  { val: "short_answer", label: "Short" }
                ].map((type) => (
                  <button
                    key={type.val}
                    onClick={() => setQuizType(type.val as AIQuizType)}
                    className={`h-9 text-xs rounded-md border font-semibold transition-colors ${
                      quizType === type.val
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty choices */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["easy", "medium", "hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff as AIQuizDifficulty)}
                    className={`h-9 text-xs rounded-md border font-semibold capitalize transition-colors ${
                      difficulty === diff
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={!selectedFile || isGenerating}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </button>
          </div>

          {/* Quizzes history list */}
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
              My Saved Quizzes
            </h3>

            {loadingQuizzes ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-muted animate-pulse rounded-md" />
              ))
            ) : quizzesList.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                No saved quizzes yet. Let&apos;s create one!
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {quizzesList.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => loadQuizDetails(q.id)}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all group ${
                      activeQuiz?.id === q.id
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="truncate">{q.title}</span>
                    </div>
                    <Trash
                      onClick={(e) => handleDeleteQuiz(e, q.id)}
                      className="h-3.5 w-3.5 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Player Interface */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[600px]">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold truncate max-w-sm">
              {activeQuiz ? activeQuiz.title : "Quiz Player"}
            </span>
          </div>

          {/* View Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Feedback notifications */}
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-semibold border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                  Reviewing context, drafting choices, and building key answer codes...
                </p>
              </div>
            ) : !activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <HelpCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No active quiz loaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select options and click &quot;Generate Quiz&quot; on the setup panel.
                </p>
              </div>
            ) : isFinished ? (
              /* Finished Score View */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Quiz Completed!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Here is your performance grade for this exam session.
                  </p>
                </div>

                <div className="bg-muted/40 border border-border p-6 rounded-2xl w-full space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-bold text-foreground">
                      {score} / {activeQuiz.questions.length} ({Math.round((score / activeQuiz.questions.length) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${(score / activeQuiz.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setShowReview(true)}
                    className="flex-1 h-10 border border-border hover:bg-muted text-foreground font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Review Answers
                  </button>
                  <button
                    onClick={handleResetQuiz}
                    className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ResetIcon className="h-4 w-4" />
                    Retry Quiz
                  </button>
                </div>
              </div>
            ) : showReview ? (
              /* Review Mode / Explanation Mode */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-sm">Review Questions</h3>
                  <button
                    onClick={() => setShowReview(false)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Back to Summary
                  </button>
                </div>

                <div className="space-y-6">
                  {activeQuiz.questions.map((q, idx) => {
                    const userAns = q.options && q.options.length > 0
                      ? selectedAnswers[idx] || "Unanswered"
                      : shortAnswers[idx] || "Unanswered";
                    const isCorrect = q.options && q.options.length > 0
                      ? userAns.toLowerCase() === q.correct_answer.toLowerCase()
                      : userAns.toLowerCase() === q.correct_answer.trim().toLowerCase() || q.correct_answer.toLowerCase().includes(userAns.toLowerCase()) && userAns.length > 2;

                    return (
                      <div key={idx} className="border border-border rounded-xl p-4 space-y-3 bg-muted/10">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-bold text-muted-foreground">
                            Question {idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm capitalize ${
                            isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground">{q.question}</h4>

                        {/* Options display */}
                        {q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            {q.options.map((opt) => {
                              const selected = userAns === opt;
                              const isCorrectOption = opt.toLowerCase() === q.correct_answer.toLowerCase();
                              let btnClass = "border-border bg-card text-foreground";
                              if (selected) btnClass = "border-red-500 bg-red-50/10 text-foreground";
                              if (isCorrectOption) btnClass = "border-green-500 bg-green-50/10 text-foreground font-semibold";
                              return (
                                <div key={opt} className={`p-3 rounded-lg border text-xs ${btnClass}`}>
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Short answer layout */
                          <div className="space-y-1 bg-card p-3 rounded-lg border border-border text-xs">
                            <p><span className="text-muted-foreground">Your Answer:</span> <span className="font-semibold">{userAns}</span></p>
                            <p><span className="text-green-600 font-semibold">Correct Answer:</span> <span className="font-bold">{q.correct_answer}</span></p>
                          </div>
                        )}

                        {q.explanation && (
                          <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-xs text-muted-foreground mt-2">
                            <span className="font-semibold text-primary block mb-1">Explanation:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Play Mode: Displaying single question */
              <div className="h-full flex flex-col justify-between max-w-lg mx-auto py-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                    <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-sm capitalize">
                      {difficulty}
                    </span>
                  </div>

                  <h3 className="font-semibold text-base leading-relaxed text-foreground">
                    {activeQuestion?.question}
                  </h3>

                  {/* Options */}
                  {activeQuestion?.options && activeQuestion.options.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                      {activeQuestion.options.map((opt) => {
                        const selected = selectedAnswers[currentQuestionIndex] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleOptionSelect(opt)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                              selected
                                ? "border-primary bg-primary/10 font-semibold text-primary"
                                : "border-border hover:bg-muted text-foreground"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Short answer input */
                    <div className="mt-4">
                      <textarea
                        value={shortAnswers[currentQuestionIndex] || ""}
                        onChange={(e) => handleShortAnswerChange(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full h-24 p-3 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Navigation Button */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleNextQuestion}
                    className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <span>
                      {currentQuestionIndex < activeQuiz.questions.length - 1
                        ? "Next Question"
                        : "Finish Quiz"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
