/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RevisionService } from "@/server/study/revision-service";
import { ExamService } from "@/server/study/exam-service";
import { MindMapService } from "@/server/study/mindmap-service";
import { SpacedRepetitionService } from "@/server/study/spaced-repetition-service";
import { GeminiService } from "@/lib/gemini/gemini-service";

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
};
queryBuilder.select.mockReturnValue(queryBuilder);
queryBuilder.eq.mockReturnValue(queryBuilder);
queryBuilder.order.mockReturnValue(queryBuilder);
queryBuilder.limit.mockReturnValue(queryBuilder);
queryBuilder.insert.mockReturnValue(queryBuilder);
queryBuilder.update.mockReturnValue(queryBuilder);
queryBuilder.single.mockImplementation(() => Promise.resolve(mockResolveValue));
queryBuilder.maybeSingle.mockImplementation(() => Promise.resolve(mockResolveValue));

const mockSupabase = {
  from: vi.fn(() => queryBuilder),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock Document Processor to avoid running real parsing during tests
vi.mock("@/lib/gemini/document-processor", () => ({
  DocumentProcessor: {
    ensureDocumentProcessed: vi.fn(() => Promise.resolve()),
  },
}));

// Mock Gemini Service
vi.mock("@/lib/gemini/gemini-service", () => ({
  GeminiService: {
    generateText: vi.fn(() =>
      Promise.resolve({
        text: "Sample generated text output",
        tokensInput: 100,
        tokensOutput: 50,
      })
    ),
    generateJson: vi.fn(() =>
      Promise.resolve({
        text: JSON.stringify({
          title: "Parsed AI Mock Exam",
          duration_minutes: 120,
          questions: [
            {
              marks: 5,
              question_text: "Explain Cosine Similarity.",
              marking_guide: "Explain vectors and cosine calculation.",
              page_reference: 2,
            },
          ],
        }),
        tokensInput: 150,
        tokensOutput: 80,
      })
    ),
  },
}));

describe("Study Intelligence Suite Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveValue = { data: null, error: null };
  });

  describe("RevisionService & MindMapService", () => {
    it("should successfully generate revision study notes and cache them", async () => {
      // Mock DB return for file ownership
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "files") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: { id: "file-999", name: "lectures.pdf" },
                      error: null,
                    }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "study_notes") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }), // no cache
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "notes-001",
                      user_id: "user-777",
                      file_id: "file-999",
                      type: "unit_notes",
                      title: "Unit-wise Notes",
                      content: "Sample generated text output",
                    },
                    error: null,
                  }),
              }),
            }),
          } as any;
        }
        if (table === "document_chunks") {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [{ content: "Chunk 1 content" }], error: null }),
              }),
            }),
          } as any;
        }
        return queryBuilder;
      });

      const note = await RevisionService.getRevisionNotes("user-777", "file-999", "unit_notes");
      expect(note.id).toBe("notes-001");
      expect(note.content).toBe("Sample generated text output");
      expect(GeminiService.generateText).toHaveBeenCalled();
    });

    it("should clean markdown fences when generating Mermaid mindmap diagram", async () => {
      vi.mocked(GeminiService.generateText).mockResolvedValueOnce({
        text: "```mermaid\nmindmap\n  root((Subject))\n    Concept\n```",
        tokensInput: 50,
        tokensOutput: 20,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "files") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: { id: "file-999", name: "lectures.pdf" },
                      error: null,
                    }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "study_notes") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }), // cache miss
                }),
              }),
            }),
            insert: (payload: any) => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "notes-002",
                      type: "mindmap",
                      content: payload.content, // check if content is cleaned
                    },
                    error: null,
                  }),
              }),
            }),
          } as any;
        }
        if (table === "document_chunks") {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [{ content: "Content" }], error: null }),
              }),
            }),
          } as any;
        }
        return queryBuilder;
      });

      const mindmap = await MindMapService.getMindMap("user-777", "file-999");
      expect(mindmap.content).toBe("mindmap\n  root((Subject))\n    Concept");
    });
  });

  describe("ExamService JSON Mode compiler", () => {
    it("should compile a mock exam and individual questions from parsed JSON structure", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "files") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: { id: "file-999", name: "lectures.pdf" },
                      error: null,
                    }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "exams") {
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "exam-111",
                      title: "Mock Exam",
                      duration_minutes: 120,
                    },
                    error: null,
                  }),
              }),
            }),
          } as any;
        }
        if (table === "exam_questions") {
          return {
            insert: () => ({
              select: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "q-1",
                      exam_id: "exam-111",
                      marks: 5,
                      question_text: "Explain Cosine Similarity.",
                      marking_guide: "Explain vectors and cosine calculation.",
                      page_reference: 2,
                    },
                  ],
                  error: null,
                }),
            }),
          } as any;
        }
        if (table === "document_chunks") {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [{ content: "Content" }], error: null }),
              }),
            }),
          } as any;
        }
        return queryBuilder;
      });

      const result = await ExamService.generateExam("user-777", "file-999", "Mock Exam");
      expect(result.exam.id).toBe("exam-111");
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].marks).toBe(5);
      expect(result.questions[0].question_text).toContain("Cosine Similarity");
    });
  });

  describe("SpacedRepetitionService SuperMemo-2 calculations", () => {
    it("should successfully calculate next repetition interval for rating 4 (correct)", async () => {
      // First review
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "flashcard_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }), // first check is null
                }),
              }),
            }),
            insert: (payload: any) => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "rev-999",
                      user_id: "user-777",
                      flashcard_id: "flashcard-001",
                      repetitions: payload.repetitions,
                      interval_days: payload.interval_days,
                      ease_factor: payload.ease_factor,
                    },
                    error: null,
                  }),
              }),
            }),
          } as any;
        }
        return queryBuilder;
      });

      const firstReview = await SpacedRepetitionService.submitReview("user-777", "flashcard-001", 4);
      
      expect(firstReview.repetitions).toBe(1);
      expect(firstReview.interval_days).toBe(1);
      expect(firstReview.ease_factor).toBeGreaterThan(1.3);

      // Second review (mocking existing review parameters)
      const existingState = {
        id: "rev-123",
        user_id: "user-777",
        flashcard_id: "flashcard-001",
        repetitions: 1,
        interval_days: 1,
        ease_factor: 2.5,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "flashcard_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: existingState, error: null }),
                }),
              }),
            }),
            update: (payload: any) => ({
              eq: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        repetitions: payload.repetitions, // should be 2
                        interval_days: payload.interval_days, // should be 6
                        ease_factor: payload.ease_factor,
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          } as any;
        }
        return queryBuilder;
      });

      const secondReview = await SpacedRepetitionService.submitReview("user-777", "flashcard-001", 4);
      expect(secondReview.repetitions).toBe(2);
      expect(secondReview.interval_days).toBe(6);
    });

    it("should reset repetitions and set interval to 1 day for rating 1 (forgetful/blackout)", async () => {
      const existingState = {
        id: "rev-123",
        user_id: "user-777",
        flashcard_id: "flashcard-001",
        repetitions: 4,
        interval_days: 15,
        ease_factor: 2.6,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "flashcard_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: existingState, error: null }),
                }),
              }),
            }),
            update: (payload: any) => ({
              eq: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        repetitions: payload.repetitions, // should be reset to 0
                        interval_days: payload.interval_days, // should be 1
                        ease_factor: payload.ease_factor, // adjusted lower
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          } as any;
        }
        return queryBuilder;
      });

      const failedReview = await SpacedRepetitionService.submitReview("user-777", "flashcard-001", 1);
      expect(failedReview.repetitions).toBe(0);
      expect(failedReview.interval_days).toBe(1);
      expect(failedReview.ease_factor).toBeLessThan(2.6);
    });
  });
});
