"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { addWatermarkAction } from "@/actions/pdf/watermark";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import { GlassInput } from "@/components/ui-premium/inputs/glass-input";
import { Stamp } from "lucide-react";

export default function WatermarkPage() {
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");

  return (
    <PdfToolLayout
      title="Add Watermark"
      description="Stamp a custom text watermark diagonally across all pages of your PDF."
      icon={<Stamp className="h-6 w-6 text-accent" />}
      acceptMultiple={false}
      outputFileName="watermarked.pdf"
      controlsSlot={
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground tracking-tight">
            Watermark Text
          </label>
          <GlassInput
            name="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="e.g. DRAFT, CONFIDENTIAL, DO NOT COPY"
            className="w-full h-10"
            required
          />
          <p className="text-xs font-medium text-muted-foreground mt-1">
            This text will be applied as a light gray overlay across the center of every page.
          </p>
        </div>
      }
      onProcess={async (formData): Promise<ProcessResult> => {
        const result = await addWatermarkAction(formData);
        return {
          buffer: "buffer" in result ? result.buffer : undefined,
          error: "error" in result ? result.error : undefined,
          fileName: `watermarked_${Date.now()}.pdf`,
        };
      }}
    />
  );
}
