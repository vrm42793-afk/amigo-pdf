import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/pdf/_utils";
import { ocrImageAction } from "@/actions/ocr/ocr-image";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const formData = await request.formData();
  const result = await ocrImageAction(formData);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    jobId: result.jobId,
    text: result.result?.text,
    confidence: result.result?.confidence,
  });
}
