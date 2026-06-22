import sharp from "sharp";
import type { ThumbnailOptions, ThumbnailResult } from "@/types/pdf/pdf.types";

/**
 * Generate a thumbnail image from a raw PNG buffer (e.g. from a PDF page rendered
 * externally or via a canvas in the browser). Sharp handles resizing and format conversion.
 *
 * For server-side PDF → image rendering, a headless canvas or Ghostscript is required
 * (not bundled here to keep the server bundle lean). This function accepts a pre-rendered
 * PNG and converts it to the requested output format/size.
 */
export async function generateThumbnailFromPng(
  pngBuffer: Buffer,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
  const { width = 400, height = 565, format = "webp" } = options;

  const pipeline = sharp(pngBuffer).resize(width, height, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });

  let outputBuffer: Buffer;
  if (format === "jpeg") {
    outputBuffer = await pipeline.jpeg({ quality: 85 }).toBuffer();
  } else if (format === "png") {
    outputBuffer = await pipeline.png({ compressionLevel: 8 }).toBuffer();
  } else {
    outputBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
  }

  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    format,
    width: metadata.width ?? width,
    height: metadata.height ?? height,
  };
}

/**
 * Resize an existing image buffer (jpg/png/webp) to thumbnail size.
 */
export async function resizeImage(
  imageBuffer: Buffer,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
  const { width = 200, height = 200, format = "webp" } = options;

  const pipeline = sharp(imageBuffer).resize(width, height, {
    fit: "cover",
    position: "centre",
  });

  let outputBuffer: Buffer;
  if (format === "jpeg") {
    outputBuffer = await pipeline.jpeg({ quality: 80 }).toBuffer();
  } else if (format === "png") {
    outputBuffer = await pipeline.png().toBuffer();
  } else {
    outputBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
  }

  const meta = await sharp(outputBuffer).metadata();
  return {
    buffer: outputBuffer,
    format,
    width: meta.width ?? width,
    height: meta.height ?? height,
  };
}
