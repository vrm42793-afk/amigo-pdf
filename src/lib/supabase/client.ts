import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
      throw new Error("Missing Supabase environment variables");
    }
    return createBrowserClient<Database>("https://placeholder.supabase.co", "placeholder");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};
