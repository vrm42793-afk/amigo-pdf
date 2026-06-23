"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFiles } from "@/hooks/use-files";
import { FileCard } from "@/components/dashboard/file-card";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Upload,
  Camera,
  FolderOpen,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useFileUpload } from "@/hooks/use-file-upload";
import MobileScanner from "@/components/mobile/mobile-scanner";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
import { GlassInput } from "@/components/ui-premium/inputs/glass-input";
import { GlassTabs, GlassTabsList, GlassTabsTrigger } from "@/components/ui-premium/navigation/glass-tabs";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

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
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Files</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {total > 0 ? `${total} document${total !== 1 ? "s" : ""}` : "No documents yet"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <GlassButton
            onClick={() => setShowScanner(true)}
            variant="outline"
            className="gap-2 sm:hidden cursor-pointer text-xs"
            size="sm"
          >
            <Camera className="h-4 w-4" />
            Scan
          </GlassButton>
          <GlassButton
            onClick={() => setShowUpload(!showUpload)}
            className="gap-2 shrink-0 cursor-pointer text-xs"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </GlassButton>
        </div>
      </div>

      {/* Upload area */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              <UploadWidget />
            </div>
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

      {/* Filters and Search - Floating Glass Bar */}
      <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-3 shadow-lg relative z-20">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <GlassInput
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface/30 border-transparent hover:border-surface-border focus:bg-surface/60 transition-all rounded-xl w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Custom Select with Glass look */}
          <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface/50 p-1.5 hover:bg-surface transition-colors cursor-pointer relative group">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground ml-1 group-hover:text-accent transition-colors" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(":");
                setSortBy(by as "created_at" | "name" | "size");
                setSortOrder(order as "asc" | "desc");
              }}
              className="bg-transparent text-xs font-semibold text-foreground outline-none px-1 cursor-pointer appearance-none pr-4"
            >
              <option value="created_at:desc">Newest first</option>
              <option value="created_at:asc">Oldest first</option>
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="size:desc">Largest first</option>
              <option value="size:asc">Smallest first</option>
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <GlassTabs value={view} onValueChange={(v) => setView(v as "grid" | "list")} className="w-auto">
            <GlassTabsList className="h-9">
              <GlassTabsTrigger value="grid" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </GlassTabsTrigger>
              <GlassTabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </GlassTabsTrigger>
            </GlassTabsList>
          </GlassTabs>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`glass-panel animate-pulse ${view === "grid" ? "h-40 rounded-2xl" : "h-16 rounded-xl"}`} />
          ))}
        </div>
      )}

      {isError && (
        <GlassCard className="flex items-center justify-center py-16 border-destructive/30 bg-destructive/5">
          <p className="text-sm font-semibold text-destructive">Failed to load files. Please try again.</p>
        </GlassCard>
      )}

      {/* Empty State - Floating 3D Illustration feel */}
      {!isLoading && !isError && allFiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-24 gap-6"
        >
          <motion.div
            animate={{ y: [-10, 10, -10], rotateZ: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="h-32 w-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-accent/30 shadow-[0_0_50px_rgba(212,175,55,0.2)] flex items-center justify-center backdrop-blur-xl"
          >
            <FolderOpen className="h-16 w-16 text-accent/80" />
          </motion.div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-foreground tracking-tight">No files found</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {debouncedSearch ? `No results for "${debouncedSearch}". Try another term.` : "Upload your first document to unlock the power of AI."}
            </p>
          </div>
          {!debouncedSearch && (
            <GlassButton onClick={() => setShowUpload(true)} className="mt-2">
              <Upload className="h-4 w-4 mr-2" /> Upload First File
            </GlassButton>
          )}
        </motion.div>
      )}

      {/* File Grid/List with Staggered Animations */}
      {!isLoading && allFiles.length > 0 && (
        <motion.div
          key={view} // Re-animate when view changes
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={
            view === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "space-y-3"
          }
        >
          {allFiles.map((file) => (
            <motion.div key={file.id} variants={itemVariants} layoutId={`file-${file.id}`}>
              <FileCard file={file} view={view} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loaderRef} className="h-12 flex items-center justify-center mt-8">
        {isFetchingNextPage && (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
        )}
      </div>
    </div>
  );
}
