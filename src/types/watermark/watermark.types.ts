export type WatermarkJobStatus = "pending" | "processing" | "completed" | "failed";
export type WatermarkType = "text" | "logo" | "diagonal";

export interface WatermarkJob {
  id: string;
  user_id: string;
  file_id: string;
  status: WatermarkJobStatus;
  progress: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatermarkRegion {
  id: string;
  job_id: string;
  page_number: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  type: WatermarkType;
  confidence: number;
  created_at: string;
}
