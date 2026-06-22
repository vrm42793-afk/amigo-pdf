import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/pdf/_utils";
import { extractTextAction } from "@/actions/ocr/extract-text";
import { withErrorHandler, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const result = await extractTextAction(formData);

    if (result.error) {
      return apiError(result.error, 400);
    }

    return NextResponse.json({
      jobId: result.jobId,
      text: result.text,
      pages: result.pages,
      confidence: result.confidence,
    });
  });
}
