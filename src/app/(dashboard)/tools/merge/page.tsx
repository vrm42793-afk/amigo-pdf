"use client";

import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { mergePdfAction } from "@/actions/pdf/merge-pdf";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import { Merge } from "lucide-react";

export default function MergePage() {
  return (
    <PdfToolLayout
      title="Merge PDFs"
      description="Combine multiple PDF files into one document in your chosen order."
      icon={<Merge className="h-6 w-6 text-accent" />}
      acceptMultiple={true}
      outputFileName="merged.pdf"
      onProcess={async (formData): Promise<ProcessResult> => {
        const result = await mergePdfAction(formData);
        return result;
      }}
    />
  );
}
