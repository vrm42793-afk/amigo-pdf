"use client";

import { useState } from "react";
import { PdfToolLayout } from "@/components/pdf/pdf-tool-layout";
import { reorderPagesAction } from "@/actions/pdf/reorder-pages";
import { Input } from "@/components/ui/input";
import type { ProcessResult } from "@/components/pdf/pdf-tool-layout";

export default function ReorderPage() {
  const [newOrder, setNewOrder] = useState("3, 1, 2");

  return (
    <PdfToolLayout
      title="Reorder Pages"
      description="Rearrange pages in a PDF by specifying the new page order."
      outputFileName="reordered.pdf"
      controlsSlot={
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="reorder-input">
            New Page Order
          </label>
          <Input
            id="reorder-input"
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            placeholder="e.g. 3, 1, 2 for a 3-page PDF"
          />
          <p className="text-xs text-muted-foreground">
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
