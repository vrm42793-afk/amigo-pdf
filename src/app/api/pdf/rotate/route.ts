import { NextRequest, NextResponse } from "next/server";
import { requireAuth, pdfDownloadResponse } from "../_utils";
import { rotatePdfAction } from "@/actions/pdf/rotate-pdf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const formData = await request.formData();
  const result = await rotatePdfAction(formData);
  if (result.error || !result.buffer) {
    return NextResponse.json({ error: result.error ?? "Rotate failed" }, { status: 400 });
  }
  return pdfDownloadResponse(result.buffer, "rotated.pdf");
}
