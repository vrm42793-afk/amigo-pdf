"use server";

import { createClient } from "@/lib/supabase/server";
import { cloudinary } from "@/lib/cloudinary/client";
import { getCloudinaryConfig, getUserFolder } from "@/lib/cloudinary/config";
import { randomUUID } from "crypto";

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  publicId: string;
  folder: string;
  apiKey: string;
  cloudName: string;
  error?: string;
}

export async function getUploadSignature(fileName: string): Promise<SignatureResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" } as SignatureResponse;
  }

  const config = getCloudinaryConfig();
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = getUserFolder(user.id);
  const publicId = `${randomUUID()}-${fileName.replace(/\s+/g, "_")}`;

  const paramsToSign = {
    timestamp,
    folder,
    public_id: publicId,
    // Cloudinary defaults resource_type to image on client uploads if not specified in the client request
    // However, the client will pass resource_type="raw" in the FormData, which we don't strictly sign unless required.
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.apiSecret);

  return {
    signature,
    timestamp,
    publicId,
    folder,
    apiKey: config.apiKey,
    cloudName: config.cloudName,
  };
}
