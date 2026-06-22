"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { WatermarkJobService } from "@/server/watermark/watermark-job-service";

const startWatermarkRemovalSchema = z.object({
  fileId: z.string().uuid(),
  customText: z.string().max(100).optional(),
});

const getWatermarkJobStatusSchema = z.object({
  jobId: z.string().uuid(),
});

export async function startWatermarkRemovalAction(formData: {
  fileId: string;
  customText?: string;
}) {
  try {
    const validated = startWatermarkRemovalSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    // 1. Create job entry in watermark_jobs table
    const jobId = await WatermarkJobService.createJob(user.id, validated.fileId);

    // 2. Start execution in background asynchronously
    await WatermarkJobService.startJob(jobId, user.id, validated.customText);

    return { success: true, data: { jobId } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to initiate watermark removal",
    };
  }
}

export async function getWatermarkJobStatusAction(jobId: string) {
  try {
    const validated = getWatermarkJobStatusSchema.parse({ jobId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    // Query job details from service
    const job = await WatermarkJobService.getJobStatus(validated.jobId, user.id);

    return { success: true, data: job };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to query watermark job status",
    };
  }
}
