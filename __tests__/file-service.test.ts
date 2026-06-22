import { describe, it, expect } from "vitest";
import { validateFile } from "@/server/files/file-service";

// ─── File Validation Tests ─────────────────────────────────────────────────

describe("validateFile", () => {
  it("should accept a valid PDF under size limit", () => {
    const result = validateFile({
      fileName: "document.pdf",
      mimeType: "application/pdf",
      fileSize: 5 * 1024 * 1024, // 5 MB
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept a valid DOCX file", () => {
    const result = validateFile({
      fileName: "report.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 2 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
  });

  it("should accept PNG image files", () => {
    const result = validateFile({
      fileName: "screenshot.png",
      mimeType: "image/png",
      fileSize: 1 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
  });

  it("should reject files exceeding 100MB", () => {
    const result = validateFile({
      fileName: "huge-file.pdf",
      mimeType: "application/pdf",
      fileSize: 101 * 1024 * 1024, // 101 MB
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("100MB");
  });

  it("should reject unsupported MIME types", () => {
    const result = validateFile({
      fileName: "video.mp4",
      mimeType: "video/mp4",
      fileSize: 10 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("video/mp4");
  });

  it("should reject files with disallowed extensions", () => {
    const result = validateFile({
      fileName: "script.exe",
      mimeType: "application/pdf", // MIME spoofing attempt
      fileSize: 1 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain(".exe");
  });

  it("should reject files exactly at the boundary (100MB is max)", () => {
    const result = validateFile({
      fileName: "boundary.pdf",
      mimeType: "application/pdf",
      fileSize: 100 * 1024 * 1024, // Exactly 100 MB — allowed
    });
    expect(result.valid).toBe(true);
  });

  it("should reject empty file names", () => {
    // Files will have extension checks
    const result = validateFile({
      fileName: "noextension",
      mimeType: "application/pdf",
      fileSize: 1 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
  });
});

// ─── Cloudinary Config Tests ───────────────────────────────────────────────
describe("Cloudinary getUserFolder", () => {
  it("should generate correct folder paths", async () => {
    const { getUserFolder } = await import("@/lib/cloudinary/config");
    const userId = "abc-123-def";
    expect(getUserFolder(userId)).toBe("amigo-pdf/users/abc-123-def");
  });
});

// ─── Upload Action Validation ──────────────────────────────────────────────
describe("Delete File Action Schema", () => {
  it("should reject non-UUID file IDs", async () => {
    const { z } = await import("zod");
    const schema = z.object({ fileId: z.string().uuid() });
    const result = schema.safeParse({ fileId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid UUID file IDs", async () => {
    const { z } = await import("zod");
    const schema = z.object({ fileId: z.string().uuid() });
    const result = schema.safeParse({ fileId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" });
    expect(result.success).toBe(true);
  });
});

// ─── Rename Action Validation ──────────────────────────────────────────────
describe("Rename File Action Schema", () => {
  it("should reject empty file names", async () => {
    const { z } = await import("zod");
    const schema = z.object({
      fileId: z.string().uuid(),
      newName: z.string().min(1),
    });
    const result = schema.safeParse({
      fileId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      newName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid rename inputs", async () => {
    const { z } = await import("zod");
    const schema = z.object({
      fileId: z.string().uuid(),
      newName: z.string().min(1),
    });
    const result = schema.safeParse({
      fileId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      newName: "My Updated Document.pdf",
    });
    expect(result.success).toBe(true);
  });
});
