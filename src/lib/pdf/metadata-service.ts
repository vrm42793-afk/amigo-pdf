import { loadPdf } from "./pdf-service";
import { extractPdfMetadata } from "./pdf-service";
import type { PdfMetadata, PdfOperationResult } from "@/types/pdf/pdf.types";

export type { PdfMetadata };

/**
 * Get metadata for a PDF buffer.
 */
export async function getPdfMetadata(buffer: Buffer): Promise<PdfMetadata> {
  return extractPdfMetadata(buffer);
}

export interface MetadataUpdate {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

/**
 * Write new metadata into a PDF document and return the updated buffer.
 */
export async function updatePdfMetadata(
  buffer: Buffer,
  update: MetadataUpdate
): Promise<PdfOperationResult> {
  const doc = await loadPdf(buffer);

  if (update.title !== undefined) doc.setTitle(update.title);
  if (update.author !== undefined) doc.setAuthor(update.author);
  if (update.subject !== undefined) doc.setSubject(update.subject);
  if (update.keywords !== undefined) doc.setKeywords([update.keywords]);
  doc.setModificationDate(new Date());

  const bytes = await doc.save();
  const out = Buffer.from(bytes);

  return {
    buffer: out,
    pageCount: doc.getPageCount(),
    sizeBytes: out.length,
  };
}
