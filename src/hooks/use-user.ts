"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["users"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["users"]["Update"];

export function useUser() {
  const { profile, user, isLoading, refetchProfile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onMutate: async (newUpdates) => {
      await queryClient.cancelQueries({ queryKey: ["userProfile", user?.id] });
      const previousProfile = queryClient.getQueryData<Profile>(["userProfile", user?.id]);

      if (previousProfile) {
        queryClient.setQueryData<Profile>(["userProfile", user?.id], {
          ...previousProfile,
          ...newUpdates,
        } as Profile);
      }

      return { previousProfile };
    },
    onError: (_err, _newUpdates, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["userProfile", user?.id], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
    },
  });

  return {
    user,
    profile,
    isLoading,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    refetchProfile,
  };
}
