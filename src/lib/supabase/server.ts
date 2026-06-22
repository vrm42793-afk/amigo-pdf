import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
      throw new Error("Missing Supabase environment variables");
    }
    return createServerClient<Database>("https://placeholder.supabase.co", "placeholder", {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Partial<ResponseCookie> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // This catch block handles cases where setAll is called inside Server Components.
          // In Next.js, cookies cannot be set during Server Component rendering.
          // This is expected and safe to suppress as long as middleware refreshes sessions.
        }
      },
    },
  });
}
