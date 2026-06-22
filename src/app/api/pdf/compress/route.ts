import { NextRequest, NextResponse } from "next/server";
import { requireAuth, pdfDownloadResponse } from "../_utils";
import { compressPdfAction } from "@/actions/pdf/compress-pdf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const formData = await request.formData();
  const result = await compressPdfAction(formData);
  if (result.error || !result.buffer) {
    return NextResponse.json({ error: result.error ?? "Compress failed" }, { status: 400 });
  }
  return pdfDownloadResponse(result.buffer, "compressed.pdf");
}
