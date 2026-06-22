import { Json } from "@/types/database.types";

export type StampType = "signature" | "initials" | "date" | "text";

export interface SignatureTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  public_id: string;
  width: number | null;
  height: number | null;
  last_used_at: string | null;
  created_at: string;
}

export interface PlacedStamp {
  id: string;
  type: StampType;
  pageNumber: number;
  // Screen coordinates (CSS pixels, relative to rendered page viewport)
  x: number;
  y: number;
  width: number;
  height: number;
  // Value: base64/URL for signature/initials, date string for date, text content for text
  value: string;
}

export interface SignatureAuditLog {
  id: string;
  document_id: string;
  action: string;
  page_number: number | null;
  signature_x: number | null;
  signature_y: number | null;
  signature_width: number | null;
  signature_height: number | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
}

export interface SignedDocument {
  id: string;
  user_id: string;
  file_id: string;
  signed_url: string;
  document_hash: string;
  page_count: number;
  signature_count: number;
  created_at: string;
}
