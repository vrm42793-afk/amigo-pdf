import { DetectedRegion, WatermarkAiService } from "./watermark-ai-service";
import { createWorker } from "tesseract.js";
import sharp from "sharp";

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractResult {
  words: TesseractWord[];
}

export class WatermarkDetectionService {
  /**
   * Run OCR + Gemini to detect watermark boundaries on a page image buffer.
   */
  static async detect(imageBuffer: Buffer, pageNumber: number, customText?: string): Promise<DetectedRegion[]> {
    const regions: DetectedRegion[] = [];

    // 1. OCR-assisted text watermark detection
    try {
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(imageBuffer);
      await worker.terminate();
      
      const result = data as unknown as TesseractResult;
      const words = result?.words || [];

      const keywords = ["confidential", "draft", "copy", "sample", "watermark"];
      if (customText) {
        keywords.push(customText.toLowerCase());
      }

      // Retrieve image dimensions to normalize bounding boxes
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width || 1;
      const imgHeight = metadata.height || 1;

      for (const word of words) {
        const text = word.text.toLowerCase().replace(/[^a-z0-9]/g, "");
        const isMatch = keywords.some(k => text.includes(k) || k.includes(text));
        
        if (isMatch && word.confidence > 50) {
          regions.push({
            x_min: word.bbox.x0 / imgWidth,
            y_min: word.bbox.y0 / imgHeight,
            x_max: word.bbox.x1 / imgWidth,
            y_max: word.bbox.y1 / imgHeight,
            type: "text",
            confidence: word.confidence / 100
          });
        }
      }
    } catch (e) {
      console.error(`Tesseract OCR detection failed on page ${pageNumber}, falling back entirely to Gemini`, e);
    }

    // 2. Call Gemini AI detection for logos, diagonals, and transparent overlays
    try {
      const aiRegions = await WatermarkAiService.detectWatermarks(imageBuffer);
      
      // Merge unique regions (avoiding duplicates if Tesseract and Gemini both found the same text box)
      for (const aiR of aiRegions) {
        const isDuplicate = regions.some(r => {
          const overlapX = Math.max(r.x_min, aiR.x_min) < Math.min(r.x_max, aiR.x_max);
          const overlapY = Math.max(r.y_min, aiR.y_min) < Math.min(r.y_max, aiR.y_max);
          return overlapX && overlapY;
        });

        if (!isDuplicate) {
          regions.push(aiR);
        }
      }
    } catch (e) {
      console.error(`Gemini AI detection failed on page ${pageNumber}:`, e);
    }

    return regions;
  }
}
