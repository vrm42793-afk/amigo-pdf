"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFiles } from "@/hooks/use-files";
import { FileCard } from "@/components/dashboard/file-card";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Upload,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileUpload } from "@/hooks/use-file-upload";
import MobileScanner from "@/components/mobile/mobile-scanner";

export default function FilesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"created_at" | "name" | "size">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showUpload, setShowUpload] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { uploadFiles } = useFileUpload();
  const loaderRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, isError } =
    useFiles({ search: debouncedSearch, sortBy, sortOrder });

  const allFiles = data?.pages.flatMap((p) => p.files) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(handleObserver, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleObserver]);

  const handleScannerCapture = async (file: File) => {
    setShowScanner(false);
    await uploadFiles([file]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Files</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} document${total !== 1 ? "s" : ""}` : "No documents yet"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowScanner(true)}
            variant="outline"
            className="gap-2 sm:hidden cursor-pointer"
          >
            <Camera className="h-4 w-4" />
            Scan
          </Button>
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Upload area */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <UploadWidget />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Mobile Scanner Modal */}
      {showScanner && (
        <MobileScanner
          onCapture={handleScannerCapture}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground ml-1" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(":");
                setSortBy(by as "created_at" | "name" | "size");
                setSortOrder(order as "asc" | "desc");
              }}
              className="bg-transparent text-xs text-foreground outline-none px-1 cursor-pointer"
            >
              <option value="created_at:desc">Newest first</option>
              <option value="created_at:asc">Oldest first</option>
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="size:desc">Largest first</option>
              <option value="size:asc">Smallest first</option>
            </select>
          </div>

          <div className="flex rounded-md border border-border bg-card p-1">
            <button
              onClick={() => setView("grid")}
              className={`rounded p-1.5 transition-colors ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded p-1.5 transition-colors ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* File Grid/List */}
      {isLoading && (
        <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={view === "grid" ? "h-36 rounded-xl" : "h-14 rounded-lg"} />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Failed to load files. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && allFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-base font-semibold text-foreground">No files found</p>
          <p className="text-sm text-muted-foreground">
            {debouncedSearch ? `No results for "${debouncedSearch}"` : "Upload your first document to get started."}
          </p>
        </div>
      )}

      {!isLoading && allFiles.length > 0 && (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "space-y-2"
          }
        >
          {allFiles.map((file) => (
            <FileCard key={file.id} file={file} view={view} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loaderRef} className="h-8 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
    </div>
  );
}
