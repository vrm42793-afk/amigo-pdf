import { createWorker } from "tesseract.js";
import { getTesseractLangCode } from "./language-manager";
import type { OcrImageInput, OcrImageResult } from "@/types/ocr/ocr.types";

/**
 * Extract text from a single image buffer using Tesseract.js.
 */
export async function ocrImage(input: OcrImageInput): Promise<OcrImageResult> {
  const lang = getTesseractLangCode(input.language);
  const worker = await createWorker(lang);

  try {
    const ret = await worker.recognize(input.buffer);
    return {
      text: ret.data.text,
      confidence: ret.data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}
