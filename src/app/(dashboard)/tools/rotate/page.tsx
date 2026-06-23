"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { rotatePdfAction } from "@/actions/pdf/rotate-pdf";
import { GlassInput } from "@/components/ui-premium/inputs/glass-input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import type { RotationDegrees } from "@/types/pdf/pdf.types";
import { RefreshCw } from "lucide-react";

const DEGREES: RotationDegrees[] = [90, 180, 270];

export default function RotatePage() {
  const [degrees, setDegrees] = useState<RotationDegrees>(90);
  const [pages, setPages] = useState("");

  return (
    <PdfToolLayout
      title="Rotate PDF"
      description="Rotate all pages or specific pages of a PDF."
      icon={<RefreshCw className="h-6 w-6 text-accent" />}
      outputFileName="rotated.pdf"
      controlsSlot={
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground tracking-tight">Rotation Degrees</p>
            <div className="flex gap-3">
              {DEGREES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDegrees(d)}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition-all duration-200 ${
                    degrees === d
                      ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                      : "border-surface-border bg-surface/50 hover:border-accent/40 text-foreground"
                  }`}
                >
                  {d}°
                </button>
              ))}
            </div>
            <input type="hidden" name="degrees" value={degrees} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground tracking-tight" htmlFor="rotate-pages">
              Pages (optional)
            </label>
            <GlassInput
              id="rotate-pages"
              name="pages"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="e.g. 1, 3, 5 — leave empty for all pages"
              className="w-full h-10"
            />
          </div>
        </div>
      }
      onProcess={async (formData): Promise<ProcessResult> => {
        const result = await rotatePdfAction(formData);
        return result;
      }}
    />
  );
}
