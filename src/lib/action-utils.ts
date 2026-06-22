export async function withActionError<T>(
  action: () => Promise<T>
): Promise<T | { error: string }> {
  try {
    return await action();
  } catch (error: unknown) {
    console.error("[Unhandled Action Error]:", error);
    
    if (error instanceof Error && error.message.includes("Missing NEXT_PUBLIC")) {
      return { error: "Server configuration error. Contact administrator." };
    }
    
    return { error: error instanceof Error ? error.message : "An unexpected system error occurred" };
  }
}
