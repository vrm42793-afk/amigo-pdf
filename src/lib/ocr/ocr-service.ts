import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export interface CreateOcrJobInput {
  userId: string;
  fileId?: string;
}

export async function createOcrJob(input: CreateOcrJobInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ocr_jobs")
    .insert({
      user_id: input.userId,
      file_id: input.fileId ?? null,
      status: "pending",
      progress: 0,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create OCR job: " + error?.message);
  return data.id;
}

export async function updateOcrJobProgress(jobId: string, progress: number): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("ocr_jobs")
    .update({ status: "processing", progress })
    .eq("id", jobId);
}

export async function completeOcrJob(jobId: string, result: Json | null): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("ocr_jobs")
    .update({ status: "completed", progress: 100, result })
    .eq("id", jobId);
}

export async function failOcrJob(jobId: string, errorMessage: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("ocr_jobs")
    .update({ status: "failed", result: { error: errorMessage } })
    .eq("id", jobId);
}
