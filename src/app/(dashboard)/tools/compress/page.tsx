"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { compressPdfAction } from "@/actions/pdf/compress-pdf";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import type { CompressionLevel } from "@/types/pdf/pdf.types";

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
      outputFileName="compressed.pdf"
      controlsSlot={
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Compression Level</p>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                name="level"
                value={l.value}
                onClick={() => setLevel(l.value)}
                className={`rounded-lg border px-3 py-3 text-center transition-all ${
                  level === l.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{l.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l.hint}</p>
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
