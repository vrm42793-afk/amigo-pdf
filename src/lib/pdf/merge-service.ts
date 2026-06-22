import { PDFDocument } from "pdf-lib";
import { loadPdf } from "./pdf-service";
import type { MergeInput, PdfOperationResult } from "@/types/pdf/pdf.types";

/**
 * Merge multiple PDF buffers into a single PDF in the order provided.
 */
export async function mergePdfs(input: MergeInput): Promise<PdfOperationResult> {
  if (input.buffers.length < 2) {
    throw new Error("At least 2 PDFs are required to merge");
  }

  const merged = await PDFDocument.create();

  for (const buf of input.buffers) {
    const src = await loadPdf(buf);
    const pageIndices = src.getPageIndices();
    const copiedPages = await merged.copyPages(src, pageIndices);
    copiedPages.forEach((page) => merged.addPage(page));

    if (input.preserveMetadata && input.buffers.indexOf(buf) === 0) {
      // Copy metadata from the first document
      const title = src.getTitle();
      const author = src.getAuthor();
      const subject = src.getSubject();
      if (title) merged.setTitle(title);
      if (author) merged.setAuthor(author);
      if (subject) merged.setSubject(subject);
    }
  }

  merged.setProducer("AMIGO PDF");
  merged.setCreator("AMIGO PDF");
  merged.setModificationDate(new Date());

  const bytes = await merged.save();
  const buffer = Buffer.from(bytes);

  return {
    buffer,
    pageCount: merged.getPageCount(),
    sizeBytes: buffer.length,
  };
}
