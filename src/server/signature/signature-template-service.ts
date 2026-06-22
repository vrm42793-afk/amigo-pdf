import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/cloudinary/signer";
import { cloudinary } from "@/lib/cloudinary/client";
import { SignatureTemplate } from "@/types/signature/signature.types";

export class SignatureTemplateService {
  /**
   * Create a new signature template.
   */
  static async createTemplate(
    userId: string,
    name: string,
    imageUrl: string,
    publicId: string,
    width?: number | null,
    height?: number | null
  ): Promise<SignatureTemplate> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("signature_templates")
      .insert({
        user_id: userId,
        name,
        image_url: imageUrl,
        public_id: publicId,
        width: width || null,
        height: height || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create signature template: ${error.message}`);
    }

    return data as SignatureTemplate;
  }

  /**
   * Get all templates for a user, resolving image_urls into secure signed URLs.
   */
  static async getTemplates(userId: string): Promise<SignatureTemplate[]> {
    const supabase = await createClient();
    
    const { data: templates, error } = await supabase
      .from("signature_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch signature templates: ${error.message}`);
    }

    if (!templates) return [];

    // Map image_url to a secure signed URL with 15 minutes expiration
    return templates.map((t) => ({
      ...(t as SignatureTemplate),
      image_url: getSignedUrl(t.public_id, 900),
    }));
  }

  /**
   * Delete a signature template from the database and Cloudinary.
   */
  static async deleteTemplate(userId: string, templateId: string): Promise<void> {
    const supabase = await createClient();

    // 1. Get template to find public_id
    const { data: template, error: fetchError } = await supabase
      .from("signature_templates")
      .select("public_id")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !template) {
      throw new Error("Signature template not found or unauthorized");
    }

    // 2. Delete from database
    const { error: deleteError } = await supabase
      .from("signature_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error(`Failed to delete signature template from database: ${deleteError.message}`);
    }

    // 3. Delete asset from Cloudinary (using private type)
    try {
      await cloudinary.uploader.destroy(template.public_id, { type: "private" });
    } catch (e) {
      console.error("Failed to delete signature template from Cloudinary:", e);
      // Don't fail the operation if Cloudinary delete fails (e.g. template already deleted)
    }
  }

  /**
   * Update the last used timestamp of a template.
   */
  static async updateLastUsed(templateId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("signature_templates")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", templateId);
  }
}
