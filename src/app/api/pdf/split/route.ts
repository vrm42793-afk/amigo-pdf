import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_utils";
import { splitPdfAction } from "@/actions/pdf/split-pdf";
import { withErrorHandler, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const result = await splitPdfAction(formData);

    if (result.error || !result.parts) {
      return apiError(result.error ?? "Split failed", 400);
    }

    return NextResponse.json({
      parts: result.parts.map((p, i) => ({
        fileName: `part-${i + 1}.pdf`,
        buffer: p.buffer,
        pageCount: p.pageCount,
        sizeBytes: p.sizeBytes,
      })),
    });
  });
}
