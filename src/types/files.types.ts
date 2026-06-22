import type { Database } from "./database.types";

export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type FileInsert = Database["public"]["Tables"]["files"]["Insert"];
export type FileUpdate = Database["public"]["Tables"]["files"]["Update"];

export interface PaginatedFiles {
  files: FileRow[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface FileListParams {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "created_at" | "name" | "size";
  sortOrder?: "asc" | "desc";
}

export interface UploadProgressEvent {
  fileId: string;
  fileName: string;
  progress: number; // 0–100
  status: "pending" | "uploading" | "complete" | "error";
  errorMessage?: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  errorMessage?: string;
  result?: FileRow;
}
