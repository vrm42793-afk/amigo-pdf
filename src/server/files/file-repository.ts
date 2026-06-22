import { createClient } from "@/lib/supabase/server";
import type { FileInsert, FileUpdate, FileRow, PaginatedFiles, FileListParams } from "@/types/files.types";

export async function insertFile(data: FileInsert): Promise<FileRow> {
  const supabase = await createClient();
  const { data: file, error } = await supabase
    .from("files")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return file;
}

export async function getFileById(fileId: string, userId: string): Promise<FileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .single();

  if (error) return null;
  return data;
}

export async function listFiles(params: FileListParams): Promise<PaginatedFiles> {
  const supabase = await createClient();
  const {
    userId,
    page = 1,
    pageSize = 20,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("files")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    files: data ?? [],
    total,
    page,
    pageSize,
    hasNextPage: from + pageSize < total,
  };
}

export async function updateFile(
  fileId: string,
  userId: string,
  data: FileUpdate
): Promise<FileRow> {
  const supabase = await createClient();
  const { data: file, error } = await supabase
    .from("files")
    .update(data)
    .eq("id", fileId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return file;
}

export async function softDeleteFile(fileId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("files")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", fileId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function incrementUserStorageUsed(userId: string, bytes: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_storage_used", {
    p_user_id: userId,
    p_bytes: bytes,
  });
  if (error) throw new Error(error.message);
}

export async function decrementUserStorageUsed(userId: string, bytes: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decrement_storage_used", {
    p_user_id: userId,
    p_bytes: bytes,
  });
  if (error) throw new Error(error.message);
}
