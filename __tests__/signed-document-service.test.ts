/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import { SignedDocumentService } from "@/server/signature/signed-document-service";
import { PlacedStamp } from "@/types/signature/signature.types";

// Mock Supabase Server Client
let mockResolveValue: any = { data: null, error: null };

const queryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  then: vi.fn((resolve) => resolve(mockResolveValue)),
};

queryBuilder.select.mockReturnValue(queryBuilder);
queryBuilder.eq.mockReturnValue(queryBuilder);
queryBuilder.order.mockReturnValue(queryBuilder);
queryBuilder.limit.mockReturnValue(queryBuilder);
queryBuilder.single.mockImplementation(() => Promise.resolve(mockResolveValue));
queryBuilder.maybeSingle.mockImplementation(() => Promise.resolve(mockResolveValue));
queryBuilder.insert.mockReturnValue(queryBuilder);
queryBuilder.update.mockReturnValue(queryBuilder);

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
      secureUrl: "https://cloudinary.com/signed.pdf",
      publicId: "signed-asset-uuid",
      bytes: 5000,
      format: "pdf",
      resourceType: "raw",
    })
  ),
}));

describe("SignedDocumentService Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveValue = { data: null, error: null };
  });

  it("should successfully sign a PDF document and append the certificate page", async () => {
    // 1. Create a real blank PDF buffer using pdf-lib
    const originalPdfDoc = await PDFDocument.create();
    originalPdfDoc.addPage([612, 792]);
    const pdfBytes = await originalPdfDoc.save();

    // 2. Minimal valid 1x1 pixel transparent PNG buffer for signature testing
    const signaturePngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );

    // 3. Mock global fetch: returns PDF bytes for the document, PNG bytes for the signature
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("signature-template")) {
        const slicedPng = signaturePngBytes.buffer.slice(
          signaturePngBytes.byteOffset,
          signaturePngBytes.byteOffset + signaturePngBytes.byteLength
        );
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(slicedPng),
        });
      }
      const slicedPdf = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      );
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(slicedPdf),
      });
    });
    global.fetch = mockFetch as any;

    // 4. Mock database returns for:
    // - File query: files table
    // - Profile query: users table
    // - Insert query: signed_documents table
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "files") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "file-123",
                      name: "test.pdf",
                      cloudinary_secure_url: "https://cloudinary.com/test.pdf",
                    },
                    error: null,
                  }),
              }),
            }),
          }),
        } as any;
      }
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    name: "John Doe",
                    email: "john@example.com",
                  },
                  error: null,
                }),
            }),
          }),
        } as any;
      }
      // For signed_documents insert
      return queryBuilder;
    });

    const mockSignedDocInsertResult = {
      id: "signed-doc-id-999",
      user_id: "user-123",
      file_id: "file-123",
      signed_url: "https://cloudinary.com/signed.pdf",
      document_hash: "dummy-hash",
      page_count: 2,
      signature_count: 1,
    };
    queryBuilder.single.mockResolvedValue({ data: mockSignedDocInsertResult, error: null });

    // 5. Placed stamp payload
    const stamps: PlacedStamp[] = [
      {
        id: "placed-stamp-1",
        type: "signature",
        pageNumber: 1,
        x: 100,
        y: 150,
        width: 120,
        height: 40,
        value: "https://cloudinary.com/signature-template.png",
      },
    ];

    const result = await SignedDocumentService.signDocument({
      userId: "user-123",
      fileId: "file-123",
      stamps,
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 TestBrowser",
    });

    // 6. Assertions
    expect(result.id).toBe("signed-doc-id-999");
    expect(result.page_count).toBe(2); // original 1 page + 1 certificate page
    expect(result.signature_count).toBe(1);

    // Verify insert was called on signed_documents
    expect(mockSupabase.from).toHaveBeenCalledWith("signed_documents");
    expect(queryBuilder.insert).toHaveBeenCalled();
  });
});
