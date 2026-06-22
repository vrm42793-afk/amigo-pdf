import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { createCanvas } from "canvas";
import { getTesseractLangCode } from "./language-manager";
import type { OcrPdfInput, OcrPdfResult, OcrPageResult } from "@/types/ocr/ocr.types";

/**
 * Render a single PDF page to a PNG buffer using pdfjs-dist and canvas.
 */
async function renderPageToImage(pdfDocument: PDFDocumentProxy, pageNumber: number): Promise<Buffer> {
  const page = await pdfDocument.getPage(pageNumber);
  const scale = 2.0; // Higher scale = better OCR resolution
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  // @ts-expect-error - pdfjs-dist RenderParameters issues
  await page.render(renderContext).promise;
  return canvas.toBuffer("image/png");
}

/**
 * Perform OCR on all pages of a PDF buffer.
 */
export async function ocrPdf(
  input: OcrPdfInput,
  onProgress?: (progress: number) => void
): Promise<OcrPdfResult> {
  const lang = getTesseractLangCode(input.language);
  const worker = await createWorker(lang);

  try {
    const data = new Uint8Array(input.buffer);
    const pdfTask = getDocument({ data, useSystemFonts: true });
    const pdfDocument = await pdfTask.promise;
    
    const pageCount = pdfDocument.numPages;
    const pages: OcrPageResult[] = [];
    let fullText = "";
    let totalConfidence = 0;

    for (let i = 1; i <= pageCount; i++) {
      const imgBuffer = await renderPageToImage(pdfDocument, i);
      const ret = await worker.recognize(imgBuffer);
      
      const pageText = ret.data.text;
      const conf = ret.data.confidence;
      
      pages.push({
        pageNumber: i,
        text: pageText,
        confidence: conf,
      });
      
      fullText += pageText + "\n\n";
      totalConfidence += conf;

      if (onProgress) {
        onProgress(Math.round((i / pageCount) * 100));
      }
    }

    return {
      pages,
      fullText: fullText.trim(),
      averageConfidence: pageCount > 0 ? totalConfidence / pageCount : 0,
    };
  } finally {
    await worker.terminate();
  }
}
