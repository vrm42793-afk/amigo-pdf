"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { summarizeDocument, getCachedSummaries } from "@/actions/ai/summarize-document";
import { FileRow } from "@/types/files.types";
import { AISummaryType } from "@/types/ai/ai.types";
import { FileText, Download, Sparkles, AlertCircle, CheckCircle, RefreshCw, ChevronRight } from "lucide-react";

interface CachedSummary {
  id: string;
  summary_type: string;
  content: string;
  created_at: string;
}

export default function AiSummarizePage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [summaryType, setSummaryType] = useState<AISummaryType>("detailed");
  const [summaryContent, setSummaryContent] = useState("");
  const [cachedList, setCachedList] = useState<CachedSummary[]>([]);

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

  const loadCachedSummaries = useCallback(async () => {
    if (!selectedFile) return;
    const res = await getCachedSummaries(selectedFile.id);
    if (res.success && res.data) {
      const data = res.data as CachedSummary[];
      setCachedList(data);
      // Fallback to active summary type if cached
      const matchingCache = data.find(s => s.summary_type === summaryType);
      if (matchingCache) {
        setSummaryContent(matchingCache.content);
      } else if (data.length > 0) {
        setSummaryContent(data[0].content);
        setSummaryType(data[0].summary_type as AISummaryType);
      } else {
        setSummaryContent("");
      }
    }
  }, [selectedFile, summaryType]);

  // Fetch cached summaries when active file changes
  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    const timer = setTimeout(() => {
      loadCachedSummaries();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedFile, loadCachedSummaries]);

  const handleGenerateSummary = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSummaryContent("");

    const res = await summarizeDocument({
      fileId: selectedFile.id,
      summaryType
    });

    if (res.success && res.data) {
      setSummaryContent(res.data);
      setSuccessMessage("Summary generated successfully!");
      loadCachedSummaries();
    } else {
      setErrorMessage(res.error || "Failed to generate summary");
    }
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!summaryContent || !selectedFile) return;
    const blob = new Blob([summaryContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${summaryType}_summary_${selectedFile.name.replace(/\.[^/.]+$/, "")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryTypes: { value: AISummaryType; label: string; desc: string }[] = [
    { value: "short", label: "Short Summary", desc: "Quick 1-2 paragraph overview" },
    { value: "detailed", label: "Detailed Summary", desc: "Comprehensive section-by-section outline" },
    { value: "executive", label: "Executive Summary", desc: "High-level takeaways and core findings" },
    { value: "chapter", label: "Chapter Summary", desc: "Summary structured by main sections" },
    { value: "bullet", label: "Bullet Summary", desc: "Key facts listed as short bullets" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Summarizer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Condense long PDF documents into different formatted summaries instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings block */}
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
                    const found = files.find(f => f.id === e.target.value);
                    if (found) {
                      setSelectedFile(found);
                      setCachedList([]);
                      setSummaryContent("");
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

            {/* Types selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Summary Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {summaryTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSummaryType(type.value);
                      // Check if cached summary exists for this type
                      const match = cachedList.find(s => s.summary_type === type.value);
                      setSummaryContent(match ? match.content : "");
                    }}
                    className={`text-left p-3 rounded-lg border text-xs transition-all flex flex-col ${
                      summaryType === type.value
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
              onClick={handleGenerateSummary}
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
                  Generate Summary
                </>
              )}
            </button>
          </div>

          {/* Cached files summary */}
          {cachedList.length > 0 && (
            <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
                Cached Summaries
              </h3>
              <div className="space-y-2">
                {cachedList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSummaryContent(c.content);
                      setSummaryType(c.summary_type as AISummaryType);
                    }}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all ${
                      summaryType === c.summary_type && summaryContent === c.content
                        ? "border-primary/40 bg-primary/5 font-semibold text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="capitalize">{c.summary_type} Summary</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output blocks */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[600px]">
          {/* Output Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Resulting Summary
            </span>
            {summaryContent && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors bg-background"
              >
                <Download className="h-3.5 w-3.5" />
                Download Markdown
              </button>
            )}
          </div>

          {/* Output Content */}
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
                  Reading chunks, querying Gemini, and generating summary...
                </p>
              </div>
            ) : !summaryContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No summary loaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document and click &quot;Generate Summary&quot; to begin.
                </p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                {summaryContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
