export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) throw new Error("Missing env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  if (!apiKey) throw new Error("Missing env.CLOUDINARY_API_KEY");
  if (!apiSecret) throw new Error("Missing env.CLOUDINARY_API_SECRET");

  return { cloudName, apiKey, apiSecret };
}

// Public constants (safe to expose in client)
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

// Upload constraints
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const CHUNK_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB chunks

// Allowed file types
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MIME_TO_EXTENSION: Record<AllowedMimeType, AllowedExtension> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

// Folder structure
export function getUserFolder(userId: string): string {
  return `amigo-pdf/users/${userId}`;
}

export function getUserSignaturesFolder(userId: string): string {
  return `amigo-pdf/users/${userId}/signatures`;
}

export function getUserSignedFolder(userId: string): string {
  return `amigo-pdf/users/${userId}/signed`;
}
