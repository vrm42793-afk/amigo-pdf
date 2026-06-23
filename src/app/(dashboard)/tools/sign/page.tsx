"use client";

import React, { useState, useEffect } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { FileRow } from "@/types/files.types";
import { SignatureWorkspace } from "@/components/signatures/signature-workspace";
import { PenTool, FileText, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolPageLayout } from "@/components/ui-premium/surfaces/tool-page-layout";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";
import { motion } from "framer-motion";

export default function SignDocumentPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await getUserFilesAction();
        if (res.success && res.data) {
          setFiles(res.data);
        } else {
          toast.error(res.error || "Failed to load files");
        }
      } catch {
        toast.error("An error occurred while loading files");
      } finally {
        setLoadingFiles(false);
      }
    }
    loadFiles();
  }, []);

  if (selectedFile) {
    return (
      <ToolPageLayout
        title={`Signing Document: ${selectedFile.name}`}
        description="Drag, drop, resize, and place signatures or dates on the PDF pages."
        icon={<PenTool className="h-6 w-6 text-accent" />}
      >
        <div className="flex justify-end mb-4">
          <GlassButton
            onClick={() => setSelectedFile(null)}
            variant="secondary"
            size="sm"
          >
            Back to Select File
          </GlassButton>
        </div>
        <SignatureWorkspace
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      </ToolPageLayout>
    );
  }

  return (
    <ToolPageLayout
      title="E-Signature Tool"
      description="Select a PDF document from your vault to begin placement of signatures."
      icon={<PenTool className="h-6 w-6 text-accent" />}
    >
      <div className="space-y-4">
        <label className="text-sm font-bold text-foreground tracking-tight block">
          Select Document to Sign
        </label>
        
        {loadingFiles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <GlassCard className="text-sm text-yellow-600 border-yellow-500/30 bg-yellow-500/5 p-5 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">Please upload a PDF file in the Dashboard/My Files first!</span>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {files
              .filter((f) => f.type.includes("pdf"))
              .map((f, i) => (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={f.id}
                  onClick={() => setSelectedFile(f)}
                  className="w-full flex items-center justify-between p-4 rounded-xl glass-panel hover:bg-surface-hover hover:border-accent/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-shadow">
                      <FileText className="h-4.5 w-4.5 text-accent shrink-0" />
                    </div>
                    <span className="text-sm font-bold truncate text-foreground pr-2">
                      {f.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 group-hover:text-accent transition-colors">
                    Sign &rarr;
                  </span>
                </motion.button>
              ))}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
