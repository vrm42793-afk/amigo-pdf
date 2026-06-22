"use client";

import React, { useState, useEffect } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { FileRow } from "@/types/files.types";
import { SignatureWorkspace } from "@/components/signatures/signature-workspace";
import { PenTool, FileText, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <PenTool className="h-5.5 w-5.5 text-primary" />
              Signing Document: {selectedFile.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag, drop, resize, and place signatures or dates on the PDF pages.
            </p>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="h-8 px-3 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Select File
          </button>
        </div>

        <SignatureWorkspace
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <PenTool className="h-6 w-6 text-primary" />
          E-Signature Tool
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a PDF document from your vault to begin placement of signatures.
        </p>
      </div>

      <div className="border border-border bg-card rounded-xl p-6 shadow-sm space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">
            Select Document to Sign
          </label>
          
          {loadingFiles ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-4 rounded-lg flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Please upload a PDF file in the Dashboard/My Files first!</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {files
                  .filter((f) => f.type.includes("pdf"))
                  .map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFile(f)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span className="text-xs font-medium truncate text-foreground pr-2">
                          {f.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 group-hover:text-primary transition-colors">
                        Select & Sign &rarr;
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
