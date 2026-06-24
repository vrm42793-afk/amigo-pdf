import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateSession } from "@/lib/supabase/proxy";
import { NextRequest } from "next/server";

// Mock Supabase SSR module
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock Next.js Headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Middleware Route Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (pathname: string) => {
    const url = new URL(`http://localhost:3000${pathname}`);
    const req = new NextRequest(url);
    // Mock request cookies as needed
    req.cookies.getAll = () => [];
    req.cookies.set = vi.fn();
    return req;
  };

  it("should redirect unauthenticated users accessing protected dashboard path to login", async () => {
    // Setup mock user fetch to return null session
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = createMockRequest("/dashboard/files");
    const response = await updateSession(req);

    expect(response.status).toBe(307); // Temporary Redirect
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("redirectTo=%2Fdashboard%2Ffiles");
  });

  it("should redirect authenticated users accessing login page to dashboard", async () => {
    // Setup mock user fetch to return valid user session
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user_123", email: "test@example.com" } },
      error: null,
    });

    const req = createMockRequest("/login");
    const response = await updateSession(req);

    expect(response.status).toBe(307); // Temporary Redirect
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("should allow unauthenticated users to access public homepage path", async () => {
    // Setup mock user fetch to return null session
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = createMockRequest("/");
    const response = await updateSession(req);

    // Should return NextResponse.next() which doesn't perform redirect location headers
    expect(response.headers.get("location")).toBeNull();
  });
});
