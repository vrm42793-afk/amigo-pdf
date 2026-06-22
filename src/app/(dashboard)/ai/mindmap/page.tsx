"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { getUserFilesAction } from "@/actions/files/list-files";
import { getRevisionNotesAction } from "@/actions/study/study-actions";
import { FileRow } from "@/types/files.types";
import { Sparkles, AlertCircle, CheckCircle, RefreshCw, GitFork, Download } from "lucide-react";

// Declared global for CDN script usage
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mermaid: any;
  }
}

export default function MindmapPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [mermaidSyntax, setMermaidSyntax] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Initialize Mermaid once loaded
  useEffect(() => {
    if (typeof window !== "undefined" && window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
        mindmap: {
          useMaxWidth: true,
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMermaidLoaded(true);
    }
  }, []);

  // Render Mermaid syntax to SVG
  const renderDiagram = async (syntax: string) => {
    if (!syntax || !window.mermaid) return;
    setRenderError(false);
    try {
      // Clear previous container and create unique id
      const uniqueId = `mermaid-svg-${Date.now()}`;
      
      // Render using the global mermaid library
      const { svg } = await window.mermaid.render(uniqueId, syntax);
      setSvgHtml(svg);
    } catch (err) {
      console.error("Mermaid rendering failed:", err);
      setRenderError(true);
      setSvgHtml("");
    }
  };

  // Re-render when syntax changes or Mermaid loads
  useEffect(() => {
    if (mermaidSyntax && mermaidLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      renderDiagram(mermaidSyntax);
    }
  }, [mermaidSyntax, mermaidLoaded]);

  const handleGenerateMindMap = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    setMermaidSyntax("");
    setSvgHtml("");
    setRenderError(false);

    const res = await getRevisionNotesAction({
      fileId: selectedFile.id,
      type: "mindmap",
    });

    if (res.success && res.data) {
      setMermaidSyntax(res.data.content);
      setSuccessMessage("Mind map generated successfully!");
    } else {
      setErrorMessage(res.error || "Failed to generate mind map");
    }
    setIsGenerating(false);
  };

  const handleDownloadSvg = () => {
    if (!svgHtml || !selectedFile) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mindmap_${selectedFile.name.replace(/\.[^/.]+$/, "")}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Dynamic script loading for Mermaid.js from CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.mermaid) {
            window.mermaid.initialize({
              startOnLoad: false,
              theme: "neutral",
              securityLevel: "loose",
              mindmap: {
                useMaxWidth: true,
              }
            });
            setMermaidLoaded(true);
            if (mermaidSyntax) {
              renderDiagram(mermaidSyntax);
            }
          }
        }}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <GitFork className="h-6 w-6 text-primary" />
          AI Mind Map Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visualize document structures, dependencies, and concepts dynamically with auto-generated hierarchical mind maps.
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
                      setMermaidSyntax("");
                      setSvgHtml("");
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

            <button
              onClick={handleGenerateMindMap}
              disabled={!selectedFile || isGenerating}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating mind map...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Mind Map
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visualizer Area */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[620px]">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold flex items-center gap-2">
              <GitFork className="h-4 w-4 text-primary" />
              Mind Map Canvas
            </span>
            {svgHtml && (
              <button
                onClick={handleDownloadSvg}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors bg-background"
              >
                <Download className="h-3.5 w-3.5" />
                Export SVG
              </button>
            )}
          </div>

          {/* Canvas area */}
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-muted/5">
            {successMessage && (
              <div className="w-full max-w-xl mx-auto mb-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-semibold border border-green-200 dark:border-green-900/30 flex items-center gap-2 shrink-0">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="w-full max-w-xl mx-auto mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 flex items-center gap-2 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                  Querying Gemini, clustering topics, and mapping node connections...
                </p>
              </div>
            ) : renderError ? (
              <div className="text-center space-y-2 p-6 max-w-md border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Diagram Render Failed</h4>
                <p className="text-xs text-muted-foreground">
                  The AI-generated mind map output contains syntax characters that could not be read. Try re-generating.
                </p>
              </div>
            ) : !svgHtml ? (
              <div className="text-center text-muted-foreground py-12">
                <GitFork className="h-10 w-10 text-muted-foreground/50 mb-2 mx-auto" />
                <p className="text-sm font-medium">No diagram loaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document and click generate to render the interactive conceptual hierarchy.
                </p>
              </div>
            ) : (
              <div 
                ref={containerRef}
                className="w-full h-full flex items-center justify-center overflow-auto p-4 select-none [&>svg]:max-w-full [&>svg]:h-auto dark:[&_rect]:fill-card dark:[&_text]:fill-foreground [&_.node_circle]:stroke-primary"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
