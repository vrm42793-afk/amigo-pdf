"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Download, AlertCircle, CheckCircle2, Loader2, FileText, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { ToolPageLayout } from "@/components/ui-premium/surfaces/tool-page-layout";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";

interface PdfToolLayoutProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
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
  icon = <FileIcon className="h-6 w-6 text-accent" />,
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
    <ToolPageLayout title={title} description={description} icon={icon}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Advanced Glass Drop Zone */}
        <motion.div
          whileHover={{ scale: isDragging ? 1 : 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 min-h-[220px] overflow-hidden ${
            isDragging
              ? "border-accent bg-accent/10 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              : files.length > 0
                ? "border-accent/40 bg-surface/50 hover:bg-surface-hover"
                : "border-surface-border bg-surface/30 hover:border-accent/50 hover:bg-surface-hover"
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
            <div className="space-y-3 w-full max-w-lg mx-auto z-10 relative">
              {files.map((f) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={f.name} 
                  className="flex items-center justify-between rounded-xl bg-surface border border-surface-border px-4 py-3 shadow-sm hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileText className="h-5 w-5 text-accent shrink-0" />
                    <span className="font-semibold text-sm truncate text-foreground">{f.name}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground shrink-0 ml-3 bg-surface-hover px-2 py-1 rounded-md">{formatBytes(f.size)}</span>
                </motion.div>
              ))}
              <p className="text-xs font-bold text-muted-foreground/80 pt-2 tracking-widest uppercase">Click to change file{acceptMultiple ? "s" : ""}</p>
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
                  {acceptMultiple ? "Drop PDF files here" : "Drop a PDF here"}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">or click to browse</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Dynamic Controls Slot */}
        {(controlsSlot || children) && (
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            {controlsSlot}
            {children}
          </div>
        )}

        <GlassButton
          type="submit"
          variant="default"
          disabled={files.length === 0 || isProcessing}
          className="w-full text-base h-12 shadow-[0_4px_14px_rgba(212,175,55,0.4)]"
          id="pdf-process-btn"
        >
          {isProcessing ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing Magic...</>
          ) : (
            `Process PDF${acceptMultiple ? "s" : ""}`
          )}
        </GlassButton>
      </form>

      {/* Results Rendering */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="space-y-4 mt-8"
          >
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest px-1">Results</h3>
            {results.map((r, i) => (
              r.buffer ? (
                <GlassCard key={i} className="flex items-center justify-between p-4 bg-[#10B981]/5 border-[#10B981]/20 group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground tracking-tight">
                        {r.fileName ?? outputFileName}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {r.pageCount} page{r.pageCount !== 1 ? "s" : ""} &middot; {formatBytes(r.sizeBytes ?? 0)}
                      </p>
                    </div>
                  </div>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    className="gap-2 shrink-0 group-hover:bg-surface"
                    onClick={() => downloadBase64Pdf(r.buffer!, r.fileName ?? outputFileName)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </GlassButton>
                </GlassCard>
              ) : r.error ? (
                <GlassCard key={i} className="flex items-center gap-4 p-4 border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-destructive">Processing Error</p>
                    <p className="text-xs text-destructive/80 mt-0.5">{r.error}</p>
                  </div>
                </GlassCard>
              ) : null
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPageLayout>
  );
}
