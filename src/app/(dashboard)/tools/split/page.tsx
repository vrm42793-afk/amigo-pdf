"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { splitPdfAction } from "@/actions/pdf/split-pdf";
import { Input } from "@/components/ui/input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";

export default function SplitPage() {
  const [rangeString, setRangeString] = useState("1-3, 4-6");

  return (
    <PdfToolLayout
      title="Split PDF"
      description="Divide a PDF into multiple parts using page ranges."
      outputFileName="split.pdf"
      controlsSlot={
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="range-input">
            Page Ranges
          </label>
          <Input
            id="range-input"
            name="rangeString"
            value={rangeString}
            onChange={(e) => setRangeString(e.target.value)}
            placeholder="e.g. 1-3, 4-6, 7"
          />
          <p className="text-xs text-muted-foreground">
            Use commas to separate ranges. Each range produces one PDF.
          </p>
        </div>
      }
      onProcess={async (formData): Promise<ProcessResult[]> => {
        const result = await splitPdfAction(formData);
        if (result.error) return [{ error: result.error }];
        return (result.parts ?? []).map((p, i) => ({
          buffer: p.buffer,
          pageCount: p.pageCount,
          sizeBytes: p.sizeBytes,
          fileName: `part-${i + 1}.pdf`,
        }));
      }}
    />
  );
}
