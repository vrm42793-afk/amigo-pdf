"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { rotatePdfAction } from "@/actions/pdf/rotate-pdf";
import { Input } from "@/components/ui/input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import type { RotationDegrees } from "@/types/pdf/pdf.types";

const DEGREES: RotationDegrees[] = [90, 180, 270];

export default function RotatePage() {
  const [degrees, setDegrees] = useState<RotationDegrees>(90);
  const [pages, setPages] = useState("");

  return (
    <PdfToolLayout
      title="Rotate PDF"
      description="Rotate all pages or specific pages of a PDF."
      outputFileName="rotated.pdf"
      controlsSlot={
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Rotation</p>
            <div className="flex gap-2">
              {DEGREES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDegrees(d)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                    degrees === d
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {d}°
                </button>
              ))}
            </div>
            <input type="hidden" name="degrees" value={degrees} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="rotate-pages">
              Pages (optional)
            </label>
            <Input
              id="rotate-pages"
              name="pages"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="e.g. 1, 3, 5 — leave empty for all pages"
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
