import { NextResponse } from "next/server";

export function apiError(message: string, status: number = 500, details?: unknown): NextResponse {
  console.error(`[API Error ${status}]:`, message, details || "");
  return NextResponse.json(
    { 
      error: message, 
      status, 
      ...(details ? { details } : {}) 
    },
    { status }
  );
}

export async function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: unknown) {
    console.error("[Unhandled API Error]:", error);
    
    // Check if it's our own thrown error format
    if (error instanceof Error && error.message.includes("Missing NEXT_PUBLIC")) {
      return apiError("Server configuration error. Contact administrator.", 500);
    }
    
    // General fallback
    const err = error as Record<string, unknown>;
    return apiError(
      typeof err?.message === "string" ? err.message : "An unexpected system error occurred",
      typeof err?.status === "number" ? err.status : 500
    );
  }
}
