"use server";

import { createClient } from "@/lib/supabase/server";
import { PDFDocument } from "pdf-lib";
import { withActionError } from "@/lib/action-utils";

export interface ConvertResult {
  buffer?: string; // base64 representation
  error?: string;
  isImage?: boolean; // true if returning image
}

export async function convertPdfToImagesAction(formData: FormData): Promise<ConvertResult[] | { error: string }> {
  return withActionError(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [{ error: "Unauthorized" }];

    const file = formData.get("file") as File;
    if (!file) return [{ error: "File required" }];

    // Because pdf2pic is complex to setup on Vercel without ghostscript, 
    // we use a simpler approach: extracting pages into individual PDFs as a fallback 
    // OR we can implement true PDF to Image using pdf.js, but that's client-side mostly.
    // For now, let's implement the backend extraction using pdf-lib as a simplified 'converter'.
    // If the user uploads an image, we convert it to PDF.
    
    // NOTE: True PDF to Image is highly dependent on environment (Ghostscript/Canvas).
    // As a demonstration for the converter tool, we'll implement Image -> PDF here 
    // since it's 100% reliable in Node via pdf-lib.

    return [{ error: "PDF to Image conversion requires client-side processing or external API." }];
  });
}

export async function convertImagesToPdfAction(formData: FormData): Promise<ConvertResult | { error: string }> {
  return withActionError(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) return { error: "Images required" };

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return { error: `File ${file.name} is not an image` };
      }

      const imageBytes = await file.arrayBuffer();
      let image;
      
      try {
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          return { error: `Unsupported image format: ${file.type}` };
        }
        
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch (e) {
        return { error: `Failed to embed image ${file.name}` };
      }
    }

    const savedBytes = await pdfDoc.save();
    return { buffer: Buffer.from(savedBytes).toString("base64") };
  });
}
