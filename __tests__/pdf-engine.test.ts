import { describe, it, expect, beforeAll } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validatePdf, validatePageRange, resolvePages } from "@/lib/pdf/pdf-service";
import { mergePdfs } from "@/lib/pdf/merge-service";
import { splitPdf, parsePageRangeString } from "@/lib/pdf/split-service";
import { compressPdf } from "@/lib/pdf/compress-service";
import { rotatePdf } from "@/lib/pdf/rotate-service";
import { extractPages } from "@/lib/pdf/extract-service";
import { deletePagesFromPdf } from "@/lib/pdf/delete-pages-service";
import { reorderPdfPages } from "@/lib/pdf/reorder-service";
import { extractPdfMetadata } from "@/lib/pdf/pdf-service";

// ─── Test PDF factory ─────────────────────────────────────────────────────

async function createTestPdf(pageCount = 3, title?: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([595, 842]);
  }
  if (title) doc.setTitle(title);
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

let pdf3: Buffer;
let pdf2: Buffer;

beforeAll(async () => {
  pdf3 = await createTestPdf(3, "Test Document");
  pdf2 = await createTestPdf(2);
});

// ─── Validation ───────────────────────────────────────────────────────────

describe("PDF Validation", () => {
  it("should validate a real PDF buffer", async () => {
    const result = await validatePdf(pdf3);
    expect(result.valid).toBe(true);
    expect(result.pageCount).toBe(3);
    expect(result.isEncrypted).toBe(false);
  });

  it("should reject a non-PDF buffer", async () => {
    const fakeBuffer = Buffer.from("This is not a PDF");
    const result = await validatePdf(fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("valid PDF");
  });

  it("should reject oversized buffers", async () => {
    const bigBuffer = Buffer.alloc(101 * 1024 * 1024, 0);
    const result = await validatePdf(bigBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("100MB");
  });
});

// ─── Page Range Validation ────────────────────────────────────────────────

describe("validatePageRange", () => {
  it("should accept a valid range", () => {
    expect(validatePageRange({ start: 1, end: 3 }, 5)).toBeNull();
  });

  it("should reject start < 1", () => {
    expect(validatePageRange({ start: 0, end: 3 }, 5)).toBeTruthy();
  });

  it("should reject end > pageCount", () => {
    expect(validatePageRange({ start: 1, end: 10 }, 5)).toContain("exceeds");
  });

  it("should reject end < start", () => {
    expect(validatePageRange({ start: 5, end: 2 }, 10)).toContain(">= start");
  });
});

// ─── Resolve Pages ────────────────────────────────────────────────────────

describe("resolvePages", () => {
  it("should deduplicate and sort pages", () => {
    expect(resolvePages([3, 1, 1, 2], 5)).toEqual([1, 2, 3]);
  });

  it("should filter out-of-range pages", () => {
    expect(resolvePages([0, 1, 6], 5)).toEqual([1]);
  });
});

// ─── Parse Page Range String ──────────────────────────────────────────────

describe("parsePageRangeString", () => {
  it("should parse a simple range", () => {
    expect(parsePageRangeString("1-3")).toEqual([{ start: 1, end: 3 }]);
  });

  it("should parse comma-separated individual pages", () => {
    expect(parsePageRangeString("1, 3, 5")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 3 },
      { start: 5, end: 5 },
    ]);
  });

  it("should parse mixed ranges and single pages", () => {
    const result = parsePageRangeString("1-2, 4");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ start: 1, end: 2 });
    expect(result[1]).toEqual({ start: 4, end: 4 });
  });
});

// ─── Merge ────────────────────────────────────────────────────────────────

describe("mergePdfs", () => {
  it("should merge 2 PDFs and return correct page count", async () => {
    const result = await mergePdfs({ buffers: [pdf3, pdf2] });
    expect(result.pageCount).toBe(5); // 3 + 2
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it("should throw if fewer than 2 PDFs are provided", async () => {
    await expect(mergePdfs({ buffers: [pdf3] })).rejects.toThrow("2 PDFs");
  });
});

// ─── Split ────────────────────────────────────────────────────────────────

describe("splitPdf", () => {
  it("should split a PDF into 2 parts", async () => {
    const result = await splitPdf({
      buffer: pdf3,
      ranges: [{ start: 1, end: 2 }, { start: 3, end: 3 }],
    });
    expect(result.parts).toHaveLength(2);
    expect(result.parts[0].pageCount).toBe(2);
    expect(result.parts[1].pageCount).toBe(1);
  });

  it("should throw on invalid page range", async () => {
    await expect(
      splitPdf({ buffer: pdf3, ranges: [{ start: 1, end: 10 }] })
    ).rejects.toThrow("exceeds");
  });
});

// ─── Compress ─────────────────────────────────────────────────────────────

describe("compressPdf", () => {
  it("should return a valid buffer after compression", async () => {
    const result = await compressPdf({ buffer: pdf3, level: "medium" });
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.pageCount).toBe(3);
    expect(result.originalSizeBytes).toBeGreaterThan(0);
  });

  it("should track compression ratio", async () => {
    const result = await compressPdf({ buffer: pdf3, level: "high" });
    expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
    expect(result.compressionRatio).toBeLessThanOrEqual(1);
  });
});

// ─── Rotate ───────────────────────────────────────────────────────────────

describe("rotatePdf", () => {
  it("should rotate all pages 90 degrees", async () => {
    const result = await rotatePdf({ buffer: pdf3, degrees: 90 });
    expect(result.pageCount).toBe(3);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it("should rotate only selected pages", async () => {
    const result = await rotatePdf({ buffer: pdf3, degrees: 180, pages: [1, 2] });
    expect(result.pageCount).toBe(3);
  });
});

// ─── Extract ──────────────────────────────────────────────────────────────

describe("extractPages", () => {
  it("should extract 2 pages from a 3-page PDF", async () => {
    const result = await extractPages({ buffer: pdf3, pages: [1, 3] });
    expect(result.pageCount).toBe(2);
  });

  it("should throw if no pages provided", async () => {
    await expect(extractPages({ buffer: pdf3, pages: [] })).rejects.toThrow();
  });
});

// ─── Delete Pages ─────────────────────────────────────────────────────────

describe("deletePagesFromPdf", () => {
  it("should delete a page and reduce count by 1", async () => {
    const result = await deletePagesFromPdf({ buffer: pdf3, pages: [2] });
    expect(result.pageCount).toBe(2);
  });

  it("should throw if all pages would be deleted", async () => {
    await expect(
      deletePagesFromPdf({ buffer: pdf2, pages: [1, 2] })
    ).rejects.toThrow("all pages");
  });
});

// ─── Reorder ──────────────────────────────────────────────────────────────

describe("reorderPdfPages", () => {
  it("should reorder pages correctly", async () => {
    const result = await reorderPdfPages({ buffer: pdf3, newOrder: [3, 1, 2] });
    expect(result.pageCount).toBe(3);
  });

  it("should throw on wrong number of pages in newOrder", async () => {
    await expect(
      reorderPdfPages({ buffer: pdf3, newOrder: [1, 2] })
    ).rejects.toThrow("exactly 3");
  });

  it("should throw on duplicate page numbers", async () => {
    await expect(
      reorderPdfPages({ buffer: pdf3, newOrder: [1, 1, 3] })
    ).rejects.toThrow("exactly once");
  });
});

// ─── Metadata ─────────────────────────────────────────────────────────────

describe("extractPdfMetadata", () => {
  it("should extract page count and metadata", async () => {
    const meta = await extractPdfMetadata(pdf3);
    expect(meta.pageCount).toBe(3);
    expect(meta.fileSizeBytes).toBeGreaterThan(0);
    expect(meta.title).toBe("Test Document");
    expect(meta.isEncrypted).toBe(false);
  });
});
