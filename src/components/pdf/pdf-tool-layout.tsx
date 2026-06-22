"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PdfToolLayoutProps {
  title: string;
  description: string;
  acceptMultiple?: boolean;
  controlsSlot?: React.ReactNode;
  onProcess: (formData: FormData) => Promise<ProcessResult | ProcessResult[]>;
  outputFileName?: string;
  children?: React.ReactNode;
}

export interface ProcessResult {
  buffer?: string;   // base64
  pageCount?: number;
  sizeBytes?: number;
  error?: string;
  fileName?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBase64Pdf(base64: string, fileName: string) {
  const blob = new Blob([Buffer.from(base64, "base64")], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function PdfToolLayout({
  title,
  description,
  acceptMultiple = false,
  controlsSlot,
  onProcess,
  outputFileName = "result.pdf",
  children,
}: PdfToolLayoutProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type === "application/pdf");
    if (valid.length === 0) { toast.error("Please select PDF files only"); return; }
    setFiles(acceptMultiple ? valid : [valid[0]]);
    setResults([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) { toast.error("Please select a PDF file first"); return; }
    setIsProcessing(true);
    setResults([]);

    try {
      const formData = new FormData(e.currentTarget);
      // Ensure files are attached (some browsers may not include them automatically)
      if (acceptMultiple) {
        files.forEach((f) => formData.append("files", f));
      } else {
        formData.set("file", files[0]);
      }

      const raw = await onProcess(formData);
      const resultArr = Array.isArray(raw) ? raw : [raw];

      if (resultArr[0]?.error) {
        toast.error(resultArr[0].error);
      } else {
        setResults(resultArr);
        toast.success("Processing complete!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Drop Zone */}
        <motion.div
          animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all min-h-[180px] ${
            isDragging
              ? "border-primary bg-primary/5"
              : files.length > 0
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card/50 hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple={acceptMultiple}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {files.length > 0 ? (
            <div className="space-y-2 w-full">
              {files.map((f) => (
                <div key={f.name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-medium truncate">{f.name}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{formatBytes(f.size)}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">Click to change file{acceptMultiple ? "s" : ""}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {acceptMultiple ? "Drop PDF files here" : "Drop a PDF here"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Controls */}
        {controlsSlot && <div className="space-y-3">{controlsSlot}</div>}
        {children}

        <Button
          type="submit"
          disabled={files.length === 0 || isProcessing}
          className="w-full gap-2"
          id="pdf-process-btn"
        >
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
          ) : (
            "Process PDF"
          )}
        </Button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {results.map((r, i) => (
              r.buffer ? (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {r.fileName ?? outputFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.pageCount} page{r.pageCount !== 1 ? "s" : ""} · {formatBytes(r.sizeBytes ?? 0)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 shrink-0"
                    onClick={() => downloadBase64Pdf(r.buffer!, r.fileName ?? outputFileName)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ) : r.error ? (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{r.error}</p>
                </div>
              ) : null
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
