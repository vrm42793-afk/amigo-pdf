"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { extractPagesAction } from "@/actions/pdf/extract-pages";
import { GlassInput } from "@/components/ui-premium/inputs/glass-input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import { FileUp } from "lucide-react";

export default function ExtractPage() {
  const [pages, setPages] = useState("1, 3, 5");

  return (
    <PdfToolLayout
      title="Extract Pages"
      description="Pull specific pages from a PDF into a new document."
      icon={<FileUp className="h-6 w-6 text-accent" />}
      outputFileName="extracted.pdf"
      controlsSlot={
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground tracking-tight" htmlFor="extract-pages">
            Pages to Extract
          </label>
          <GlassInput
            id="extract-pages"
            name="pages"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g. 1, 3, 5-8"
            className="w-full h-10"
          />
          <p className="text-xs font-medium text-muted-foreground/80">
            Enter page numbers separated by commas.
          </p>
        </div>
      }
      onProcess={async (formData): Promise<ProcessResult> => {
        const result = await extractPagesAction(formData);
        return result;
      }}
    />
  );
}
