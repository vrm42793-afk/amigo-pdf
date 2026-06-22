import { degrees } from "pdf-lib";
import { loadPdf } from "./pdf-service";
import { resolvePages } from "./pdf-service";
import type { RotateInput, PdfOperationResult } from "@/types/pdf/pdf.types";

/**
 * Rotate pages in a PDF. Supports 90°, 180°, and 270° rotations.
 * If `pages` is omitted, all pages are rotated.
 */
export async function rotatePdf(input: RotateInput): Promise<PdfOperationResult> {
  const doc = await loadPdf(input.buffer);
  const pageCount = doc.getPageCount();

  const targetPages =
    input.pages && input.pages.length > 0
      ? resolvePages(input.pages, pageCount)
      : Array.from({ length: pageCount }, (_, i) => i + 1);

  for (const pageNum of targetPages) {
    const page = doc.getPage(pageNum - 1); // 0-indexed
    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + input.degrees) % 360;
    page.setRotation(degrees(newRotation));
  }

  doc.setModificationDate(new Date());

  const bytes = await doc.save();
  const buffer = Buffer.from(bytes);

  return {
    buffer,
    pageCount: doc.getPageCount(),
    sizeBytes: buffer.length,
  };
}
