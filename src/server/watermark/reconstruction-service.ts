import { createCanvas } from "canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import { WatermarkDetectionService } from "./detection-service";
import { WatermarkInpaintingService } from "./inpainting-service";
import { DetectedRegion } from "./watermark-ai-service";

// Ensure worker is disabled or set for server environment
if (typeof window === "undefined") {
  // pdfjsLib does not require external worker source when running on Node with disableWorker: true
}

export class WatermarkReconstructionService {
  /**
   * Process a PDF buffer page-by-page: render, detect watermarks, inpaint, and rebuild.
   */
  static async removeWatermarks(
    pdfBuffer: Buffer,
    customText?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ cleanPdfBytes: Uint8Array; detectedRegions: DetectedRegion[] }> {
    // 1. Load PDF using pdfjs-dist with Node-compat configurations
    const options = {
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableWorker: true,
    };
    const loadingTask = pdfjsLib.getDocument(options as unknown as Parameters<typeof pdfjsLib.getDocument>[0]);
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    const outputPdfDoc = await PDFDocument.create();
    const allDetectedRegions: DetectedRegion[] = [];

    // 2. Loop through each page
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i);
      const originalViewport = page.getViewport({ scale: 1.0 });

      // Render at 2.0x scale for crisp print quality
      const renderViewport = page.getViewport({ scale: 2.0 });

      // Setup node-canvas structure
      const canvas = createCanvas(renderViewport.width, renderViewport.height);
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport: renderViewport,
      }).promise;

      const pagePngBuffer = canvas.toBuffer("image/png");

      // 3. Detect watermark regions
      const regions = await WatermarkDetectionService.detect(pagePngBuffer, i, customText);
      const regionsWithPage = regions.map(r => ({ ...r, page_number: i }));
      allDetectedRegions.push(...regionsWithPage);

      // 4. Inpaint image
      const cleanPngBuffer = await WatermarkInpaintingService.inpaint(pagePngBuffer, regions);

      // 5. Embed clean image into new PDF document page
      const embeddedImg = await outputPdfDoc.embedPng(cleanPngBuffer);
      const newPage = outputPdfDoc.addPage([originalViewport.width, originalViewport.height]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });

      if (onProgress) {
        const percent = Math.round((i / pageCount) * 100);
        onProgress(percent);
      }
    }

    const cleanPdfBytes = await outputPdfDoc.save();
    return {
      cleanPdfBytes,
      detectedRegions: allDetectedRegions,
    };
  }
}
