import { createWorker } from "tesseract.js";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";
import { PDFDocument } from "pdf-lib";
import { getTesseractLangCode } from "./language-manager";
import type { SearchablePdfInput, SearchablePdfResult } from "@/types/ocr/ocr.types";

async function renderPageToImage(pdfDocument: PDFDocumentProxy, pageNumber: number): Promise<Buffer> {
  const page = await pdfDocument.getPage(pageNumber);
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");
  // @ts-expect-error - pdfjs-dist types for RenderParameters might be incompatible with node-canvas
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toBuffer("image/png");
}

/**
 * Generate a Searchable PDF by running OCR on each page, getting the text-layer PDF 
 * from Tesseract, and merging the resulting pages.
 */
export async function createSearchablePdf(
  input: SearchablePdfInput,
  onProgress?: (progress: number) => void
): Promise<SearchablePdfResult> {
  const lang = getTesseractLangCode(input.language);
  const worker = await createWorker(lang);

  try {
    const data = new Uint8Array(input.buffer);
    const pdfTask = getDocument({ data, useSystemFonts: true });
    const pdfDocument = await pdfTask.promise;
    
    const pageCount = pdfDocument.numPages;
    const mergedPdf = await PDFDocument.create();

    for (let i = 1; i <= pageCount; i++) {
      const imgBuffer = await renderPageToImage(pdfDocument, i);
      
      // Request PDF output from Tesseract
      const ret = await worker.recognize(imgBuffer, { pdfTitle: "Page " + i }, { pdf: true } as Record<string, unknown>);
      
      // Tesseract.js returns the PDF data inside ret.data.pdf as an array or Buffer depending on version
      // In v5+ it's an ArrayLike or Uint8Array
      if (ret.data.pdf) {
        const pdfBuffer = Buffer.from(ret.data.pdf as unknown as number[]);
        const pagePdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pagePdf, pagePdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } else {
        throw new Error("Tesseract did not return a PDF layer for page " + i);
      }

      if (onProgress) {
        onProgress(Math.round((i / pageCount) * 100));
      }
    }

    mergedPdf.setProducer("AMIGO PDF OCR Engine");
    mergedPdf.setCreator("AMIGO PDF");

    const bytes = await mergedPdf.save();
    const buffer = Buffer.from(bytes);

    return {
      buffer,
      sizeBytes: buffer.length,
      pageCount,
    };
  } finally {
    await worker.terminate();
  }
}
