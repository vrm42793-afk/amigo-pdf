// ─── Page Range ─────────────────────────────────────────────────────────────

export interface PageRange {
  start: number; // 1-indexed
  end: number;   // 1-indexed, inclusive
}

export type CompressionLevel = "low" | "medium" | "high";
export type RotationDegrees = 90 | 180 | 270;

// ─── Metadata ────────────────────────────────────────────────────────────────

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
  fileSizeBytes: number;
  isEncrypted: boolean;
  pdfVersion?: string;
}

// ─── Operation Inputs ────────────────────────────────────────────────────────

export interface MergeInput {
  buffers: Buffer[];       // ordered list of PDF buffers
  preserveMetadata?: boolean;
}

export interface SplitInput {
  buffer: Buffer;
  ranges: PageRange[];     // each range → one output PDF
}

export interface CompressInput {
  buffer: Buffer;
  level: CompressionLevel;
}

export interface RotateInput {
  buffer: Buffer;
  degrees: RotationDegrees;
  pages?: number[];        // 1-indexed; if omitted → all pages
}

export interface ExtractInput {
  buffer: Buffer;
  pages: number[];         // 1-indexed page numbers
}

export interface DeletePagesInput {
  buffer: Buffer;
  pages: number[];         // 1-indexed pages to delete
}

export interface ReorderInput {
  buffer: Buffer;
  newOrder: number[];      // 1-indexed: [3,1,2] → page 3 first, then 1, then 2
}

// ─── Operation Results ────────────────────────────────────────────────────────

export interface PdfOperationResult {
  buffer: Buffer;
  pageCount: number;
  sizeBytes: number;
}

export interface SplitResult {
  parts: PdfOperationResult[];
}

export interface CompressResult extends PdfOperationResult {
  originalSizeBytes: number;
  compressionRatio: number; // 0–1; e.g., 0.4 means 40% smaller
  level: CompressionLevel;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  pageCount?: number;
  isEncrypted?: boolean;
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  page?: number;    // 1-indexed; default 1
  format?: "webp" | "jpeg" | "png";
}

export interface ThumbnailResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
}

// ─── Worker-ready Job Envelope ───────────────────────────────────────────────
// Stateless shape that can be passed to a worker queue later

export type PdfJobType =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "extract"
  | "delete_pages"
  | "reorder";

export interface PdfJob {
  id: string;
  type: PdfJobType;
  userId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
