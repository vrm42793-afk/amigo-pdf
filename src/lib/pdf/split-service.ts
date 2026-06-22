import { PDFDocument } from "pdf-lib";
import { loadPdf, validatePageRange } from "./pdf-service";
import type { SplitInput, SplitResult, PdfOperationResult } from "@/types/pdf/pdf.types";

/**
 * Split a PDF into multiple parts based on page ranges.
 * Each range produces one output PDF.
 */
export async function splitPdf(input: SplitInput): Promise<SplitResult> {
  if (input.ranges.length === 0) {
    throw new Error("At least one page range is required");
  }

  const src = await loadPdf(input.buffer);
  const pageCount = src.getPageCount();

  // Validate all ranges first
  for (const range of input.ranges) {
    const err = validatePageRange(range, pageCount);
    if (err) throw new Error(err);
  }

  const parts: PdfOperationResult[] = [];

  for (const range of input.ranges) {
    const doc = await PDFDocument.create();

    // Convert 1-indexed range to 0-indexed indices
    const indices: number[] = [];
    for (let i = range.start - 1; i <= range.end - 1; i++) {
      indices.push(i);
    }

    const copiedPages = await doc.copyPages(src, indices);
    copiedPages.forEach((page) => doc.addPage(page));

    doc.setProducer("AMIGO PDF");
    doc.setCreator("AMIGO PDF");

    const bytes = await doc.save();
    const buffer = Buffer.from(bytes);

    parts.push({
      buffer,
      pageCount: doc.getPageCount(),
      sizeBytes: buffer.length,
    });
  }

  return { parts };
}

/**
 * Parse a human-readable page range string into PageRange objects.
 * Supports:
 *   "1-5"    → [{ start:1, end:5 }]
 *   "1,3,5"  → [{ start:1, end:1 }, { start:3, end:3 }, { start:5, end:5 }]
 *   "1-3,7"  → [{ start:1, end:3 }, { start:7, end:7 }]
 */
export function parsePageRangeString(
  input: string
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [s, e] = part.split("-").map((n) => parseInt(n, 10));
      if (isNaN(s) || isNaN(e)) throw new Error(`Invalid range: "${part}"`);
      ranges.push({ start: s, end: e });
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n)) throw new Error(`Invalid page number: "${part}"`);
      ranges.push({ start: n, end: n });
    }
  }

  return ranges;
}
