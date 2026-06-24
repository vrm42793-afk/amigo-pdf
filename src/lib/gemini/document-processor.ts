import "@/lib/pdfjs-polyfill";
import { createClient } from "@/lib/supabase/server";
import { chunkDocument } from "./chunking";
import { getEmbeddingsBatch } from "./embeddings";
const pdfParse = require("pdf-parse");
import { cloudinary } from "@/lib/cloudinary/client";

export class DocumentProcessor {
  /**
   * Fetch PDF from Cloudinary URL and extract digital text using pdf-parse.
   */
  static async extractTextFromPdfUrl(url: string): Promise<{ pageNumber: number; text: string }[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file from URL. Status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      const pdfData = await pdfParse(buffer);
      // Since pdf-parse returns all text combined, we treat it as one "page" for chunking
      return [{ pageNumber: 1, text: pdfData.text }];
    } catch (err) {
      console.error("Error parsing PDF with pdf-parse:", err);
      return [];
    }
  }

  /**
   * Run the full pipeline for a file:
   * check cache -> download -> extract -> chunk -> embed -> save to database.
   */
  static async ensureDocumentProcessed(fileId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    // 1. Check if chunks already exist in database
    const { count, error: countError } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("file_id", fileId);

    if (!countError && count !== null && count > 0) {
      // Document is already chunked and stored, skip
      return;
    }

    // 2. Fetch file URL from database
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("cloudinary_secure_url, cloudinary_public_id, name, type, ocr_text")
      .eq("id", fileId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fileError || !file) {
      throw new Error("File not found or access denied.");
    }

    let pages: { pageNumber: number; text: string }[] = [];

    let fetchUrl = file.cloudinary_secure_url;

    // If it's an old Cloudinary file, generate a signed URL to bypass 401 Strict Delivery
    if (file.cloudinary_public_id && file.cloudinary_secure_url?.includes("res.cloudinary.com")) {
      const isImage = file.cloudinary_secure_url.includes("/image/upload/");
      fetchUrl = cloudinary.url(file.cloudinary_public_id, {
        resource_type: isImage ? "image" : "raw",
        type: "upload",
        sign_url: true,
        secure: true
      });
    }

    // 3. Perform text extraction
    if (file.type === "application/pdf") {
      pages = await this.extractTextFromPdfUrl(fetchUrl);
    } else {
      // Fallback for non-PDF files (images / text files / Word documents, etc.)
      // We can use the file name and ocr_text if available
      const ocrText = file.ocr_text || "";
      pages = [{ pageNumber: 1, text: ocrText }];
    }

    // 4. Clean text pages
    const cleanedPages = pages
      .map(p => ({
        pageNumber: p.pageNumber,
        text: p.text.replace(/\s+/g, " ").trim()
      }))
      .filter(p => p.text.length > 0);

    if (cleanedPages.length === 0) {
      // Fallback if digital text is empty (scanned PDF): check if ocr_text exists
      if (file.ocr_text) {
        cleanedPages.push({
          pageNumber: 1,
          text: file.ocr_text
        });
      } else {
        throw new Error(
          "No selectable text found in the PDF. Please run OCR on this document first to extract text."
        );
      }
    }

    // 5. Chunk the content
    const chunks = chunkDocument(cleanedPages);

    // 6. Generate embeddings in batch
    const chunkContents = chunks.map(c => c.content);
    let embeddings: number[][] = [];
    try {
      embeddings = await getEmbeddingsBatch(chunkContents);
    } catch (e) {
      console.error("Batch embedding generation failed:", e);
      // Fallback: create empty embeddings
      embeddings = chunks.map(() => []);
    }

    // 7. Save chunks and embeddings to the database
    const chunksToInsert = chunks.map((c, idx) => ({
      file_id: fileId,
      user_id: userId,
      chunk_index: c.chunk_index,
      content: c.content,
      token_count: c.token_count,
      embedding: embeddings[idx] || null,
      section_title: c.section_title,
      page_number: c.page_number
    }));

    const { error: insertError } = await supabase.from("document_chunks").insert(chunksToInsert);
    if (insertError) {
      throw new Error(`Failed to save chunks to database: ${insertError.message}`);
    }
  }
}
