"use client";

import { useState, useRef } from "react";
import { Plus, Camera, Image, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileUpload } from "@/hooks/use-file-upload";
import MobileScanner from "@/components/mobile/mobile-scanner";

export function MobileUploadFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { uploadFiles, queue } = useFileUpload();

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = queue.some((q) => q.status === "uploading" || q.status === "pending");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsOpen(false);
      await uploadFiles(files);
    }
  };

  const handleScannerCapture = async (file: File) => {
    setShowScanner(false);
    setIsOpen(false);
    await uploadFiles([file]);
  };

  return (
    <>
      {/* Backdrop for closing when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Button (Only on Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden flex flex-col items-end gap-3">
        {/* Sub-buttons menu */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-3 mb-2">
              {/* Scan option */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.8 }}
                onClick={() => {
                  setShowScanner(true);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/95 transition-all text-xs font-semibold active:scale-95 cursor-pointer"
              >
                <span>Scan Document</span>
                <Camera className="h-4 w-4" />
              </motion.button>

              {/* Photo library option */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.8 }}
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-muted transition-all text-xs font-semibold active:scale-95 cursor-pointer"
              >
                <span>Photo Library</span>
                <Image className="h-4 w-4 text-muted-foreground" />
              </motion.button>

              {/* Browse Files option */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.8 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-muted transition-all text-xs font-semibold active:scale-95 cursor-pointer"
              >
                <span>Browse Files</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* Main Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-primary-foreground transition-all duration-300 active:scale-95 cursor-pointer ${
            isUploading
              ? "bg-amber-500 animate-pulse"
              : isOpen
              ? "bg-muted text-foreground border border-border rotate-45"
              : "bg-primary hover:bg-primary/95"
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Plus className="h-6 w-6 transition-transform" />
          )}
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/*,.docx,.xlsx,.pptx"
        multiple
        className="hidden"
      />

      {/* Fullscreen Mobile Scanner Modal */}
      {showScanner && (
        <MobileScanner
          onCapture={handleScannerCapture}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
