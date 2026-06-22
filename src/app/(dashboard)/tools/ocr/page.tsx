"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Download, Loader2, Copy, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { extractTextAction } from "@/actions/ocr/extract-text";
import { createSearchablePdfAction } from "@/actions/ocr/create-searchable-pdf";
import type { OcrLanguage } from "@/types/ocr/ocr.types";

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI OCR Engine</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Extract text from images and scanned PDFs, or generate searchable PDF documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop Zone */}
        <motion.div
          animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all min-h-[160px] ${
            isDragging
              ? "border-primary bg-primary/5"
              : file
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
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
            <div className="flex items-center gap-3 rounded-lg bg-card border border-border px-4 py-3 shadow-sm">
              <FileText className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Drop a PDF or Image here</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, or PDF supported</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          {/* Output Mode */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Output Mode</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                  mode === "text" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40 text-foreground"
                }`}
              >
                Extract Text
              </button>
              <button
                type="button"
                onClick={() => setMode("searchable")}
                disabled={file ? file.type !== "application/pdf" : false}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === "searchable" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40 text-foreground"
                }`}
              >
                Searchable PDF
              </button>
            </div>
            {mode === "searchable" && file && file.type !== "application/pdf" && (
              <p className="text-xs text-destructive mt-1">Searchable PDF requires a PDF file.</p>
            )}
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Document Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as OcrLanguage)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={Boolean(!file || isProcessing || (mode === "searchable" && file.type !== "application/pdf"))}
          className="w-full gap-2"
        >
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing OCR (this may take a minute)...</>
          ) : (
            "Start OCR Engine"
          )}
        </Button>
      </form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {extractedText && mode === "text" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-foreground">Extraction Complete</p>
                {confidence !== null && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {confidence.toFixed(1)}% Confidence
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadTextFile(extractedText, "ocr-result.txt")} className="gap-2">
                  <Download className="h-4 w-4" /> Save .txt
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 h-[300px] overflow-y-auto custom-scrollbar">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{extractedText}</pre>
            </div>
          </motion.div>
        )}

        {pdfResult && mode === "searchable" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Searchable PDF Ready</p>
                <p className="text-xs text-muted-foreground">
                  {pdfResult.pageCount} pages · {(pdfResult.sizeBytes / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="default"
              className="gap-2 shrink-0"
              onClick={() => downloadBase64Pdf(pdfResult.buffer, "searchable-document.pdf")}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
