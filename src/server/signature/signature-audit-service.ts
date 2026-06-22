import { createClient } from "@/lib/supabase/server";
import { SignatureAuditLog } from "@/types/signature/signature.types";
import { Json } from "@/types/database.types";

export interface CreateAuditLogParams {
  documentId: string;
  action: string;
  pageNumber?: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Json;
}

export class SignatureAuditService {
  /**
   * Insert a new signature audit log entry.
   */
  static async logEvent(params: CreateAuditLogParams): Promise<SignatureAuditLog> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("signature_audit_logs")
      .insert({
        document_id: params.documentId,
        action: params.action,
        page_number: params.pageNumber || null,
        signature_x: params.x || null,
        signature_y: params.y || null,
        signature_width: params.width || null,
        signature_height: params.height || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        metadata: params.metadata || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create audit log: ${error.message}`);
    }

    return data as SignatureAuditLog;
  }

  /**
   * Fetch all audit logs for a signed document.
   */
  static async getLogs(documentId: string): Promise<SignatureAuditLog[]> {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
      .from("signature_audit_logs")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return logs as SignatureAuditLog[];
  }
}
