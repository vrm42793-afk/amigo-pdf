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
  if (mimeType === "application/pdf") return "text-red-500";
  if (mimeType.includes("spreadsheet")) return "text-green-500";
  if (mimeType.includes("presentation")) return "text-orange-500";
  if (mimeType.includes("word")) return "text-blue-500";
  if (mimeType.startsWith("image/")) return "text-purple-500";
  return "text-muted-foreground";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();
  const { mutate: renameFile, isPending: isRenaming2 } = useRenameFile();

  const iconColor = getMimeColor(file.type);

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== file.name) {
      renameFile({ fileId: file.id, newName: newName.trim() });
    }
    setIsRenaming(false);
  };

  if (view === "list") {
    return (
      <motion.div
        layout
        className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors group"
      >
        <div className={`shrink-0 ${iconColor}`}>
          {renderFileIcon(file.type, "h-8 w-8")}
        </div>

        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") { setIsRenaming(false); setNewName(file.name); }
              }}
              className="w-full rounded border border-primary bg-background px-2 py-0.5 text-sm outline-none"
            />
          ) : (
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatFileSize(file.size)} · {timeAgo(file.created_at)}
          </p>
        </div>

        <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-1.5 hover:bg-muted transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {isMenuOpen && (
            <FileContextMenu
              file={file}
              onClose={() => setIsMenuOpen(false)}
              onRename={() => { setIsRenaming(true); setIsMenuOpen(false); }}
              onDelete={() => deleteFile(file.id)}
              isDeleting={isDeleting || isRenaming2}
            />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${iconColor} rounded-lg bg-muted p-2.5`}>
          {renderFileIcon(file.type, "h-6 w-6")}
        </div>
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-1 hover:bg-muted transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {isMenuOpen && (
            <FileContextMenu
              file={file}
              onClose={() => setIsMenuOpen(false)}
              onRename={() => { setIsRenaming(true); setIsMenuOpen(false); }}
              onDelete={() => deleteFile(file.id)}
              isDeleting={isDeleting || isRenaming2}
            />
          )}
        </div>
      </div>

      {isRenaming ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") { setIsRenaming(false); setNewName(file.name); }
          }}
          className="w-full rounded border border-primary bg-background px-2 py-0.5 text-xs outline-none mb-1"
        />
      ) : (
        <p className="truncate text-sm font-semibold text-foreground mb-1">{file.name}</p>
      )}

      <p className="text-xs text-muted-foreground">
        {formatFileSize(file.size)} · {timeAgo(file.created_at)}
      </p>
    </motion.div>
  );
}

interface FileContextMenuProps {
  file: FileRow;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function FileContextMenu({ file, onClose, onRename, onDelete, isDeleting }: FileContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-7 z-50 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
        <a
          href={file.cloudinary_secure_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          Open
        </a>
        <a
          href={file.cloudinary_secure_url}
          download={file.name}
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          Download
        </a>
        <button
          onClick={onRename}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
        >
          <PencilLine className="h-3.5 w-3.5 text-muted-foreground" />
          Rename
        </button>
        <div className="my-1 border-t border-border" />
        <button
          onClick={() => { onDelete(); onClose(); }}
          disabled={isDeleting}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </>
  );
}
