"use server";

import { createClient } from "@/lib/supabase/server";
import { renameFileService } from "@/server/files/file-service";
import type { FileRow } from "@/types/files.types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const renameFileSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
  newName: z.string().min(1, "File name is required").max(255, "File name is too long"),
});

export interface RenameFileActionResult {
  file?: FileRow;
  error?: string;
}

export async function renameFileAction(
  input: z.infer<typeof renameFileSchema>
): Promise<RenameFileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const validated = renameFileSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    const file = await renameFileService(validated.data.fileId, user.id, validated.data.newName);
    revalidatePath("/dashboard/files");
    return { file };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rename failed";
    return { error: message };
  }
}
