import { createClient } from "@/lib/supabase/server";
import { getChatStream } from "@/actions/ai/chat-with-pdf";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();
    if (!sessionId || !message) {
      return new Response(JSON.stringify({ error: "Missing sessionId or message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stream = await getChatStream(user.id, sessionId, message);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Encode the chunk as SSE data
            const dataString = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${dataString}\n\n`));
          }
        } catch (e: unknown) {
          console.error("Streaming route error:", e);
          const errMsg = e instanceof Error ? e.message : "Streaming failed";
          const errPayload = JSON.stringify({ error: errMsg });
          controller.enqueue(encoder.encode(`data: ${errPayload}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
