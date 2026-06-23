import { uploadFileToCloudinary, deleteFileFromCloudinary, renameFileInCloudinary } from "@/lib/cloudinary/uploader";
import { getUserFolder, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, type AllowedMimeType } from "@/lib/cloudinary/config";
import { createClient } from "@/lib/supabase/server";
import {
  insertFile,
  getFileById,
  updateFile,
  softDeleteFile,
  listFiles,
  incrementUserStorageUsed,
  decrementUserStorageUsed,
} from "./file-repository";
import type { FileRow, PaginatedFiles, FileListParams } from "@/types/files.types";
import { randomUUID } from "crypto";
import path from "path";

export interface UploadFileInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
  userId: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file against MIME type, extension, and size constraints.
 */
export function validateFile(input: Pick<UploadFileInput, "fileName" | "mimeType" | "fileSize">): ValidationResult {
  const { fileName, mimeType, fileSize } = input;

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds the maximum size of 100MB` };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return { valid: false, error: `File type "${mimeType}" is not supported` };
  }

  const ext = path.extname(fileName).toLowerCase().replace(".", "");
  const allowedExts = ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg"];
  if (!allowedExts.includes(ext)) {
    return { valid: false, error: `File extension ".${ext}" is not supported` };
  }

  return { valid: true };
}

/**
 * Upload a file: validate → upload to Cloudinary → persist metadata to Supabase.
 */
export async function uploadFileService(input: UploadFileInput): Promise<FileRow> {
  const { fileBuffer, fileName, mimeType, fileSize, userId } = input;

  const validation = validateFile({ fileName, mimeType, fileSize });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const publicId = `${getUserFolder(userId)}/${randomUUID()}-${fileName.replace(/\s+/g, "_")}`;

  const cloudinaryResult = await uploadFileToCloudinary({
    fileBuffer,
    fileName,
    mimeType,
    userId,
    publicId,
  });

  const fileRecord = await insertFile({
    user_id: userId,
    name: fileName,
    size: fileSize,
    type: mimeType,
    cloudinary_public_id: cloudinaryResult.publicId,
    cloudinary_secure_url: cloudinaryResult.secureUrl,
    ocr_status: "pending",
    is_deleted: false,
  });

  // Update storage quota asynchronously (best-effort)
  await incrementUserStorageUsed(userId, fileSize).catch(console.error);

  return fileRecord;
}

/**
 * Delete a file: verify ownership → delete from Cloudinary → soft-delete in DB.
 */
export async function deleteFileService(fileId: string, userId: string): Promise<void> {
  const file = await getFileById(fileId, userId);
  if (!file) throw new Error("File not found or access denied");

  if (file.cloudinary_secure_url?.includes("supabase.co")) {
    const supabase = await createClient();
    await supabase.storage.from("user_files").remove([file.cloudinary_public_id]);
  } else {
    await deleteFileFromCloudinary(file.cloudinary_public_id).catch(() => {});
  }

  await softDeleteFile(fileId, userId);
  await decrementUserStorageUsed(userId, file.size).catch(console.error);
}

/**
 * Rename a file: verify ownership → rename on Cloudinary → update DB.
 */
export async function renameFileService(
  fileId: string,
  userId: string,
  newName: string
): Promise<FileRow> {
  if (!newName.trim()) throw new Error("File name cannot be empty");

  const file = await getFileById(fileId, userId);
  if (!file) throw new Error("File not found or access denied");

  if (file.cloudinary_secure_url?.includes("supabase.co")) {
    // If it's a supabase path, we don't necessarily need to rename the physical file since the name is stored in DB
    // But if we want to be safe, we can just update the DB name. The path is a UUID anyway in our new upload logic.
    return updateFile(fileId, userId, {
      name: newName,
    });
  }

  // Fallback for cloudinary
  const ext = path.extname(file.cloudinary_public_id);
  const folder = getUserFolder(userId);
  const newPublicId = `${folder}/${randomUUID()}-${newName.replace(/\s+/g, "_")}${ext}`;

  const renamed = await renameFileInCloudinary(file.cloudinary_public_id, newPublicId);

  return updateFile(fileId, userId, {
    name: newName,
    cloudinary_public_id: renamed.publicId,
    cloudinary_secure_url: renamed.secureUrl,
  });
}

/**
 * Get a single file by ID with ownership validation.
 */
export async function getFileService(fileId: string, userId: string): Promise<FileRow> {
  const file = await getFileById(fileId, userId);
  if (!file) throw new Error("File not found or access denied");
  return file;
}

/**
 * List files for a user with pagination and optional search.
 */
export async function listFilesService(params: FileListParams): Promise<PaginatedFiles> {
  return listFiles(params);
}
