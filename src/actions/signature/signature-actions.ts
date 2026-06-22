"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";
import { uploadPrivateFile } from "@/lib/cloudinary/uploader";
import { getUserSignaturesFolder } from "@/lib/cloudinary/config";
import { SignatureTemplateService } from "@/server/signature/signature-template-service";
import { SignedDocumentService } from "@/server/signature/signed-document-service";
import { PlacedStamp } from "@/types/signature/signature.types";

const saveSignatureSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  base64Data: z.string().startsWith("data:image/png;base64,", "Signature must be a PNG image"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const deleteSignatureSchema = z.object({
  templateId: z.string().uuid(),
});

const stampSchema = z.object({
  id: z.string(),
  type: z.enum(["signature", "initials", "date", "text"]),
  pageNumber: z.number().int().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  value: z.string(),
});

const signDocumentSchema = z.object({
  fileId: z.string().uuid(),
  stamps: z.array(stampSchema),
});

export async function saveSignatureAction(formData: {
  name: string;
  base64Data: string;
  width?: number;
  height?: number;
}) {
  try {
    const validated = saveSignatureSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    // 1. Upload base64 PNG data to Cloudinary private folder
    const folder = getUserSignaturesFolder(user.id);
    const assetId = crypto.randomUUID();
    const base64Content = validated.base64Data.replace(/^data:image\/png;base64,/, "");
    const fileBuffer = Buffer.from(base64Content, "base64");

    const uploadRes = await uploadPrivateFile({
      fileBuffer,
      folder,
      publicId: assetId,
      resourceType: "image", // signature images are images
    });

    // 2. Save template details to database
    const template = await SignatureTemplateService.createTemplate(
      user.id,
      validated.name,
      uploadRes.secureUrl,
      uploadRes.publicId,
      validated.width || uploadRes.width,
      validated.height || uploadRes.height
    );

    return { success: true, data: template };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save signature template" };
  }
}

export async function getSignatureTemplatesAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const templates = await SignatureTemplateService.getTemplates(user.id);
    return { success: true, data: templates };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch signature templates" };
  }
}

export async function deleteSignatureTemplateAction(templateId: string) {
  try {
    const validated = deleteSignatureSchema.parse({ templateId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    await SignatureTemplateService.deleteTemplate(user.id, validated.templateId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete signature template" };
  }
}

export async function signDocumentAction(formData: {
  fileId: string;
  stamps: PlacedStamp[];
}) {
  try {
    const validated = signDocumentSchema.parse(formData);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    // Capture IP Address & User Agent headers for auditing
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    
    // Attempt to extract client IP behind Vercel / proxy
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    const signedDoc = await SignedDocumentService.signDocument({
      userId: user.id,
      fileId: validated.fileId,
      stamps: validated.stamps as PlacedStamp[],
      ipAddress,
      userAgent,
    });

    return { success: true, data: signedDoc };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to sign document" };
  }
}
