"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { compressPdfAction } from "@/actions/pdf/compress-pdf";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import type { CompressionLevel } from "@/types/pdf/pdf.types";
import { Minimize2 } from "lucide-react";

const LEVELS: { value: CompressionLevel; label: string; hint: string }[] = [
  { value: "low", label: "Low", hint: "Fastest, minimal compression" },
  { value: "medium", label: "Medium", hint: "Balanced speed and size" },
  { value: "high", label: "High", hint: "Smallest output, slowest" },
];

export default function CompressPage() {
  const [level, setLevel] = useState<CompressionLevel>("medium");

  return (
    <PdfToolLayout
      title="Compress PDF"
      description="Reduce PDF file size while preserving readability."
      icon={<Minimize2 className="h-6 w-6 text-accent" />}
      outputFileName="compressed.pdf"
      controlsSlot={
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground tracking-tight">Compression Level</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`glass-panel rounded-xl px-4 py-4 text-center transition-all duration-200 ${
                  level === l.value
                    ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : "border-surface-border bg-surface/50 hover:border-accent/40 hover:bg-surface-hover"
                }`}
              >
                <p className={`text-sm font-bold ${level === l.value ? "text-accent" : "text-foreground"}`}>{l.label}</p>
                <p className={`text-[11px] font-medium mt-1 ${level === l.value ? "text-accent/80" : "text-muted-foreground"}`}>{l.hint}</p>
              </button>
            ))}
          </div>
          <input type="hidden" name="level" value={level} />
        </div>
      }
      onProcess={async (formData): Promise<ProcessResult> => {
        const result = await compressPdfAction(formData);
        return result;
      }}
    />
  );
}
