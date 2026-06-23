"use client";

import { useState } from "react";
import { convertImagesToPdfAction } from "@/actions/pdf/convert";
import { UploadCloud, Download, CheckCircle2, Loader2, FileImage } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ToolPageLayout } from "@/components/ui-premium/surfaces/tool-page-layout";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";

export default function ConverterPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBase64, setResultBase64] = useState<string | null>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) { toast.error("Please select Image files (JPG/PNG)"); return; }
    setFiles(valid);
    setResultBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      
      const result = await convertImagesToPdfAction(formData);
      
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else if ("buffer" in result && result.buffer) {
        setResultBase64(result.buffer);
        toast.success("Converted successfully!");
      }
    } catch (err) {
      toast.error("Failed to convert images");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!resultBase64) return;
    const blob = new Blob([Buffer.from(resultBase64, "base64")], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted_${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPageLayout
      title="Image to PDF Converter"
      description="Select multiple JPG or PNG images to combine them into a single PDF document."
      icon={<FileImage className="h-6 w-6 text-accent" />}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drop Zone */}
        <motion.div
          whileHover={{ scale: isDragging ? 1 : 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById("img-upload")?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 min-h-[220px] overflow-hidden ${
            isDragging
              ? "border-accent bg-accent/10 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              : files.length > 0
                ? "border-accent/40 bg-surface/50 hover:bg-surface-hover"
                : "border-surface-border bg-surface/30 hover:border-accent/50 hover:bg-surface-hover"
          }`}
        >
          <input
            id="img-upload"
            type="file"
            accept="image/jpeg, image/png"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {files.length > 0 ? (
            <div className="z-10 relative space-y-3 w-full max-w-lg mx-auto max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {files.map((f, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className="flex items-center justify-between rounded-xl bg-surface border border-surface-border px-4 py-3 shadow-sm hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileImage className="h-5 w-5 text-accent shrink-0" />
                    <span className="font-semibold text-sm truncate text-foreground">{f.name}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground shrink-0 ml-3 bg-surface-hover px-2 py-1 rounded-md">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                </motion.div>
              ))}
              <p className="text-xs font-bold text-muted-foreground/80 pt-2 tracking-widest uppercase">Click to select different images</p>
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
                  Drop Image files here (JPG, PNG)
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">or click to browse</p>
              </div>
            </div>
          )}
        </motion.div>

        <GlassButton
          type="submit"
          disabled={files.length === 0 || isProcessing}
          className="w-full h-12 text-base shadow-[0_4px_14px_rgba(212,175,55,0.4)]"
        >
          {isProcessing ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Converting Magic…</>
          ) : (
            "Convert to PDF"
          )}
        </GlassButton>
      </form>

      <AnimatePresence>
        {resultBase64 && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mt-8"
          >
            <GlassCard className="flex items-center justify-between p-4 bg-[#10B981]/5 border-[#10B981]/20 group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    converted_document.pdf
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {files.length} pages
                  </p>
                </div>
              </div>
              <GlassButton size="sm" variant="secondary" className="gap-2 shrink-0 group-hover:bg-surface" onClick={downloadPdf}>
                <Download className="h-4 w-4" /> Download PDF
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPageLayout>
  );
}
