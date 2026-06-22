import sharp from "sharp";
import { DetectedRegion } from "./watermark-ai-service";

export class WatermarkInpaintingService {
  /**
   * Inpaint detected watermark regions on an image buffer using Sharp compositing.
   */
  static async inpaint(imageBuffer: Buffer, regions: DetectedRegion[]): Promise<Buffer> {
    if (regions.length === 0) return imageBuffer;

    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1;
    const height = metadata.height || 1;

    let processedImage = sharp(imageBuffer);
    const composites: { input: Buffer; left: number; top: number }[] = [];

    for (const region of regions) {
      const x = Math.round(region.x_min * width);
      const y = Math.round(region.y_min * height);
      const w = Math.round((region.x_max - region.x_min) * width);
      const h = Math.round((region.y_max - region.y_min) * height);

      // Clamp dimensions and ensure validity
      if (w <= 0 || h <= 0 || x < 0 || y < 0 || x + w > width || y + h > height) {
        continue;
      }

      // Sample a local neighborhood background patch (e.g. 15px border margin)
      const margin = 15;
      const sampleX = Math.max(0, x - margin);
      const sampleY = Math.max(0, y - margin);
      const sampleW = Math.min(width - sampleX, w + margin * 2);
      const sampleH = Math.min(height - sampleY, h + margin * 2);

      try {
        // Local background patch reconstruction:
        // Crop sample area -> resize to 1x1 to average pixels -> resize to block width/height
        const patchBuffer = await sharp(imageBuffer)
          .extract({ left: sampleX, top: sampleY, width: sampleW, height: sampleH })
          .resize(1, 1)
          .resize(w, h, { fit: "fill" })
          .toBuffer();

        composites.push({
          input: patchBuffer,
          left: x,
          top: y
        });
      } catch (err) {
        console.error("Failed to generate inpainting patch for region:", region, err);
      }
    }

    if (composites.length > 0) {
      processedImage = processedImage.composite(composites);
    }

    return processedImage.toBuffer();
  }
}
