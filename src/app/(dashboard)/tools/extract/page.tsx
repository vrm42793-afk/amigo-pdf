"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { extractPagesAction } from "@/actions/pdf/extract-pages";
import { Input } from "@/components/ui/input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";

export default function ExtractPage() {
  const [pages, setPages] = useState("1, 3, 5");

  return (
    <PdfToolLayout
      title="Extract Pages"
      description="Pull specific pages from a PDF into a new document."
      outputFileName="extracted.pdf"
      controlsSlot={
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="extract-pages">
            Pages to Extract
          </label>
          <Input
            id="extract-pages"
            name="pages"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g. 1, 3, 5-8"
          />
          <p className="text-xs text-muted-foreground">
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
