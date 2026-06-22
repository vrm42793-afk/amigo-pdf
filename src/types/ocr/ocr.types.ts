export type OcrLanguage = "eng" | "spa" | "fra" | "deu" | "hin" | "tel" | "tam" | "kan";

export interface OcrImageInput {
  buffer: Buffer;
  language?: OcrLanguage;
}

export interface OcrPdfInput {
  buffer: Buffer;
  language?: OcrLanguage;
}

export interface SearchablePdfInput {
  buffer: Buffer;
  language?: OcrLanguage;
}

export interface OcrImageResult {
  text: string;
  confidence: number;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

export interface OcrPdfResult {
  pages: OcrPageResult[];
  fullText: string;
  averageConfidence: number;
}

export interface SearchablePdfResult {
  buffer: Buffer; // PDF buffer
  sizeBytes: number;
  pageCount: number;
}
