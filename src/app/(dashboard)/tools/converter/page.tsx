"use client";

import { useState } from "react";
import { convertImagesToPdfAction } from "@/actions/pdf/convert";
import { UploadCloud, Download, AlertCircle, CheckCircle2, Loader2, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileImage className="h-6 w-6 text-primary" />
          Image to PDF Converter
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select multiple JPG or PNG images to combine them into a single PDF document.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop Zone */}
        <motion.div
          animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById("img-upload")?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all min-h-[180px] ${
            isDragging
              ? "border-primary bg-primary/5"
              : files.length > 0
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card/50 hover:border-primary/50"
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
            <div className="space-y-2 w-full max-h-[300px] overflow-y-auto">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-medium truncate">{f.name}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
              <p className="text-xs text-primary pt-1 font-medium">Click to select different images</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Drop Image files here (JPG, PNG)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
              </div>
            </div>
          )}
        </motion.div>

        <Button
          type="submit"
          disabled={files.length === 0 || isProcessing}
          className="w-full gap-2"
        >
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Converting…</>
          ) : (
            "Convert to PDF"
          )}
        </Button>
      </form>

      <AnimatePresence>
        {resultBase64 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  converted_document.pdf
                </p>
                <p className="text-xs text-muted-foreground">
                  {files.length} pages
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={downloadPdf}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
