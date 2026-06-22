import { PDFDocument } from "pdf-lib";
import { loadPdf, resolvePages } from "./pdf-service";
import type { ExtractInput, PdfOperationResult } from "@/types/pdf/pdf.types";

/**
 * Extract specific pages from a PDF into a new document.
 * Pages are provided as 1-indexed page numbers and are written in the order given.
 */
export async function extractPages(input: ExtractInput): Promise<PdfOperationResult> {
  if (input.pages.length === 0) {
    throw new Error("At least one page number is required");
  }

  const src = await loadPdf(input.buffer);
  const pageCount = src.getPageCount();
  const resolved = resolvePages(input.pages, pageCount);

  if (resolved.length === 0) {
    throw new Error("No valid pages in the requested selection");
  }

  const doc = await PDFDocument.create();
  // Convert 1-indexed to 0-indexed
  const indices = resolved.map((p) => p - 1);
  const copiedPages = await doc.copyPages(src, indices);
  copiedPages.forEach((page) => doc.addPage(page));

  doc.setProducer("AMIGO PDF");
  doc.setCreator("AMIGO PDF");

  const bytes = await doc.save();
  const buffer = Buffer.from(bytes);

  return {
    buffer,
    pageCount: doc.getPageCount(),
    sizeBytes: buffer.length,
  };
}
