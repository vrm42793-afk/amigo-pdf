"use client";

import { useUser } from "@/hooks/use-user";
import { HardDrive, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";
import { GlassProgress } from "@/components/ui-premium/data-display/glass-progress";
import { GlassBadge } from "@/components/ui-premium/data-display/glass-badge";
import { AnimatedCounter } from "@/components/ui-premium/data-display/animated-counter";

export function StorageWidget() {
  const { profile, isLoading } = useUser();

  if (isLoading) {
    return (
      <GlassCard className="p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-surface-border rounded" />
        <div className="h-2 w-full rounded-full bg-surface-border" />
        <div className="h-3 w-24 bg-surface-border rounded" />
      </GlassCard>
    );
  }

  const used = profile?.storage_used ?? 0;
  const limit = profile?.storage_limit ?? 104857600;
  const usedMB = used / (1024 * 1024);
  const limitMB = limit / (1024 * 1024);
  const pct = Math.min(100, Math.round((used / limit) * 100));

  const isWarning = pct > 85;

  return (
    <GlassCard interactive className="p-5 space-y-4 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <HardDrive className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Storage Used</span>
        </div>
        <GlassBadge variant={isWarning ? "destructive" : "default"} className="uppercase text-[10px] tracking-wider font-bold">
          <Zap className="h-3 w-3 mr-1" />
          {profile?.plan ?? "free"}
        </GlassBadge>
      </div>

      <div className="space-y-3 pt-2">
        <GlassProgress value={pct} indicatorClassName={isWarning ? "bg-destructive" : "bg-accent"} />
        <div className="flex justify-between text-xs font-medium">
          <span className="text-foreground flex items-baseline gap-1">
            <AnimatedCounter value={usedMB} decimals={1} className="text-lg font-bold text-accent" />
            MB
          </span>
          <span className="text-muted-foreground flex items-baseline gap-1">
            <AnimatedCounter value={limitMB} decimals={0} />
            MB
          </span>
        </div>
      </div>

      {isWarning && (
        <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg border border-destructive/20 text-center">
          Running low on storage. Consider upgrading.
        </p>
      )}
    </GlassCard>
  );
}
