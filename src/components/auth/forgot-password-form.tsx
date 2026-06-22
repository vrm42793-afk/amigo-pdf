"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "@/actions/auth";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotInput) => {
    setIsLoading(true);
    try {
      const res = await forgotPassword(data);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Password reset email sent!");
        setIsSuccess(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center p-6 bg-card border border-border rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-primary mb-2">Check your email</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We have sent a password reset link to your email address.
        </p>
        <Link href="/login" className="text-xs text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Send Reset Link
      </Button>

      <div className="text-center">
        <Link href="/login" className="text-xs text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
