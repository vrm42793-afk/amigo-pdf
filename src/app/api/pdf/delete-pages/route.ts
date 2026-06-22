import { NextRequest, NextResponse } from "next/server";
import { requireAuth, pdfDownloadResponse } from "../_utils";
import { deletePagesAction } from "@/actions/pdf/delete-pages";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const formData = await request.formData();
  const result = await deletePagesAction(formData);
  if (result.error || !result.buffer) {
    return NextResponse.json({ error: result.error ?? "Delete pages failed" }, { status: 400 });
  }
  return pdfDownloadResponse(result.buffer, "result.pdf");
}
