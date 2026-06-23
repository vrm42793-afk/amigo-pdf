"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Download, Loader2, Copy, CheckCircle2, FileText, ScanText } from "lucide-react";
import { toast } from "sonner";
import { extractTextAction } from "@/actions/ocr/extract-text";
import { createSearchablePdfAction } from "@/actions/ocr/create-searchable-pdf";
import type { OcrLanguage } from "@/types/ocr/ocr.types";
import { ToolPageLayout } from "@/components/ui-premium/surfaces/tool-page-layout";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";

const LANGUAGES: { value: OcrLanguage; label: string }[] = [
  { value: "eng", label: "English" },
  { value: "spa", label: "Spanish" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
  { value: "hin", label: "Hindi" },
];

function downloadBase64Pdf(base64: string, fileName: string) {
  const blob = new Blob([Buffer.from(base64, "base64")], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTextFile(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<OcrLanguage>("eng");
  const [mode, setMode] = useState<"text" | "searchable">("text");

  const [extractedText, setExtractedText] = useState("");
  const [pdfResult, setPdfResult] = useState<{ buffer: string; pageCount: number; sizeBytes: number } | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const f = incoming[0];
    if (f.type !== "application/pdf" && !f.type.startsWith("image/")) {
      toast.error("Please select a PDF or image file");
      return;
    }
    setFile(f);
    setExtractedText("");
    setPdfResult(null);
    setConfidence(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success("Text copied to clipboard");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file first"); return; }
    
    setIsProcessing(true);
    setExtractedText("");
    setPdfResult(null);
    setConfidence(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      if (mode === "text") {
        const res = await extractTextAction(formData);
        if (res.error) throw new Error(res.error);
        setExtractedText(res.text ?? "");
        setConfidence(res.confidence ?? null);
        toast.success("Text extracted successfully");
      } else {
        if (file.type !== "application/pdf") {
          throw new Error("Searchable PDF generation requires a PDF input");
        }
        const res = await createSearchablePdfAction(formData);
        if (res.error) throw new Error(res.error);
        setPdfResult({ buffer: res.buffer!, pageCount: res.pageCount!, sizeBytes: res.sizeBytes! });
        toast.success("Searchable PDF created successfully");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OCR Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolPageLayout
      title="AI OCR Engine"
      description="Extract text from images and scanned PDFs, or generate searchable PDF documents."
      icon={<ScanText className="h-6 w-6 text-accent" />}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drop Zone */}
        <motion.div
          whileHover={{ scale: isDragging ? 1 : 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 min-h-[220px] overflow-hidden ${
            isDragging
              ? "border-accent bg-accent/10 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              : file
                ? "border-accent/40 bg-surface/50 hover:bg-surface-hover"
                : "border-surface-border bg-surface/30 hover:border-accent/50 hover:bg-surface-hover"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />

          {file ? (
            <div className="z-10 relative space-y-3 w-full max-w-lg mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl bg-surface border border-surface-border px-4 py-3 shadow-sm hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className="h-5 w-5 text-accent shrink-0" />
                  <span className="font-semibold text-sm truncate text-foreground">{file.name}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0 ml-3 bg-surface-hover px-2 py-1 rounded-md">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </motion.div>
              <p className="text-xs font-bold text-muted-foreground/80 pt-2 tracking-widest uppercase">Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 z-10 relative">
              <motion.div
                animate={isDragging ? { y: [-5, 5, -5] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl backdrop-blur-xl border shadow-lg transition-all duration-300 ${isDragging ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface border-surface-border text-muted-foreground"}`}
              >
                <UploadCloud className="h-8 w-8" />
              </motion.div>
              <div>
                <p className={`text-base font-bold tracking-tight ${isDragging ? "text-accent" : "text-foreground"}`}>
                  Drop a PDF or Image here
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">PNG, JPG, or PDF supported</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Output Mode */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground tracking-tight">Output Mode</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition-all duration-200 ${
                  mode === "text" ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-surface-border bg-surface/50 hover:border-accent/40 text-foreground"
                }`}
              >
                Extract Text
              </button>
              <button
                type="button"
                onClick={() => setMode("searchable")}
                disabled={file ? file.type !== "application/pdf" : false}
                className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === "searchable" ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-surface-border bg-surface/50 hover:border-accent/40 text-foreground"
                }`}
              >
                Searchable PDF
              </button>
            </div>
            {mode === "searchable" && file && file.type !== "application/pdf" && (
              <p className="text-xs font-medium text-destructive mt-1">Searchable PDF requires a PDF file.</p>
            )}
          </div>

          {/* Language */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground tracking-tight">Document Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as OcrLanguage)}
                className="w-full rounded-xl border border-surface-border bg-surface/50 hover:bg-surface px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <GlassButton
          type="submit"
          disabled={Boolean(!file || isProcessing || (mode === "searchable" && file.type !== "application/pdf"))}
          className="w-full h-12 text-base shadow-[0_4px_14px_rgba(212,175,55,0.4)]"
        >
          {isProcessing ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing OCR...</>
          ) : (
            "Start OCR Engine"
          )}
        </GlassButton>
      </form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {extractedText && mode === "text" && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="space-y-4 mt-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                </div>
                <p className="text-sm font-bold text-foreground">Extraction Complete</p>
                {confidence !== null && (
                  <span className="text-[10px] font-bold bg-surface-hover border border-surface-border px-2 py-0.5 rounded-md text-muted-foreground uppercase tracking-wider">
                    {confidence.toFixed(1)}% Confidence
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <GlassButton size="sm" variant="secondary" onClick={handleCopy} className="gap-2 h-8 text-xs">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </GlassButton>
                <GlassButton size="sm" variant="secondary" onClick={() => downloadTextFile(extractedText, "ocr-result.txt")} className="gap-2 h-8 text-xs">
                  <Download className="h-3.5 w-3.5" /> Save .txt
                </GlassButton>
              </div>
            </div>
            <GlassCard className="p-5 h-[350px] overflow-y-auto custom-scrollbar bg-surface/30">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{extractedText}</pre>
            </GlassCard>
          </motion.div>
        )}

        {pdfResult && mode === "searchable" && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mt-8"
          >
            <GlassCard className="flex items-center justify-between p-4 bg-[#10B981]/5 border-[#10B981]/20">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Searchable PDF Ready</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {pdfResult.pageCount} pages · {(pdfResult.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <GlassButton
                size="sm"
                variant="default"
                className="gap-2 shrink-0"
                onClick={() => downloadBase64Pdf(pdfResult.buffer, "searchable-document.pdf")}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPageLayout>
  );
}
