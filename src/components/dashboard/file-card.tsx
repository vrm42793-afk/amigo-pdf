"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  File,
  MoreVertical,
  Trash2,
  PencilLine,
  Download,
  ExternalLink,
} from "lucide-react";
import type { FileRow } from "@/types/files.types";
import { useDeleteFile, useRenameFile } from "@/hooks/use-files";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";
import {
  GlassDropdown,
  GlassDropdownTrigger,
  GlassDropdownContent,
  GlassDropdownItem,
  GlassDropdownSeparator,
} from "@/components/ui-premium/inputs/glass-dropdown";
import { GlassInput } from "@/components/ui-premium/inputs/glass-input";

interface FileCardProps {
  file: FileRow;
  view?: "grid" | "list";
}

function renderFileIcon(mimeType: string, className: string) {
  if (mimeType === "application/pdf") return <FileText className={className} />;
  if (mimeType.includes("spreadsheet")) return <FileSpreadsheet className={className} />;
  if (mimeType.includes("presentation")) return <Presentation className={className} />;
  if (mimeType.startsWith("image/")) return <ImageIcon className={className} />;
  return <File className={className} />;
}

function getMimeColor(mimeType: string): string {
  if (mimeType === "application/pdf") return "text-red-500 bg-red-500/10 border-red-500/20";
  if (mimeType.includes("spreadsheet")) return "text-green-500 bg-green-500/10 border-green-500/20";
  if (mimeType.includes("presentation")) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
  if (mimeType.includes("word")) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  if (mimeType.startsWith("image/")) return "text-purple-500 bg-purple-500/10 border-purple-500/20";
  return "text-muted-foreground bg-muted border-border";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function FileCard({ file, view = "grid" }: FileCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();
  const { mutate: renameFile, isPending: isRenaming2 } = useRenameFile();

  const iconClasses = getMimeColor(file.type);

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== file.name) {
      renameFile({ fileId: file.id, newName: newName.trim() });
    }
    setIsRenaming(false);
  };

  const contextMenu = (
    <GlassDropdown>
      <GlassDropdownTrigger asChild>
        <button className="rounded-lg p-1.5 hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-accent">
          <MoreVertical className="h-4 w-4" />
        </button>
      </GlassDropdownTrigger>
      <GlassDropdownContent align="end" className="w-48">
        <GlassDropdownItem asChild>
          <a href={file.cloudinary_secure_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Open
          </a>
        </GlassDropdownItem>
        <GlassDropdownItem asChild>
          <a href={file.cloudinary_secure_url} download={file.name}>
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </GlassDropdownItem>
        <GlassDropdownItem onClick={() => setIsRenaming(true)}>
          <PencilLine className="mr-2 h-4 w-4" /> Rename
        </GlassDropdownItem>
        <GlassDropdownSeparator />
        <GlassDropdownItem
          onClick={() => deleteFile(file.id)}
          disabled={isDeleting || isRenaming2}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </GlassDropdownItem>
      </GlassDropdownContent>
    </GlassDropdown>
  );

  if (view === "list") {
    return (
      <motion.div
        layout
        className="glass-panel group flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-surface-hover transition-all duration-300 relative overflow-hidden"
      >
        <div className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border ${iconClasses}`}>
          {renderFileIcon(file.type, "h-5 w-5")}
        </div>

        <div className="min-w-0 flex-1 relative z-10">
          {isRenaming ? (
            <GlassInput
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") { setIsRenaming(false); setNewName(file.name); }
              }}
              className="h-8 py-1 px-2 text-sm max-w-sm"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
          )}
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
            {formatFileSize(file.size)} &middot; {timeAgo(file.created_at)}
          </p>
        </div>

        <div className="relative shrink-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {contextMenu}
        </div>
      </motion.div>
    );
  }

  return (
    <GlassCard interactive className="p-4 flex flex-col group relative overflow-hidden h-full">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`h-12 w-12 flex items-center justify-center rounded-xl border shadow-inner ${iconClasses}`}>
          {renderFileIcon(file.type, "h-6 w-6")}
        </div>
        <div className="relative z-20 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
          {contextMenu}
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        {isRenaming ? (
          <GlassInput
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") { setIsRenaming(false); setNewName(file.name); }
            }}
            className="h-8 py-1 px-2 text-sm mb-2"
          />
        ) : (
          <p className="truncate text-sm font-bold text-foreground mb-1 group-hover:text-accent transition-colors">
            {file.name}
          </p>
        )}

        <p className="text-[11px] font-medium text-muted-foreground">
          {formatFileSize(file.size)} &middot; {timeAgo(file.created_at)}
        </p>
      </div>
    </GlassCard>
  );
}
