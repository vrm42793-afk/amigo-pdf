"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { withActionError } from "@/lib/action-utils";

export async function login(formData: z.infer<typeof loginSchema>) {
  return withActionError(async () => {
    const validated = loginSchema.safeParse(formData);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function signup(formData: z.infer<typeof signupSchema>) {
  return withActionError(async () => {
    const validated = signupSchema.safeParse(formData);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        data: {
          name: validated.data.name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  });
}

export async function signOut() {
  return withActionError(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function forgotPassword(formData: z.infer<typeof forgotPasswordSchema>) {
  return withActionError(async () => {
    const validated = forgotPasswordSchema.safeParse(formData);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(validated.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  });
}

export async function resetPassword(formData: z.infer<typeof resetPasswordSchema>) {
  return withActionError(async () => {
    const validated = resetPasswordSchema.safeParse(formData);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: validated.data.password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  });
}
