import { NextRequest, NextResponse } from "next/server";
import { requireAuth, pdfDownloadResponse } from "../_utils";
import { mergePdfAction } from "@/actions/pdf/merge-pdf";
import { withErrorHandler, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const result = await mergePdfAction(formData);

    if (result.error || !result.buffer) {
      return apiError(result.error ?? "Merge failed", 400);
    }

    return pdfDownloadResponse(result.buffer, "merged.pdf");
  });
}
