"use server";

import { createClient } from "@/lib/supabase/server";
import { listFiles } from "@/server/files/file-repository";

export async function getUserFilesAction(search?: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized. Please log in.");
    }

    const result = await listFiles({
      userId: user.id,
      page: 1,
      pageSize: 100, // retrieve up to 100 files for selection
      search
    });

    return { success: true, data: result.files };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch files" };
  }
}
