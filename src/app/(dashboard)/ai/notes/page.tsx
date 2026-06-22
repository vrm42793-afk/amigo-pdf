"use client";

import React, { useState, useEffect } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { generateStudyNotes, getUserNotes, deleteNote } from "@/actions/ai/generate-notes";
import { FileRow } from "@/types/files.types";
import { AINoteType, AINote } from "@/types/ai/ai.types";
import { StickyNote, Download, Trash, Sparkles, Check, Clipboard, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function AiNotesPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [noteType, setNoteType] = useState<AINoteType>("study");
  const [customTitle, setCustomTitle] = useState("");
  
  const [notesList, setNotesList] = useState<AINote[]>([]);
  const [activeNote, setActiveNote] = useState<AINote | null>(null);

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load files and notes on mount
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

      setLoadingNotes(true);
      const notesRes = await getUserNotes();
      if (notesRes.success && notesRes.data) {
        setNotesList(notesRes.data);
        if (notesRes.data.length > 0) {
          setActiveNote(notesRes.data[0]);
        }
      }
      setLoadingNotes(false);
    }
    loadInitialData();
  }, []);

  const handleGenerateNotes = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    const res = await generateStudyNotes({
      fileId: selectedFile.id,
      noteType,
      title: customTitle.trim() || undefined
    });

    if (res.success && res.data) {
      setNotesList(prev => [res.data!, ...prev]);
      setActiveNote(res.data!);
      setCustomTitle("");
      setSuccessMessage("Notes generated and saved successfully!");
    } else {
      setErrorMessage(res.error || "Failed to generate notes");
    }
    setIsGenerating(false);
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;
    const res = await deleteNote(noteId);
    if (res.success) {
      setNotesList(prev => prev.filter(n => n.id !== noteId));
      if (activeNote?.id === noteId) {
        setActiveNote(null);
      }
      setSuccessMessage("Note deleted successfully.");
    } else {
      setErrorMessage(res.error || "Failed to delete note");
    }
  };

  const handleCopy = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeNote.title.toLowerCase().replace(/\s+/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const noteTypes: { value: AINoteType; label: string; desc: string }[] = [
    { value: "study", label: "Study Notes", desc: "Core terms, concepts, and key definitions" },
    { value: "structured", label: "Structured Notes", desc: "Hierarchical header outline" },
    { value: "bullet", label: "Bullet Notes", desc: "List of summaries and takeaways" },
    { value: "revision", label: "Revision Guide", desc: "Active recall questions & cheat sheets" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-primary" />
          AI Study Notes
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate structured, revision-ready markdown notes from PDF files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings block */}
        <div className="space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
              Note Settings
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

            {/* Title field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Custom Title (Optional)
              </label>
              <input
                type="text"
                placeholder="E.g., Biology Chapter 2 Revision"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Note type list */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Notes Layout
              </label>
              <div className="grid grid-cols-1 gap-2">
                {noteTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setNoteType(type.value)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all flex flex-col ${
                      noteType === type.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    <span className="font-semibold">{type.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</span>
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Notes
                </>
              )}
            </button>
          </div>

          {/* Notes history list */}
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
              My Saved Notes
            </h3>

            {loadingNotes ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-muted animate-pulse rounded-md" />
              ))
            ) : notesList.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                No saved notes yet. Generate some above!
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {notesList.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setActiveNote(n)}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all group ${
                      activeNote?.id === n.id
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <StickyNote className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="truncate">{n.title}</span>
                    </div>
                    <Trash
                      onClick={(e) => handleDeleteNote(e, n.id)}
                      className="h-3.5 w-3.5 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes viewer window */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[650px]">
          {/* Header toolbar */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold truncate max-w-sm">
              {activeNote ? activeNote.title : "Study Notes Viewer"}
            </span>
            {activeNote && (
              <div className="flex items-center gap-2 bg-background p-1 border border-border rounded-lg shadow-xs">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy notes content"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <div className="w-px h-4 bg-border" />
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors flex items-center gap-1 text-[11px]"
                  title="Download Markdown file"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            )}
          </div>

          {/* View body */}
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
                  Structuring text segments, calling Gemini, and drafting notes...
                </p>
              </div>
            ) : !activeNote ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <StickyNote className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No study notes loaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a layout format and click &quot;Generate Notes&quot; above.
                </p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                {activeNote.content}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
