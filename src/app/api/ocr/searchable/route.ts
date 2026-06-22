import { NextRequest, NextResponse } from "next/server";
import { requireAuth, pdfDownloadResponse } from "@/app/api/pdf/_utils";
import { createSearchablePdfAction } from "@/actions/ocr/create-searchable-pdf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const formData = await request.formData();
  const result = await createSearchablePdfAction(formData);

  if (result.error || !result.buffer) {
    return NextResponse.json({ error: result.error ?? "Searchable PDF generation failed" }, { status: 400 });
  }

  return pdfDownloadResponse(result.buffer, "searchable.pdf");
}
