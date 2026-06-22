import { PDFDocument } from "pdf-lib";
import { loadPdf } from "./pdf-service";
import type { ReorderInput, PdfOperationResult } from "@/types/pdf/pdf.types";

/**
 * Reorder pages in a PDF according to a new 1-indexed page order array.
 * Example: newOrder=[3,1,2] → output has original page 3 first, then 1, then 2.
 */
export async function reorderPdfPages(input: ReorderInput): Promise<PdfOperationResult> {
  const src = await loadPdf(input.buffer);
  const pageCount = src.getPageCount();

  if (input.newOrder.length !== pageCount) {
    throw new Error(
      `newOrder must contain exactly ${pageCount} page numbers (received ${input.newOrder.length})`
    );
  }

  const sorted = [...input.newOrder].sort((a, b) => a - b);
  for (let i = 0; i < pageCount; i++) {
    if (sorted[i] !== i + 1) {
      throw new Error(`newOrder must contain each page number exactly once (1 to ${pageCount})`);
    }
  }

  const doc = await PDFDocument.create();
  const indices = input.newOrder.map((p) => p - 1); // Convert to 0-indexed
  const copiedPages = await doc.copyPages(src, indices);
  copiedPages.forEach((page) => doc.addPage(page));

  doc.setProducer("AMIGO PDF");
  doc.setCreator("AMIGO PDF");
  doc.setModificationDate(new Date());

  const bytes = await doc.save();
  const buffer = Buffer.from(bytes);

  return {
    buffer,
    pageCount: doc.getPageCount(),
    sizeBytes: buffer.length,
  };
}
