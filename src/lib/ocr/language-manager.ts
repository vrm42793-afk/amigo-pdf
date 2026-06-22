import type { OcrLanguage } from "@/types/ocr/ocr.types";

/**
 * Maps our internal language codes to Tesseract.js language codes.
 */
export function getTesseractLangCode(lang: OcrLanguage | undefined): string {
  if (!lang) return "eng";
  
  const map: Record<OcrLanguage, string> = {
    eng: "eng",
    spa: "spa",
    fra: "fra",
    deu: "deu",
    hin: "hin",
    tel: "tel",
    tam: "tam",
    kan: "kan",
  };
  
  return map[lang] || "eng";
}
