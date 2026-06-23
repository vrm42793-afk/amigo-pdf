"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FolderOpen, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
}

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
      whileHover={{ scale: isDragging ? 1 : 1.01, rotateX: isDragging ? 0 : 2, rotateY: isDragging ? 0 : -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ perspective: 1000 }}
      className="w-full relative"
    >
      {/* Background glow when dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-accent/20 blur-[50px] rounded-full z-0"
          />
        )}
      </AnimatePresence>

      <GlassCard
        interactive
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative z-10 flex flex-col items-center justify-center p-12 text-center transition-all duration-300 cursor-pointer select-none min-h-[260px] overflow-hidden ${
          isDragging
            ? "border-accent border-dashed border-2 shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            : "border-surface-border border-dashed border-2 hover:border-accent/50"
        }`}
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

        {/* Soft Particles Effect during drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 50, x: (i - 3) * 30, opacity: 0, scale: 0 }}
                  animate={{ y: -100, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute bottom-10 left-1/2"
                >
                  <Sparkles className="h-4 w-4 text-accent/40" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="flex flex-col items-center gap-4 relative z-20"
            >
              <motion.div 
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 shadow-[0_10px_30px_rgba(212,175,55,0.3)] backdrop-blur-xl"
              >
                <UploadCloud className="h-10 w-10 text-accent" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-accent tracking-tight">Release to Upload</p>
                <p className="text-xs font-medium text-accent/80">Magic awaits...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="flex flex-col items-center gap-5 relative z-20"
            >
              <motion.div
                whileHover={{ y: -5, rotateZ: -5 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-surface-border shadow-lg"
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
              </motion.div>
              <div className="space-y-1.5">
                <p className="text-base font-bold text-foreground tracking-tight">
                  Drag & drop your files here
                </p>
                <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto">
                  Support for PDF, DOCX, XLSX, PPTX, PNG, JPG (up to 100MB)
                </p>
              </div>
              <GlassButton
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2 pointer-events-none mt-2"
                tabIndex={-1}
              >
                <FolderOpen className="h-4 w-4" />
                Browse Files
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
