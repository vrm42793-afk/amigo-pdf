"use client";

import React, { useState, useEffect } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { getRevisionNotesAction } from "@/actions/study/study-actions";
import { FileRow } from "@/types/files.types";
import { StudyNoteType } from "@/types/study/study.types";
import { BookOpen, Download, Sparkles, AlertCircle, CheckCircle, RefreshCw, FileText, Binary } from "lucide-react";
import CommentThread from "@/components/comments/CommentThread";

export default function RevisionPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [noteType, setNoteType] = useState<StudyNoteType>("unit_notes");
  const [noteContent, setNoteContent] = useState("");

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  const handleGenerateNotes = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    setNoteContent("");

    const res = await getRevisionNotesAction({
      fileId: selectedFile.id,
      type: noteType,
    });

    if (res.success && res.data) {
      setNoteContent(res.data.content);
      setSuccessMessage("Study material loaded successfully!");
    } else {
      setErrorMessage(res.error || "Failed to generate study notes");
    }
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!noteContent || !selectedFile) return;
    const blob = new Blob([noteContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${noteType}_${selectedFile.name.replace(/\.[^/.]+$/, "")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const studyTypes: { value: StudyNoteType; label: string; desc: string; icon: React.ReactNode }[] = [
    { 
      value: "unit_notes", 
      label: "Unit-wise Notes", 
      desc: "Detailed chapter-by-chapter structured study guides",
      icon: <BookOpen className="h-4 w-4" />
    },
    { 
      value: "summary_sheet", 
      label: "Cram Sheet", 
      desc: "High-impact key terms and quick-recall takeaways",
      icon: <FileText className="h-4 w-4" />
    },
    { 
      value: "formula_sheet", 
      label: "Formula & Reference List", 
      desc: "Extracted math, physics formulas and code metrics",
      icon: <Binary className="h-4 w-4" />
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Study Revision & Cram Suite
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate comprehensive university revision notes, exam-focused cram sheets, and equations from your uploaded PDFs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration block */}
        <div className="space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
              Configuration
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
                      setNoteContent("");
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

            {/* Note type selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Study Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                {studyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setNoteType(type.value);
                      setNoteContent("");
                    }}
                    className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      noteType === type.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-primary">
                      {type.icon}
                    </div>
                    <div>
                      <span className="font-semibold text-xs block">{type.label}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{type.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateNotes}
              disabled={!selectedFile || isGenerating}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating revision notes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Study Materials
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[620px]">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Generated Materials
            </span>
            {noteContent && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors bg-background"
              >
                <Download className="h-3.5 w-3.5" />
                Download Markdown
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  Structuring information, scanning equations, and drafting sheets...
                </p>
              </div>
            ) : !noteContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No revision content loaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document and study format, then generate to compile materials.
                </p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                {noteContent}
              </div>
            )}
          </div>
        </div>

        {/* Discussion Thread for the File */}
        {selectedFile && (
          <div className="lg:col-span-3 glass rounded-xl border border-border overflow-hidden lg:h-[600px] mt-6">
            <CommentThread entityType="study_note" entityId={selectedFile.id} />
          </div>
        )}
      </div>
    </div>
  );
}
