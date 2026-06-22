/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WatermarkDetectionService } from "@/server/watermark/detection-service";
import { WatermarkInpaintingService } from "@/server/watermark/inpainting-service";
import sharp from "sharp";

// Mock Supabase Server Client
let mockResolveValue: any = { data: null, error: null };
const queryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
};
queryBuilder.select.mockReturnValue(queryBuilder);
queryBuilder.eq.mockReturnValue(queryBuilder);
queryBuilder.insert.mockReturnValue(queryBuilder);
queryBuilder.update.mockReturnValue(queryBuilder);
queryBuilder.single.mockImplementation(() => Promise.resolve(mockResolveValue));

const mockSupabase = {
  from: vi.fn(() => queryBuilder),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock Cloudinary Uploader
vi.mock("@/lib/cloudinary/uploader", () => ({
  uploadPrivateFile: vi.fn(() =>
    Promise.resolve({
      secureUrl: "https://cloudinary.com/cleaned.pdf",
      publicId: "cleaned-asset-uuid",
    })
  ),
}));

// Mock Gemini visual watermark detection
vi.mock("@/server/watermark/watermark-ai-service", () => ({
  WatermarkAiService: {
    detectWatermarks: vi.fn(() =>
      Promise.resolve([
        {
          x_min: 0.1,
          y_min: 0.1,
          x_max: 0.3,
          y_max: 0.3,
          type: "text",
          confidence: 0.9,
        },
      ])
    ),
  },
}));

describe("Watermark Intelligence Engine Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveValue = { data: null, error: null };
  });

  it("should successfully detect watermarks combining Tesseract keywords and Gemini", async () => {
    // 1x1 transparent PNG buffer
    const mockImage = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );

    const regions = await WatermarkDetectionService.detect(mockImage, 1, "confidential");

    // Should have detected regions (from the mocked Gemini detection)
    expect(regions.length).toBeGreaterThan(0);
    expect(regions[0].type).toBe("text");
    expect(regions[0].x_min).toBe(0.1);
  });

  it("should perform pixel-patch inpainting on image buffer successfully", async () => {
    // A real 50x50 white pixel PNG to run through sharp extracts/composites
    const blankImage = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const regions = [
      {
        x_min: 0.2,
        y_min: 0.2,
        x_max: 0.6,
        y_max: 0.6,
        type: "text" as const,
        confidence: 0.95,
      },
    ];

    const cleanBuffer = await WatermarkInpaintingService.inpaint(blankImage, regions);
    expect(cleanBuffer).toBeInstanceOf(Buffer);

    const cleanMetadata = await sharp(cleanBuffer).metadata();
    expect(cleanMetadata.width).toBe(50);
    expect(cleanMetadata.height).toBe(50);
  });
});
