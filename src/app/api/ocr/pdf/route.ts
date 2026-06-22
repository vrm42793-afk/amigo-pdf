import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/pdf/_utils";
import { ocrPdfAction } from "@/actions/ocr/ocr-pdf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const formData = await request.formData();
  const result = await ocrPdfAction(formData);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    jobId: result.jobId,
    pages: result.result?.pages,
    fullText: result.result?.fullText,
    averageConfidence: result.result?.averageConfidence,
  });
}
