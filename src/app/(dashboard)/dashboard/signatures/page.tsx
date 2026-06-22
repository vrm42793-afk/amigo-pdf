"use client";

import React, { useState, useEffect } from "react";
import { PenTool, Upload, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { getSignatureTemplatesAction, saveSignatureAction, deleteSignatureTemplateAction } from "@/actions/signature/signature-actions";
import { SignatureTemplate } from "@/types/signature/signature.types";
import { SignaturePad } from "@/components/signatures/signature-pad";
import { SignatureUploader } from "@/components/signatures/signature-uploader";
import { toast } from "sonner";

export default function SignaturesManagementPage() {
  const [templates, setTemplates] = useState<SignatureTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"draw" | "upload" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await getSignatureTemplatesAction();
        if (active) {
          if (res.success && res.data) {
            setTemplates(res.data);
          } else {
            toast.error(res.error || "Failed to load signature templates");
          }
        }
      } catch {
        if (active) {
          toast.error("An error occurred while loading signature templates.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveTemplate = async (base64Data: string, width: number, height: number) => {
    setSaving(true);
    try {
      const name = `Signature ${templates.length + 1}`;
      const res = await saveSignatureAction({
        name,
        base64Data,
        width,
        height,
      });

      if (res.success && res.data) {
        toast.success("Signature template saved!");
        setTemplates((prev) => [res.data!, ...prev]);
        setActiveMode(null);
      } else {
        toast.error(res.error || "Failed to save template");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this signature template?")) return;

    try {
      const res = await deleteSignatureTemplateAction(id);
      if (res.success) {
        toast.success("Signature template deleted.");
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(res.error || "Failed to delete template");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <PenTool className="h-6 w-6 text-primary" />
          My Saved Signatures
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Draw or upload signature templates to quickly stamp and sign PDFs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creator panel */}
        <div className="md:col-span-1 space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
              Add New Signature
            </h3>
            
            {activeMode === null ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveMode("draw")}
                  className="w-full h-10 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <PenTool className="h-4 w-4 text-primary" />
                  Draw Signature
                </button>
                <button
                  onClick={() => setActiveMode("upload")}
                  className="w-full h-10 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="h-4 w-4 text-primary" />
                  Upload PNG
                </button>
              </div>
            ) : (
              <div className="pt-2">
                {saving ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">Uploading template...</span>
                  </div>
                ) : activeMode === "draw" ? (
                  <SignaturePad
                    onSave={handleSaveTemplate}
                    onCancel={() => setActiveMode(null)}
                  />
                ) : (
                  <SignatureUploader
                    onSave={handleSaveTemplate}
                    onCancel={() => setActiveMode(null)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Templates list */}
        <div className="md:col-span-2 space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm flex flex-col min-h-[300px]">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground mb-4">
              Saved Signature Cards
            </h3>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                <PenTool className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium">No signature templates saved</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Draw or upload your signature using the side panel to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="border border-border bg-card hover:border-primary/30 rounded-lg p-3 flex flex-col space-y-3 relative group transition-all"
                  >
                    <div className="h-20 w-full bg-white dark:bg-zinc-950 border border-border rounded-md p-1.5 flex items-center justify-center shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.image_url} alt={t.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">{t.name}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {t.width}x{t.height}px • Saved {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 bg-green-500/10 text-green-500 text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-green-500/20 flex items-center gap-1">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Secure private
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
