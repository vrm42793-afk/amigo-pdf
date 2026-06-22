import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateUploadSignature } from "@/lib/cloudinary/signer";
import { z } from "zod";
import { randomUUID } from "crypto";

const signRequestSchema = z.object({
  fileName: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validated = signRequestSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues[0].message },
      { status: 400 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${randomUUID()}-${validated.data.fileName.replace(/\s+/g, "_")}`;

  const signatureData = generateUploadSignature({
    userId: user.id,
    publicId,
    timestamp,
  });

  return NextResponse.json(signatureData);
}
