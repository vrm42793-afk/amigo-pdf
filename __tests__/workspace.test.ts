import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspaceService } from "@/server/workspace/workspace-service";

// Mock Supabase client
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
  delete: vi.fn(),
};
queryBuilder.select.mockReturnValue(queryBuilder);
queryBuilder.eq.mockReturnValue(queryBuilder);
queryBuilder.order.mockReturnValue(queryBuilder);
queryBuilder.limit.mockReturnValue(queryBuilder);
queryBuilder.insert.mockReturnValue(queryBuilder);
queryBuilder.update.mockReturnValue(queryBuilder);
queryBuilder.delete.mockReturnValue(queryBuilder);
queryBuilder.single.mockImplementation(() => Promise.resolve(mockResolveValue));
queryBuilder.maybeSingle.mockImplementation(() => Promise.resolve(mockResolveValue));

const mockSupabase = {
  from: vi.fn(() => queryBuilder),
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("WorkspaceService Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveValue = { data: null, error: null };
  });

  it("should retrieve collections for user", async () => {
    const mockCollections = [
      { id: "col-1", user_id: "user-1", name: "Data Structures", description: "DSA course study notes", icon: "Book", color: "blue" }
    ];
    queryBuilder.order.mockImplementationOnce(() => Promise.resolve({ data: mockCollections, error: null }) as any);

    const result = await WorkspaceService.getCollections("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Data Structures");
  });

  it("should create a collection", async () => {
    const mockCollection = { id: "col-2", user_id: "user-1", name: "DBMS", description: "DBMS course study notes", icon: "Database", color: "green" };
    mockResolveValue = { data: mockCollection, error: null };

    const result = await WorkspaceService.createCollection("user-1", "DBMS", "DBMS course study notes", "Database", "green");
    expect(result.id).toBe("col-2");
    expect(result.name).toBe("DBMS");
  });

  it("should delete a collection", async () => {
    mockResolveValue = { data: null, error: null };
    await expect(WorkspaceService.deleteCollection("user-1", "col-2")).resolves.not.toThrow();
  });

  it("should add an item to collection", async () => {
    // Mock verify collection exists
    mockSupabase.from.mockImplementationOnce((table) => {
      if (table === "collections") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: "col-1" }, error: null })
              })
            })
          })
        } as any;
      }
      return queryBuilder;
    });

    const mockItem = { id: "item-1", collection_id: "col-1", item_type: "file", item_id: "file-1" };
    mockResolveValue = { data: mockItem, error: null };

    const result = await WorkspaceService.addItemToCollection("user-1", "col-1", "file", "file-1");
    expect(result.id).toBe("item-1");
    expect(result.item_type).toBe("file");
  });

  it("should execute global search via RPC", async () => {
    const mockSearchResults = [
      { item_type: "file", item_id: "file-1", title: "lectures.pdf", content_snippet: "cosine similarity", created_at: "2026-06-22" }
    ];
    mockSupabase.rpc.mockResolvedValueOnce({ data: mockSearchResults, error: null });

    const result = await WorkspaceService.globalSearch("user-1", "cosine");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("lectures.pdf");
    expect(result[0].item_type).toBe("file");
  });
});
