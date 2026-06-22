import { PDFDocument } from "pdf-lib";
import { loadPdf, resolvePages } from "./pdf-service";
import type { DeletePagesInput, PdfOperationResult } from "@/types/pdf/pdf.types";

/**
 * Delete specific pages from a PDF, returning the remaining pages as a new document.
 */
export async function deletePagesFromPdf(input: DeletePagesInput): Promise<PdfOperationResult> {
  if (input.pages.length === 0) {
    throw new Error("At least one page number is required");
  }

  const src = await loadPdf(input.buffer);
  const pageCount = src.getPageCount();

  const toDelete = new Set(resolvePages(input.pages, pageCount));

  if (toDelete.size >= pageCount) {
    throw new Error("Cannot delete all pages from a PDF");
  }

  // Build the list of pages to keep (1-indexed)
  const toKeep: number[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (!toDelete.has(i)) toKeep.push(i);
  }

  const doc = await PDFDocument.create();
  const indices = toKeep.map((p) => p - 1);
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
