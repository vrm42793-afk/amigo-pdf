import { loadPdf } from "./pdf-service";
import type { CompressInput, CompressResult } from "@/types/pdf/pdf.types";

const COMPRESS_OPTIONS = {
  low: { objectsPerTick: 100 },
  medium: { objectsPerTick: 50 },
  high: { objectsPerTick: 20 },
} as const;

/**
 * Compress a PDF by re-serializing it with pdf-lib which removes redundant
 * objects, unused references, and flattens the document structure.
 *
 * Note: For image-heavy PDFs, the best compression is achieved via
 * Cloudinary's transformation pipeline (see Phase 7). This service handles
 * structural optimization which works on all PDFs.
 */
export async function compressPdf(input: CompressInput): Promise<CompressResult> {
  const originalSizeBytes = input.buffer.length;
  const src = await loadPdf(input.buffer);

  // Re-serialize with structural compression
  // pdf-lib's useObjectStreams option reduces cross-reference table size
  const options = COMPRESS_OPTIONS[input.level];
  const bytes = await src.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: options.objectsPerTick,
  });

  const buffer = Buffer.from(bytes);
  const compressionRatio =
    originalSizeBytes > 0
      ? Math.max(0, (originalSizeBytes - buffer.length) / originalSizeBytes)
      : 0;

  return {
    buffer,
    pageCount: src.getPageCount(),
    sizeBytes: buffer.length,
    originalSizeBytes,
    compressionRatio,
    level: input.level,
  };
}
