"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function useSession() {
  const { session, isLoading } = useAuth();
  
  return {
    session,
    isAuthenticated: !!session,
    user: session?.user ?? null,
    isLoading,
  };
}
