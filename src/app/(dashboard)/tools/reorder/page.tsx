"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { reorderPagesAction } from "@/actions/pdf/reorder-pages";
import { GlassInput } from "@/components/ui-premium/inputs/glass-input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";
import { ArrowLeftRight } from "lucide-react";

export default function ReorderPage() {
  const [newOrder, setNewOrder] = useState("3, 1, 2");

  return (
    <PdfToolLayout
      title="Reorder Pages"
      description="Rearrange pages in a PDF by specifying the new page order."
      icon={<ArrowLeftRight className="h-6 w-6 text-accent" />}
      outputFileName="reordered.pdf"
      controlsSlot={
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground tracking-tight" htmlFor="reorder-input">
            New Page Order
          </label>
          <GlassInput
            id="reorder-input"
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            placeholder="e.g. 3, 1, 2 for a 3-page PDF"
            className="w-full h-10"
          />
          <p className="text-xs font-medium text-muted-foreground mt-1">
            List every page number exactly once in your desired order.
          </p>
          <input
            type="hidden"
            name="newOrder"
            value={JSON.stringify(
              newOrder
                .split(",")
                .map((n) => parseInt(n.trim(), 10))
                .filter((n) => !isNaN(n))
            )}
          />
        </div>
      }
      onProcess={async (formData): Promise<ProcessResult> => {
        const result = await reorderPagesAction(formData);
        return result;
      }}
    />
  );
}
