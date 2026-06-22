"use client";

import React, { useState } from "react";
import { Upload, AlertCircle, FileImage } from "lucide-react";
import { toast } from "sonner";

interface SignatureUploaderProps {
  onSave: (base64Data: string, width: number, height: number) => void;
  onCancel?: () => void;
}

export function SignatureUploader({ onSave, onCancel }: SignatureUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isTransparent, setIsTransparent] = useState<boolean | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate size (< 2MB)
    if (selected.size > 2 * 1024 * 1024) {
      toast.error("Signature image must be under 2MB");
      return;
    }

    // Validate extension
    if (selected.type !== "image/png") {
      toast.error("Signature file must be a PNG image to preserve transparency");
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);

      // Check transparency using offscreen canvas
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          
          // Heuristic: check if at least some pixels are transparent
          let transparentPixels = 0;
          const pixelCount = img.width * img.height;
          
          for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] < 255) {
              transparentPixels++;
            }
          }

          const ratio = transparentPixels / pixelCount;
          setIsTransparent(ratio > 0.01); // At least 1% transparency
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(selected);
  };

  const handleSave = () => {
    if (!preview || !dimensions) return;
    if (isTransparent === false) {
      if (!confirm("This signature image appears to have a solid background (no transparency). Would you like to save it anyway?")) {
        return;
      }
    }
    onSave(preview, dimensions.width, dimensions.height);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Upload className="h-4 w-4 text-primary" />
        <span>Upload Signature (PNG)</span>
      </div>

      <div className="border border-dashed border-border bg-muted/20 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors relative">
        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {preview ? (
          <div className="space-y-3">
            <div className="h-24 max-w-full flex items-center justify-center bg-white dark:bg-zinc-950 p-2 border border-border rounded-lg shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Signature preview" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
              <FileImage className="h-3.5 w-3.5" />
              <span>
                {file?.name} ({dimensions?.width}x{dimensions?.height}px)
              </span>
            </div>

            {isTransparent === false && (
              <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-2.5 rounded-lg flex items-center gap-2 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>We recommend using signatures with a transparent background.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Click to upload signature</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Supports PNG only, up to 2MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!preview}
          className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          Save Template
        </button>
      </div>
    </div>
  );
}
