"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { deleteFileAction } from "@/actions/files/delete-file";
import { renameFileAction } from "@/actions/files/rename-file";
import type { FileRow, PaginatedFiles } from "@/types/files.types";
import { toast } from "sonner";

const PAGE_SIZE = 20;

// ─── List Files (paginated) ────────────────────────────────────────────────
export function useFiles(params: { search?: string; sortBy?: string; sortOrder?: string } = {}) {
  const supabase = createClient();
  const { search, sortBy = "created_at", sortOrder = "desc" } = params;

  return useInfiniteQuery<PaginatedFiles>({
    queryKey: ["files", search, sortBy, sortOrder],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      let query = supabase
        .from("files")
        .select("*", { count: "exact" })
        .eq("is_deleted", false)
        .order(sortBy as "created_at" | "name" | "size", { ascending: sortOrder === "asc" })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search) query = query.ilike("name", `%${search}%`);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const total = count ?? 0;
      return {
        files: (data as FileRow[]) ?? [],
        total,
        page,
        pageSize: PAGE_SIZE,
        hasNextPage: page * PAGE_SIZE < total,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}

// ─── Recent Files ──────────────────────────────────────────────────────────
export function useRecentFiles(limit = 5) {
  const supabase = createClient();
  return useQuery<FileRow[]>({
    queryKey: ["files", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data as FileRow[]) ?? [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ─── Delete File ───────────────────────────────────────────────────────────
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteFileAction({ fileId }),
    onSuccess: (result, fileId) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.removeQueries({ queryKey: ["file", fileId] });
    },
    onError: () => {
      toast.error("Failed to delete file");
    },
  });
}

// ─── Rename File ───────────────────────────────────────────────────────────
export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) =>
      renameFileAction({ fileId, newName }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("File renamed");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => {
      toast.error("Failed to rename file");
    },
  });
}
