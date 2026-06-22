import { PDFDocument } from "pdf-lib";
import type {
  PdfValidationResult,
  PdfMetadata,
} from "@/types/pdf/pdf.types";

const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Validate a buffer as a valid, unencrypted PDF.
 */
export async function validatePdf(buffer: Buffer): Promise<PdfValidationResult> {
  if (buffer.length > MAX_PDF_SIZE) {
    return { valid: false, error: "PDF exceeds maximum size of 100MB" };
  }

  // Check PDF magic bytes: %PDF-
  if (!buffer.slice(0, 5).toString("ascii").startsWith("%PDF-")) {
    return { valid: false, error: "File is not a valid PDF" };
  }

  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    const isEncrypted = doc.isEncrypted;

    return { valid: true, pageCount, isEncrypted };
  } catch {
    return { valid: false, error: "PDF is corrupted or unreadable" };
  }
}

/**
 * Extract metadata from a PDF buffer using pdf-lib.
 */
export async function extractPdfMetadata(
  buffer: Buffer
): Promise<PdfMetadata> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  const title = doc.getTitle();
  const author = doc.getAuthor();
  const subject = doc.getSubject();
  const keywords = doc.getKeywords();
  const creator = doc.getCreator();
  const producer = doc.getProducer();
  const creationDate = doc.getCreationDate();
  const modDate = doc.getModificationDate();

  return {
    title: title ?? undefined,
    author: author ?? undefined,
    subject: subject ?? undefined,
    keywords: keywords ?? undefined,
    creator: creator ?? undefined,
    producer: producer ?? undefined,
    creationDate: creationDate?.toISOString(),
    modificationDate: modDate?.toISOString(),
    pageCount: doc.getPageCount(),
    fileSizeBytes: buffer.length,
    isEncrypted: doc.isEncrypted,
  };
}

/**
 * Load a PDFDocument, throwing a descriptive error if it fails.
 */
export async function loadPdf(buffer: Buffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(buffer);
  } catch {
    throw new Error("Failed to load PDF. The file may be corrupted or password-protected.");
  }
}

/**
 * Resolve a sparse page list (1-indexed) against a page count, deduplicated and sorted.
 */
export function resolvePages(pages: number[], pageCount: number): number[] {
  const unique = [...new Set(pages)].filter((p) => p >= 1 && p <= pageCount);
  return unique.sort((a, b) => a - b);
}

/**
 * Validate a 1-indexed page range against the document page count.
 */
export function validatePageRange(
  range: { start: number; end: number },
  pageCount: number
): string | null {
  if (range.start < 1) return "Page range start must be at least 1";
  if (range.end < range.start) return "Page range end must be >= start";
  if (range.end > pageCount)
    return `Page range end (${range.end}) exceeds document page count (${pageCount})`;
  return null;
}
