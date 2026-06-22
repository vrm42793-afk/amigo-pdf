"use server";

import { ocrImageAction } from "./ocr-image";
import { ocrPdfAction } from "./ocr-pdf";
import type { OcrPageResult } from "@/types/ocr/ocr.types";

export interface ExtractTextActionResult {
  jobId?: string;
  text?: string;
  pages?: OcrPageResult[];
  confidence?: number;
  error?: string;
}

export async function extractTextAction(formData: FormData): Promise<ExtractTextActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided" };

  if (file.type.startsWith("image/")) {
    const res = await ocrImageAction(formData);
    if (res.error) return { error: res.error };
    return {
      jobId: res.jobId,
      text: res.result?.text,
      confidence: res.result?.confidence,
    };
  } else if (file.type === "application/pdf") {
    const res = await ocrPdfAction(formData);
    if (res.error) return { error: res.error };
    return {
      jobId: res.jobId,
      text: res.result?.fullText,
      pages: res.result?.pages,
      confidence: res.result?.averageConfidence,
    };
  }

  return { error: "Unsupported file type. Use an image or a PDF." };
}
