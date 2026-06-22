"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSignatureTemplatesAction, signDocumentAction } from "@/actions/signature/signature-actions";
import { SignatureTemplate, PlacedStamp, StampType } from "@/types/signature/signature.types";
import { FileRow } from "@/types/files.types";
import { toast } from "sonner";
import {
  Calendar,
  Type,
  Plus,
  Trash2,
  Lock,
  Loader2
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure CDN pdf.js worker globally for client-side loading
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.1.9"}/pdf.worker.min.js`;

interface SignatureWorkspaceProps {
  file: FileRow;
  onClose: () => void;
}

export function SignatureWorkspace({ file, onClose }: SignatureWorkspaceProps) {
  const [templates, setTemplates] = useState<SignatureTemplate[]>([]);
  const [stamps, setStamps] = useState<PlacedStamp[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate | null>(null);
  
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [isSigning, setIsSigning] = useState(false);

  const [activeTab, setActiveTab] = useState<"signatures" | "initials" | "fields">("signatures");
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);

  // Load Saved templates on mount
  useEffect(() => {
    async function loadTemplates() {
      const res = await getSignatureTemplatesAction();
      if (res.success && res.data) {
        setTemplates(res.data);
        if (res.data.length > 0) {
          setSelectedTemplate(res.data[0]);
        }
      }
    }

    async function fetchPdf() {
      try {
        setLoadingPdf(true);
        // Download document buffer and load via pdfjs
        const loadingTask = pdfjsLib.getDocument({ url: file.cloudinary_secure_url });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setPageCount(doc.numPages);
      } catch (err) {
        console.error("Failed to load PDF viewer:", err);
        toast.error("Failed to load PDF document");
      } finally {
        setLoadingPdf(false);
      }
    }

    loadTemplates();
    fetchPdf();
  }, [file]);

  const addStamp = (type: StampType, customVal?: string) => {
    if (!pdfDoc) return;

    let value = "";
    let width = 120;
    let height = 40;

    if (type === "signature" || type === "initials") {
      if (!selectedTemplate) {
        toast.warning("Please draw or upload a signature template first!");
        return;
      }
      value = selectedTemplate.image_url;
      // preserve aspect ratio roughly
      const tWidth = selectedTemplate.width || 120;
      const tHeight = selectedTemplate.height || 40;
      width = 140;
      height = (140 * tHeight) / tWidth;
    } else if (type === "date") {
      value = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      width = 100;
      height = 25;
    } else if (type === "text") {
      value = customVal || "Approved By";
      width = 120;
      height = 30;
    }

    const newStamp: PlacedStamp = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      pageNumber: 1, // Place on page 1 by default
      x: 50,
      y: 50,
      width,
      height,
      value,
    };

    setStamps((prev) => [...prev, newStamp]);
    setSelectedStampId(newStamp.id);
    toast.success(`${type} placed. Drag and resize it on the page.`);
  };

  const deleteStamp = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id));
    if (selectedStampId === id) setSelectedStampId(null);
  };

  const updateStampText = (id: string, text: string) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: text } : s))
    );
  };

  const handleSign = async () => {
    if (stamps.length === 0) {
      toast.error("Please place at least one signature or stamp on the document.");
      return;
    }

    setIsSigning(true);
    try {
      const res = await signDocumentAction({
        fileId: file.id,
        stamps,
      });

      if (res.success && res.data) {
        toast.success("Document signed successfully!");
        onClose();
      } else {
        toast.error(res.error || "Failed to sign document");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during signing.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] border border-border bg-card rounded-xl overflow-hidden shadow-lg gap-px">
      {/* Sidebar Controls */}
      <div className="w-80 flex flex-col bg-card border-r border-border overflow-hidden">
        {/* Navigation tabs */}
        <div className="flex border-b border-border bg-muted/20">
          <button
            onClick={() => setActiveTab("signatures")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-colors ${
              activeTab === "signatures"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Signatures
          </button>
          <button
            onClick={() => setActiveTab("fields")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-colors ${
              activeTab === "fields"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Fields
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "signatures" && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Saved Signatures
              </span>
              {templates.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-lg text-center bg-muted/10">
                  No saved signatures. Create one in Dashboard &gt; Signatures.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate?.id === t.id
                          ? "border-primary bg-primary/5 font-semibold text-primary"
                          : "border-border hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="h-12 w-full flex items-center justify-center bg-white rounded-md p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.image_url} alt={t.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1.5 truncate max-w-full">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedTemplate && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => addStamp("signature")}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Place Sign
                  </button>
                  <button
                    onClick={() => addStamp("initials")}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Place Initials
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "fields" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Stamps & Date fields
              </span>
              <button
                onClick={() => addStamp("date")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted text-left text-sm transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Date Stamp</span>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              </button>
              <button
                onClick={() => addStamp("text")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted text-left text-sm transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Custom Text Stamp</span>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              </button>
            </div>
          )}
        </div>

        {/* Save/Sealing Panel */}
        <div className="p-4 border-t border-border space-y-2 bg-muted/10">
          <button
            onClick={handleSign}
            disabled={isSigning || stamps.length === 0}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing & Hashing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Sign & Finalize PDF
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSigning}
            className="w-full h-9 border border-border hover:bg-muted text-foreground text-xs font-medium rounded-lg transition-colors"
          >
            Cancel Workspace
          </button>
        </div>
      </div>

      {/* Virtualized Page Viewer Panel */}
      <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden relative">
        {loadingPdf ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading PDF file...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 flex flex-col items-center">
            {Array.from({ length: pageCount }).map((_, idx) => (
              <VirtualizedPage
                key={idx}
                pageNumber={idx + 1}
                pdfDoc={pdfDoc!}
                stamps={stamps.filter((s) => s.pageNumber === idx + 1)}
                setStamps={setStamps}
                selectedStampId={selectedStampId}
                setSelectedStampId={setSelectedStampId}
                deleteStamp={deleteStamp}
                updateStampText={updateStampText}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Virtualized Page Component ──────────────────────────────────────────────
interface VirtualizedPageProps {
  pageNumber: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  stamps: PlacedStamp[];
  setStamps: React.Dispatch<React.SetStateAction<PlacedStamp[]>>;
  selectedStampId: string | null;
  setSelectedStampId: (id: string | null) => void;
  deleteStamp: (id: string) => void;
  updateStampText: (id: string, text: string) => void;
}

function VirtualizedPage({
  pageNumber,
  pdfDoc,
  stamps,
  setStamps,
  selectedStampId,
  setSelectedStampId,
  deleteStamp,
  updateStampText,
}: VirtualizedPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 500, height: 700 });

  // 1. Intersection Observer for Page Virtualization
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 2. Fetch page dimension and render if visible
  useEffect(() => {
    let active = true;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const originalViewport = page.getViewport({ scale: 1.0 });

        // Lock to 500px CSS width
        const renderWidth = 500;
        const renderScale = renderWidth / originalViewport.width;
        const renderViewport = page.getViewport({ scale: renderScale });

        if (active) {
          setDimensions({
            width: renderWidth,
            height: renderViewport.height,
          });
        }

        if (!isVisible) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set backing store dimensions
        canvas.width = renderWidth * window.devicePixelRatio;
        canvas.height = renderViewport.height * window.devicePixelRatio;
        canvas.style.width = `${renderWidth}px`;
        canvas.style.height = `${renderViewport.height}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          const renderContext = {
            canvasContext: ctx,
            viewport: renderViewport,
            canvas: canvas,
          };
          await page.render(renderContext).promise;
        }
      } catch (err) {
        console.error("Prerender error on page", pageNumber, err);
      }
    }

    renderPage();

    return () => {
      active = false;
    };
  }, [isVisible, pdfDoc, pageNumber]);

  // 3. Stamp Drag & Resize Logic
  const handleStampMouseDown = (
    e: React.MouseEvent,
    stamp: PlacedStamp,
    action: "drag" | "resize"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedStampId(stamp.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = stamp.width;
    const startH = stamp.height;
    const startStampX = stamp.x;
    const startStampY = stamp.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setStamps((prev) =>
        prev.map((s) => {
          if (s.id !== stamp.id) return s;

          if (action === "drag") {
            const nextX = Math.max(0, Math.min(dimensions.width - s.width, startStampX + dx));
            const nextY = Math.max(0, Math.min(dimensions.height - s.height, startStampY + dy));
            return { ...s, x: nextX, y: nextY };
          } else {
            // Resize: maintain aspect ratio for signatures
            if (s.type === "signature" || s.type === "initials") {
              const ratio = startH / startW;
              const nextW = Math.max(40, Math.min(dimensions.width - s.x, startW + dx));
              return { ...s, width: nextW, height: nextW * ratio };
            } else {
              const nextW = Math.max(45, Math.min(dimensions.width - s.x, startW + dx));
              const nextH = Math.max(15, Math.min(dimensions.height - s.y, startH + dy));
              return { ...s, width: nextW, height: nextH };
            }
          }
        })
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
      className="relative border border-border bg-white shadow-md rounded-lg overflow-hidden group select-none shrink-0"
    >
      {/* Backing Canvas for PDF rendering */}
      {isVisible ? (
        <canvas ref={canvasRef} className="block" />
      ) : (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading Page {pageNumber}...
        </div>
      )}

      {/* Floating Page Number */}
      <span className="absolute top-3 left-3 bg-zinc-900/60 dark:bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
        Page {pageNumber}
      </span>

      {/* Placed Stamps Layer */}
      {stamps.map((stamp) => (
        <div
          key={stamp.id}
          style={{
            left: `${stamp.x}px`,
            top: `${stamp.y}px`,
            width: `${stamp.width}px`,
            height: `${stamp.height}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStampId(stamp.id);
          }}
          className={`absolute flex items-center justify-center border group/stamp select-none cursor-move ${
            selectedStampId === stamp.id
              ? "border-primary bg-primary/5"
              : "border-transparent hover:border-muted-foreground/30"
          }`}
          onMouseDown={(e) => handleStampMouseDown(e, stamp, "drag")}
        >
          {/* Stamp render content */}
          {/* eslint-disable @next/next/no-img-element */}
          {stamp.type === "signature" || stamp.type === "initials" ? (
            <img src={stamp.value} alt="Placed stamp" className="max-h-full max-w-full object-contain pointer-events-none" />
          ) : stamp.type === "date" ? (
            <span className="text-[11px] font-bold font-mono text-zinc-900 pointer-events-none">
              {stamp.value}
            </span>
          ) : (
            <input
              type="text"
              value={stamp.value}
              onChange={(e) => updateStampText(stamp.id, e.target.value)}
              className="w-full h-full text-center border-none bg-transparent text-[11px] text-zinc-900 font-semibold focus:outline-none focus:ring-0 focus:border-none p-1 cursor-text"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()} // don't drag when clicking input
            />
          )}
          {/* eslint-enable @next/next/no-img-element */}

          {/* Controls overlay: only show when stamp is selected */}
          {selectedStampId === stamp.id && (
            <>
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStamp(stamp.id);
                }}
                className="absolute -top-3.5 -right-3.5 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md border border-white transition-colors"
                title="Delete stamp"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              {/* Resize Handle (Bottom-Right) */}
              <div
                onMouseDown={(e) => handleStampMouseDown(e, stamp, "resize")}
                className="absolute -bottom-1 -right-1 h-3 w-3 bg-primary border border-white rounded-full cursor-se-resize shadow-sm"
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
