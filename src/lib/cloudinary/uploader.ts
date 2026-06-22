import { cloudinary } from "./client";
import { getUserFolder, CHUNK_SIZE_BYTES } from "./config";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export interface UploadFileParams {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
  publicId: string;
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
}

function toUploadResult(res: UploadApiResponse): UploadResult {
  return {
    publicId: res.public_id,
    secureUrl: res.secure_url,
    bytes: res.bytes,
    format: res.format,
    resourceType: res.resource_type,
    width: res.width,
    height: res.height,
  };
}

/**
 * Upload a file buffer to Cloudinary using a writable stream.
 * Automatically uses chunked upload for files >= CHUNK_SIZE_BYTES.
 */
export async function uploadFileToCloudinary(params: UploadFileParams): Promise<UploadResult> {
  const folder = getUserFolder(params.userId);
  const isLargeFile = params.fileBuffer.length >= CHUNK_SIZE_BYTES;

  return new Promise<UploadResult>((resolve, reject) => {
    const uploadOptions = {
      public_id: params.publicId,
      folder,
      resource_type: "raw" as const,
      chunk_size: isLargeFile ? CHUNK_SIZE_BYTES : undefined,
      use_filename: false,
      unique_filename: false,
      overwrite: true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }
        if (!result) {
          reject(new Error("No result returned from Cloudinary"));
          return;
        }
        resolve(toUploadResult(result));
      }
    );

    uploadStream.end(params.fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID.
 */
export async function deleteFileFromCloudinary(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary delete failed: ${result.result}`);
  }
}

/**
 * Rename (move) a file in Cloudinary by changing its public ID.
 */
export async function renameFileInCloudinary(
  fromPublicId: string,
  toPublicId: string
): Promise<UploadResult> {
  const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
    resource_type: "raw",
    overwrite: false,
  });
  return toUploadResult(result as UploadApiResponse);
}

export interface UploadPrivateFileParams {
  fileBuffer: Buffer;
  folder: string;
  publicId: string;
  resourceType: "raw" | "image";
}

/**
 * Upload a file buffer to Cloudinary as a private secure asset.
 */
export async function uploadPrivateFile(params: UploadPrivateFileParams): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve, reject) => {
    const uploadOptions = {
      public_id: params.publicId,
      folder: params.folder,
      resource_type: params.resourceType,
      type: "private" as const,
      overwrite: true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }
        if (!result) {
          reject(new Error("No result returned from Cloudinary"));
          return;
        }
        resolve(toUploadResult(result));
      }
    );

    uploadStream.end(params.fileBuffer);
  });
}
