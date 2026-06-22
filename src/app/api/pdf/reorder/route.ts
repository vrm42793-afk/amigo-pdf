import { NextRequest, NextResponse } from "next/server";
import { requireAuth, pdfDownloadResponse } from "../_utils";
import { reorderPagesAction } from "@/actions/pdf/reorder-pages";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const formData = await request.formData();
  const result = await reorderPagesAction(formData);
  if (result.error || !result.buffer) {
    return NextResponse.json({ error: result.error ?? "Reorder failed" }, { status: 400 });
  }
  return pdfDownloadResponse(result.buffer, "reordered.pdf");
}
