"use server";

import { createClient } from "@/lib/supabase/server";
import { deleteFileService } from "@/server/files/file-service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const deleteFileSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

export interface DeleteFileActionResult {
  success?: boolean;
  error?: string;
}

export async function deleteFileAction(
  input: z.infer<typeof deleteFileSchema>
): Promise<DeleteFileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const validated = deleteFileSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await deleteFileService(validated.data.fileId, user.id);
    revalidatePath("/dashboard/files");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return { error: message };
  }
}
