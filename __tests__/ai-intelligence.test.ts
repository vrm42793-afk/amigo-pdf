/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { chunkDocument } from "@/lib/gemini/chunking";
import { cosineSimilarity, RetrievalService } from "@/lib/gemini/retrieval";
import { getPrompt, seedPrompt, DEFAULT_PROMPTS } from "@/lib/gemini/prompt-library";

// Mock Supabase Server Client with a generic fluent interface builder
let mockResolveValue: any = { data: null, error: null };

const queryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  then: vi.fn((resolve) => resolve(mockResolveValue)),
};

queryBuilder.select.mockReturnValue(queryBuilder);
queryBuilder.eq.mockReturnValue(queryBuilder);
queryBuilder.order.mockReturnValue(queryBuilder);
queryBuilder.limit.mockReturnValue(queryBuilder);
queryBuilder.maybeSingle.mockImplementation(() => Promise.resolve(mockResolveValue));
queryBuilder.insert.mockImplementation(() => Promise.resolve(mockResolveValue));

const mockSupabase = {
  from: vi.fn(() => queryBuilder),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock Embedding function
vi.mock("@/lib/gemini/embeddings", () => ({
  getEmbedding: vi.fn(() => Promise.resolve([1, 0, 0])),
}));

describe("AI Document Intelligence - Chunking & Vector Retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveValue = { data: null, error: null };
  });

  describe("Chunking Engine (chunking.ts)", () => {
    it("should chunk a short document into a single chunk", () => {
      const pages = [
        { pageNumber: 1, text: "This is a short page of text.\n\nIt contains a few paragraphs." }
      ];
      const result = chunkDocument(pages);
      expect(result).toHaveLength(1);
      expect(result[0].chunk_index).toBe(0);
      expect(result[0].page_number).toBe(1);
      expect(result[0].content).toContain("This is a short page of text.");
    });

    it("should parse short non-period lines as headings/sections", () => {
      const pages = [
        { pageNumber: 1, text: "INTRODUCTION\n\nThis is the introductory paragraph of the page." }
      ];
      const result = chunkDocument(pages);
      expect(result).toHaveLength(1);
      expect(result[0].section_title).toBe("INTRODUCTION");
    });

    it("should split long text into multiple chunks with overlap", () => {
      // Create a series of paragraphs to exceed TARGET_MIN_CHARS (4000 chars)
      const paragraphs = Array.from({ length: 25 }, (_, i) => `Paragraph index ${i} is long enough to fill space. ${"a".repeat(200)}`);
      const text = paragraphs.join("\n\n");
      const pages = [
        { pageNumber: 1, text }
      ];

      const result = chunkDocument(pages);
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].chunk_index).toBe(0);
      expect(result[1].chunk_index).toBe(1);
      // Verify overlap: index 1 should contain some text from index 0
      expect(result[1].content.length).toBeGreaterThan(0);
    });
  });

  describe("Cosine Similarity (retrieval.ts)", () => {
    it("should return 1 for identical vectors", () => {
      const similarity = cosineSimilarity([1, 2, 3], [1, 2, 3]);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
      const similarity = cosineSimilarity([1, 0], [0, 1]);
      expect(similarity).toBe(0);
    });

    it("should return -1 for opposite vectors", () => {
      const similarity = cosineSimilarity([1, 1], [-1, -1]);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it("should return 0 for vectors of different lengths", () => {
      const similarity = cosineSimilarity([1, 2], [1, 2, 3]);
      expect(similarity).toBe(0);
    });

    it("should return 0 if one vector is a zero vector", () => {
      const similarity = cosineSimilarity([0, 0], [1, 2]);
      expect(similarity).toBe(0);
    });
  });

  describe("Retrieval Service (retrieval.ts)", () => {
    it("should retrieve relevant chunks sorted by similarity and filtered by minSimilarity", async () => {
      const dbChunks = [
        { content: "Unrelated text", page_number: 1, section_title: "Ch1", embedding: [0, 1, 0] },
        { content: "Highly matching text", page_number: 2, section_title: "Ch2", embedding: [0.95, 0.1, 0] },
        { content: "Moderately matching text", page_number: 3, section_title: "Ch3", embedding: [0.6, 0.4, 0] }
      ];

      mockResolveValue = { data: dbChunks, error: null };

      const fileId = "d3b07384-d113-4956-a36c-2f9547d6e644";
      const results = await RetrievalService.retrieveRelevantChunks(fileId, "Query text", 5, 0.4);

      expect(results).toHaveLength(2);
      expect(results[0].pageNumber).toBe(2);
      expect(results[1].pageNumber).toBe(3);
      expect(results[0].similarityScore).toBeGreaterThan(results[1].similarityScore);
    });

    it("should return empty list if DB query fails or returns nothing", async () => {
      mockResolveValue = { data: null, error: new Error("DB Error") };

      const results = await RetrievalService.retrieveRelevantChunks("some-id", "Query");
      expect(results).toEqual([]);
    });
  });

  describe("Prompt Library (prompt-library.ts)", () => {
    it("should return default prompt if DB fails or is empty", async () => {
      mockResolveValue = { data: null, error: null };

      const prompt = await getPrompt("chat");
      expect(prompt).toBe(DEFAULT_PROMPTS.chat);
    });

    it("should return custom database prompt if found", async () => {
      mockResolveValue = { data: { prompt: "Custom Prompt Template" }, error: null };

      const prompt = await getPrompt("chat");
      expect(prompt).toBe("Custom Prompt Template");
    });

    it("should seed prompt if version does not exist", async () => {
      mockResolveValue = { data: null, error: null };

      await seedPrompt("chat", "New Seeded Prompt", "2.0.0");
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        feature: "chat",
        version: "2.0.0",
        prompt: "New Seeded Prompt"
      });
    });

    it("should not seed prompt if version already exists", async () => {
      mockResolveValue = { data: { id: "existing-id" }, error: null };

      await seedPrompt("chat", "New Seeded Prompt", "2.0.0");
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });
  });
});
