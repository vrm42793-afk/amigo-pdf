"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];

export function DropZone({ onFilesSelected, isUploading = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const valid = Array.from(files);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [onFilesSelected]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <motion.div
      animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.15 }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-colors duration-200 cursor-pointer select-none min-h-[220px] ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary hover:bg-primary/5"
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        id="file-upload-input"
        multiple
        accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading}
      />

      <AnimatePresence mode="wait">
        {isDragging ? (
          <motion.div
            key="dragging"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center bg-primary/20">
              <UploadCloud className="h-7 w-7 text-primary animate-bounce" />
            </div>
            <p className="text-base font-semibold text-primary">Drop to upload</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center bg-muted">
              <UploadCloud className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Drag & drop files here
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, XLSX, PPTX, PNG, JPG — up to 100MB each
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 pointer-events-none"
              tabIndex={-1}
            >
              <FolderOpen className="h-4 w-4" />
              Browse Files
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
