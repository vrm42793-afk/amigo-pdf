import { cloudinary } from "./client";
import { getUserFolder } from "./config";

export interface UploadSignatureParams {
  userId: string;
  publicId: string;
  timestamp: number;
}

export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
}

/**
 * Generate a signed upload request on the server.
 * The signature is computed using the API secret which NEVER leaves the server.
 */
export function generateUploadSignature(params: UploadSignatureParams): UploadSignatureResult {
  const folder = getUserFolder(params.userId);
  const timestamp = params.timestamp;

  const paramsToSign = {
    folder,
    public_id: params.publicId,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    folder,
    publicId: params.publicId,
  };
}

/**
 * Generate a short-lived signed URL for private assets.
 * Default expiration is 15 minutes (900 seconds).
 */
export function getSignedUrl(publicId: string, expiresSeconds: number = 900): string {
  return cloudinary.url(publicId, {
    type: "private",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresSeconds,
    secure: true,
  });
}
