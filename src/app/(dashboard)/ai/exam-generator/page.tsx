"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { generateExamAction, getExamsAction, getExamQuestionsAction } from "@/actions/study/study-actions";
import { FileRow } from "@/types/files.types";
import { Exam, ExamQuestion } from "@/types/study/study.types";
import { Sparkles, FileText, Printer, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw, ChevronRight, Clock, Award } from "lucide-react";

export default function ExamGeneratorPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [customTitle, setCustomTitle] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingExamQuestions, setLoadingExamQuestions] = useState(false);

  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  
  const [visibleGuides, setVisibleGuides] = useState<Record<string, boolean>>({});

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

  // Load historical exams when file changes
  const loadExams = useCallback(async () => {
    if (!selectedFile) return;
    const res = await getExamsAction(selectedFile.id);
    if (res.success && res.data) {
      setExamsList(res.data);
      if (res.data.length > 0) {
        // Automatically view the latest exam
        const latest = res.data[0];
        setSelectedExam(latest);
      } else {
        setSelectedExam(null);
        setQuestions([]);
      }
    }
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) return;
    loadExams();
  }, [selectedFile, loadExams]);

  // Load questions when selected exam changes
  useEffect(() => {
    async function loadQuestions() {
      if (!selectedExam) {
        setQuestions([]);
        return;
      }
      setLoadingExamQuestions(true);
      const res = await getExamQuestionsAction(selectedExam.id);
      if (res.success && res.data) {
        setQuestions(res.data);
        // Reset answer visibility
        setVisibleGuides({});
      }
      setLoadingExamQuestions(false);
    }
    loadQuestions();
  }, [selectedExam]);

  const handleGenerateExam = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    const res = await generateExamAction({
      fileId: selectedFile.id,
      customTitle: customTitle.trim() || undefined,
    });

    if (res.success && res.data) {
      setSuccessMessage("Mock exam generated successfully!");
      setCustomTitle("");
      // Reload history and set active
      const resExams = await getExamsAction(selectedFile.id);
      if (resExams.success && resExams.data) {
        setExamsList(resExams.data);
        setSelectedExam(res.data.exam);
      }
    } else {
      setErrorMessage(res.error || "Failed to generate exam questions");
    }
    setIsGenerating(false);
  };

  const toggleGuide = (questionId: string) => {
    setVisibleGuides(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          University Exam Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Assess your preparedness using balanced exams (1, 2, 5, and 7 marks) generated from your study resources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Settings block */}
        <div className="space-y-4 print:hidden">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
              Exam Settings
            </h3>

            {/* Document select */}
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
                    if (found) {
                      setSelectedFile(found);
                      setExamsList([]);
                      setSelectedExam(null);
                      setQuestions([]);
                    }
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Optional Title input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Custom Exam Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Midterm Practice Exam"
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            <button
              onClick={handleGenerateExam}
              disabled={!selectedFile || isGenerating}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Compiling Exam Sheet...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Exam
                </>
              )}
            </button>
          </div>

          {/* Historical Exams list */}
          {examsList.length > 0 && (
            <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
                Generated Exams
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {examsList.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExam(e)}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedExam?.id === e.id
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{e.title}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output Sheet */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm print:border-none print:shadow-none print:bg-transparent overflow-hidden min-h-[500px]">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20 print:hidden">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Exam Paper View
            </span>
            {questions.length > 0 && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors bg-background"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Exam Paper
              </button>
            )}
          </div>

          {/* Paper Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-semibold border border-green-200 dark:border-green-900/30 flex items-center gap-2 print:hidden">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 flex items-center gap-2 print:hidden">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isGenerating || loadingExamQuestions ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16 print:hidden">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                  Reviewing concepts, distributing marks, and formatting marking sheets...
                </p>
              </div>
            ) : !selectedExam ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-16 print:hidden">
                <Award className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No practice exam selected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document and generate to create a new evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-6 print:space-y-4">
                {/* Print/Visual Exam Header */}
                <div className="border-b border-border pb-4 space-y-2">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">{selectedExam.title}</h2>
                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">Amigo PDF Assessment Engine</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Duration: {selectedExam.duration_minutes} Minutes
                    </span>
                    <span>Max Marks: {questions.reduce((sum, q) => sum + (q.marks || 0), 0)}</span>
                  </div>
                </div>

                {/* Exam Questions list */}
                <div className="space-y-6 print:space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-2 break-inside-avoid">
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-sm text-foreground font-medium flex gap-2">
                          <span className="shrink-0">{idx + 1}.</span>
                          <span>{q.question_text}</span>
                        </div>
                        <div className="text-xs font-bold text-primary shrink-0 whitespace-nowrap bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full print:bg-transparent print:border-none print:p-0">
                          [{q.marks} {q.marks === 1 ? "Mark" : "Marks"}]
                        </div>
                      </div>

                      {q.page_reference && (
                        <p className="text-[10px] text-muted-foreground ml-6 italic print:hidden">
                          Page Reference Estimate: Page {q.page_reference}
                        </p>
                      )}

                      {/* Marking Guide (Self Test Accordion) */}
                      <div className="ml-6 print:hidden">
                        <button
                          onClick={() => toggleGuide(q.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                        >
                          {visibleGuides[q.id] ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              Hide Marking Guide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              Show Marking Guide
                            </>
                          )}
                        </button>

                        {visibleGuides[q.id] && (
                          <div className="mt-2 p-3 bg-muted/40 border border-border rounded-lg text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                            <span className="font-bold text-primary text-[10px] block mb-1 uppercase tracking-wider">Evaluation Guide / Answer Key:</span>
                            {q.marking_guide}
                          </div>
                        )}
                      </div>

                      {/* Printable/PDF version of answers (appended to print output cleanly) */}
                      <div className="hidden print:block ml-6 text-xs italic text-muted-foreground/80 pt-1 border-t border-dashed border-border/50">
                        <span className="font-semibold text-[10px] text-foreground uppercase tracking-widest block">Guide:</span>
                        {q.marking_guide}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
