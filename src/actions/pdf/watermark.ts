"use server";

import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { withActionError } from "@/lib/action-utils";

export interface WatermarkResult {
  buffer?: string;
  error?: string;
}

export async function addWatermarkAction(formData: FormData): Promise<WatermarkResult> {
  return withActionError(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const file = formData.get("file") as File;
    const watermarkText = formData.get("text") as string;
    
    if (!file || !watermarkText) {
      return { error: "File and watermark text are required" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 60;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      
      // Draw text diagonally in the center
      page.drawText(watermarkText, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: fontSize,
        font: font,
        color: rgb(0.7, 0.7, 0.7), // Light gray
        opacity: 0.3,
        rotate: degrees(45),
      });
    }

    const savedBytes = await pdfDoc.save();
    return { buffer: Buffer.from(savedBytes).toString("base64") };
  });
}
