"use client";

import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrive, Zap } from "lucide-react";

export function StorageWidget() {
  const { profile, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  const used = profile?.storage_used ?? 0;
  const limit = profile?.storage_limit ?? 104857600;
  const usedMB = (used / (1024 * 1024)).toFixed(1);
  const limitMB = (limit / (1024 * 1024)).toFixed(0);
  const pct = Math.min(100, Math.round((used / limit) * 100));

  const barColor =
    pct > 90
      ? "bg-destructive"
      : pct > 70
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Storage</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary uppercase">
          <Zap className="h-3 w-3" />
          {profile?.plan ?? "free"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{usedMB} MB used</span>
          <span>{limitMB} MB</span>
        </div>
      </div>

      {pct > 85 && (
        <p className="text-xs text-amber-600 font-medium">
          You are running low on storage. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}
