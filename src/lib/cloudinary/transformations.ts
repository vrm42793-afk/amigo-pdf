import { CLOUDINARY_CLOUD_NAME } from "./config";

/**
 * Build a Cloudinary delivery URL for a raw file (PDF, Office, etc.).
 */
export function buildRawUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`;
}

/**
 * Build a Cloudinary image thumbnail URL with automatic format and quality.
 */
export function buildThumbnailUrl(
  publicId: string,
  opts: { width?: number; height?: number } = {}
): string {
  const { width = 200, height = 200 } = opts;
  return (
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` +
    `c_fill,w_${width},h_${height},f_auto,q_auto/${publicId}`
  );
}

/**
 * Build an optimized Cloudinary image URL for display.
 */
export function buildOptimizedImageUrl(publicId: string, width = 800): string {
  return (
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` +
    `w_${width},f_auto,q_auto/${publicId}`
  );
}
