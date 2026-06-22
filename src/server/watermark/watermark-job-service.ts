import { createClient } from "@/lib/supabase/server";
import { WatermarkReconstructionService } from "./reconstruction-service";
import { uploadPrivateFile } from "@/lib/cloudinary/uploader";
import { insertFile, getFileById } from "@/server/files/file-repository";
import { WatermarkJob } from "@/types/watermark/watermark.types";
import crypto from "crypto";

export class WatermarkJobService {
  /**
   * Create a new watermark job in the database.
   */
  static async createJob(userId: string, fileId: string): Promise<string> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("watermark_jobs")
      .insert({
        user_id: userId,
        file_id: fileId,
        status: "pending",
        progress: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Failed to create watermark job: " + error?.message);
    }
    return data.id;
  }

  /**
   * Fetch a job's status.
   */
  static async getJobStatus(jobId: string, userId: string): Promise<WatermarkJob> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("watermark_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new Error("Watermark job not found");
    }
    return data as WatermarkJob;
  }

  /**
   * Run the watermark removal process asynchronously in the background.
   */
  static async startJob(jobId: string, userId: string, customText?: string): Promise<void> {
    const supabase = await createClient();

    // Trigger non-blocking async execution loop in the background
    Promise.resolve().then(async () => {
      try {
        // 1. Update job status to processing
        await supabase
          .from("watermark_jobs")
          .update({ status: "processing", progress: 5 })
          .eq("id", jobId);

        // 2. Fetch job details
        const { data: job } = await supabase
          .from("watermark_jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (!job) throw new Error("Job details not found");

        const file = await getFileById(job.file_id, userId);
        if (!file) throw new Error("Target file not found or deleted");

        // 3. Download the original PDF file buffer
        const response = await fetch(file.cloudinary_secure_url);
        if (!response.ok) throw new Error("Failed to download PDF source from Cloudinary");
        const pdfArrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        // 4. Run watermark removal pipeline
        const { cleanPdfBytes, detectedRegions } = await WatermarkReconstructionService.removeWatermarks(
          pdfBuffer,
          customText,
          async (progress) => {
            // Update progress in database (scale from 10% to 90%)
            const mappedProgress = Math.round(10 + progress * 0.8);
            await supabase
              .from("watermark_jobs")
              .update({ progress: mappedProgress })
              .eq("id", jobId);
          }
        );

        // 5. Upload the clean PDF to Cloudinary private folder
        const cleanFileId = crypto.randomUUID();
        const cleanPublicId = `${cleanFileId}`;
        const folder = `amigo-pdf/users/${userId}/cleaned`;

        const uploadRes = await uploadPrivateFile({
          fileBuffer: Buffer.from(cleanPdfBytes),
          folder,
          publicId: cleanPublicId,
          resourceType: "raw",
        });

        // 6. Create a new file entry in the user's dashboard files list
        const cleanFileName = `[Cleaned] ${file.name}`;
        await insertFile({
          user_id: userId,
          name: cleanFileName,
          size: cleanPdfBytes.length,
          type: "application/pdf",
          cloudinary_public_id: uploadRes.publicId,
          cloudinary_secure_url: uploadRes.secureUrl,
        });

        // 7. Save detected regions for user feedback / transparency logs
        if (detectedRegions.length > 0) {
          const regionsToInsert = detectedRegions.map((r) => ({
            job_id: jobId,
            page_number: r.page_number || 1,
            x_min: r.x_min,
            y_min: r.y_min,
            x_max: r.x_max,
            y_max: r.y_max,
            type: r.type,
            confidence: r.confidence,
          }));

          await supabase.from("watermark_regions").insert(regionsToInsert);
        }

        // 8. Update job to completed
        await supabase
          .from("watermark_jobs")
          .update({ status: "completed", progress: 100 })
          .eq("id", jobId);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Watermark background job processing failed:", err);
        await supabase
          .from("watermark_jobs")
          .update({
            status: "failed",
            error_message: errorMsg,
          })
          .eq("id", jobId);
      }
    });
  }
}
