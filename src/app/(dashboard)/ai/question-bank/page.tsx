"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBattleAction } from "@/actions/quiz-battle/battle-actions";
import { getUserFilesAction } from "@/actions/files/list-files";
import {
  generateQuestionsAction,
  getQuestionsAction,
  getSubjectsAction,
  getUnitsAction,
  getQuestionBankStatsAction,
  deleteQuestionAction,
} from "@/actions/study/question-bank-actions";
import { FileRow } from "@/types/files.types";
import { QuestionBankItem, QuestionDifficulty, QuestionBankStats } from "@/types/study/question-bank.types";
import {
  Database,
  Sparkles,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  EyeOff,
  Swords
} from "lucide-react";

export default function QuestionBankPage() {
  const router = useRouter();
  // Files
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Generation form
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Bank state
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [stats, setStats] = useState<QuestionBankStats | null>(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<QuestionDifficulty | "">("");
  const [filterMarks, setFilterMarks] = useState<number | "">("");
  const [filterUnit, setFilterUnit] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // UI
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load files on mount
  useEffect(() => {
    async function loadFiles() {
      const res = await getUserFilesAction();
      if (res.success && res.data) {
        setFiles(res.data);
        if (res.data.length > 0) {
          setSelectedFile(res.data[0]);
        }
      }
      setLoadingFiles(false);
    }
    loadFiles();
  }, []);

  // Load subjects and stats on mount
  useEffect(() => {
    async function loadMeta() {
      const [subjectsRes, statsRes] = await Promise.all([
        getSubjectsAction(),
        getQuestionBankStatsAction(),
      ]);
      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(subjectsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    }
    loadMeta();
  }, []);

  // Load units when filter subject changes
  useEffect(() => {
    async function loadUnits() {
      if (!filterSubject) {
        setUnits([]);
        setFilterUnit("");
        return;
      }
      const res = await getUnitsAction(filterSubject);
      if (res.success && res.data) {
        setUnits(res.data);
      }
    }
    loadUnits();
  }, [filterSubject]);

  // Load questions with filters
  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    const res = await getQuestionsAction({
      subject: filterSubject || undefined,
      unit: filterUnit || undefined,
      difficulty: (filterDifficulty as QuestionDifficulty) || undefined,
      marks: filterMarks ? Number(filterMarks) : undefined,
    });
    if (res.success && res.data) {
      setQuestions(res.data);
    }
    setLoadingQuestions(false);
  }, [filterSubject, filterUnit, filterDifficulty, filterMarks]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuestions();
  }, [loadQuestions]);

  const handleGenerate = async () => {
    if (!selectedFile || !subject.trim()) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    const res = await generateQuestionsAction({
      fileId: selectedFile.id,
      subject: subject.trim(),
      unit: unit.trim() || undefined,
    });

    if (res.success && res.data) {
      setSuccessMessage(`Generated ${res.data.length} questions successfully!`);
      // Refresh everything
      await loadQuestions();
      const [subjectsRes, statsRes] = await Promise.all([
        getSubjectsAction(),
        getQuestionBankStatsAction(),
      ]);
      if (subjectsRes.success && subjectsRes.data) setSubjects(subjectsRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } else {
      setErrorMessage(res.error || "Failed to generate questions");
    }
    setIsGenerating(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const res = await deleteQuestionAction(questionId);
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (stats) {
        setStats({ ...stats, totalQuestions: stats.totalQuestions - 1 });
      }
    }
  };

  const handleExportWorksheet = () => {
    if (questions.length === 0) return;
    const filtered = getFilteredQuestions();
    let md = `# Question Bank Worksheet\n`;
    md += `**Subject:** ${filterSubject || "All"} | **Difficulty:** ${filterDifficulty || "All"} | **Total:** ${filtered.length}\n\n---\n\n`;

    filtered.forEach((q, i) => {
      md += `## Q${i + 1}. [${q.marks} marks] [${q.difficulty.toUpperCase()}]\n`;
      md += `${q.question}\n\n`;
      if (showAnswers) {
        md += `**Answer:** ${q.answer}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `question_bank_${filterSubject || "all"}_worksheet.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartBattle = async () => {
    if (questions.length === 0) return;
    setErrorMessage("");
    setSuccessMessage("");
    const title = `Battle: ${filterSubject || "All Subjects"}`;
    const res = await createBattleAction(title, null, Math.min(questions.length, 10), 5);
    if (res.success && res.data) {
      router.push(`/tools/quiz-battle/${res.data.id}`);
      return;
    }
    if (!res.success) {
      setErrorMessage(res.error || "Failed to start battle.");
    }
  };

  const getFilteredQuestions = () => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase();
    return questions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.unit && item.unit.toLowerCase().includes(q))
    );
  };

  const getDifficultyColor = (d: QuestionDifficulty) => {
    switch (d) {
      case "easy":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "hard":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30";
    }
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Smart Question Bank
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate, filter, and export exam questions from your study materials. Build subject-wise repositories for targeted revision.
        </p>
      </div>

      {/* Stats bar */}
      {stats && stats.totalQuestions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-border bg-card rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.totalQuestions}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Questions</p>
          </div>
          <div className="border border-border bg-card rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.subjects.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Subjects</p>
          </div>
          <div className="border border-border bg-card rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.byDifficulty.easy}</p>
            <p className="text-xs text-muted-foreground font-medium">Easy</p>
          </div>
          <div className="border border-border bg-card rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.byDifficulty.hard}</p>
            <p className="text-xs text-muted-foreground font-medium">Hard</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Generator + Filters */}
        <div className="space-y-4">
          {/* Generator */}
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Generate Questions
            </h3>

            {/* Document select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Source Document
              </label>
              {loadingFiles ? (
                <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-xl bg-muted/30">
                  <AlertCircle className="h-6 w-6 text-yellow-500 mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">No Documents Found</p>
                  <p className="text-xs text-muted-foreground mb-4">You need to upload a PDF to your vault before using this feature.</p>
                  <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                    Upload a PDF
                  </a>
                </div>
              ) : (
                <select
                  value={selectedFile?.id || ""}
                  onChange={(e) => {
                    const found = files.find((f) => f.id === e.target.value);
                    if (found) setSelectedFile(found);
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Data Structures, DBMS, Physics"
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Unit (optional) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Unit / Topic (optional)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Trees, Normalization, Thermodynamics"
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedFile || !subject.trim() || isGenerating}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Questions
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Filter Bank
            </h3>

            {/* Subject filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  setFilterUnit("");
                }}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Unit filter */}
            {units.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Unit</label>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">All Units</option>
                  {units.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Difficulty filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as QuestionDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDifficulty(filterDifficulty === d ? "" : d)}
                    className={`text-xs font-semibold py-1.5 rounded-md border capitalize transition-colors ${
                      filterDifficulty === d
                        ? getDifficultyColor(d)
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Marks filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Marks</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 7].map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMarks(filterMarks === m ? "" : m)}
                    className={`text-xs font-semibold py-1.5 rounded-md border transition-colors ${
                      filterMarks === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m}M
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(filterSubject || filterDifficulty || filterMarks || filterUnit) && (
              <button
                onClick={() => {
                  setFilterSubject("");
                  setFilterDifficulty("");
                  setFilterMarks("");
                  setFilterUnit("");
                }}
                className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Right Column — Question List */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Question Bank
              {filteredQuestions.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  ({filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""})
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors bg-background"
                title={showAnswers ? "Hide answers" : "Show answers"}
              >
                {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showAnswers ? "Hide" : "Show"} Answers
              </button>
              {filteredQuestions.length > 0 && (
                <button
                  onClick={handleExportWorksheet}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors bg-background"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              )}
              {filteredQuestions.length > 0 && (
                <button
                  onClick={handleStartBattle}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-transparent rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <Swords className="h-3.5 w-3.5" />
                  Start Battle
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-border bg-muted/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full h-8 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Messages */}
          {(successMessage || errorMessage) && (
            <div className="px-6 pt-3 space-y-2">
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
            </div>
          )}

          {/* Question list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ maxHeight: "calc(100vh - 340px)" }}>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-16">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                  Analyzing document, categorizing topics, and drafting questions...
                </p>
              </div>
            ) : loadingQuestions ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
                <Database className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No questions in the bank</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document, enter a subject, and generate your first question set.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, index) => {
                const isExpanded = expandedId === q.id;
                return (
                  <div
                    key={q.id}
                    className="border border-border rounded-lg overflow-hidden bg-background hover:bg-muted/30 transition-colors"
                  >
                    {/* Question header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="w-full text-left px-4 py-3 flex items-start gap-3"
                    >
                      <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0 w-7">
                        Q{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium line-clamp-2">{q.question}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-muted/50">
                            {q.marks}M
                          </span>
                          {q.unit && (
                            <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">
                              {q.unit}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded answer */}
                    {(isExpanded || showAnswers) && (
                      <div className="border-t border-border px-4 py-3 bg-muted/10">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-primary mt-0.5 shrink-0 w-7">
                            Ans
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {q.answer}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-muted-foreground">
                                Subject: {q.subject}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(q.id);
                                }}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
