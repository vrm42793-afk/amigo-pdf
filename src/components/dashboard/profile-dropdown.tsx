"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/actions/auth";
import { useTheme } from "next-themes";
import { LogOut, User, Settings, Database, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  GlassDropdown,
  GlassDropdownTrigger,
  GlassDropdownContent,
  GlassDropdownItem,
  GlassDropdownLabel,
  GlassDropdownSeparator,
} from "@/components/ui-premium/inputs/glass-dropdown";
import { GlassProgress } from "@/components/ui-premium/data-display/glass-progress";
import { GlassBadge } from "@/components/ui-premium/data-display/glass-badge";

export function ProfileDropdown() {
  const { profile, user, isLoading } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      const res = await signOut();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Signed out successfully");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast.error("Failed to sign out");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="h-10 w-10 rounded-xl bg-surface border border-surface-border animate-pulse" />
    );
  }

  const name = profile?.name || user.email || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const storageUsedMB = profile ? (profile.storage_used / (1024 * 1024)).toFixed(1) : "0.0";
  const storageLimitMB = profile ? (profile.storage_limit / (1024 * 1024)).toFixed(0) : "100";
  const storagePercentage = profile ? Math.min(100, Math.round((profile.storage_used / profile.storage_limit) * 100)) : 0;

  return (
    <GlassDropdown>
      <GlassDropdownTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-sm font-semibold text-accent transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer shadow-sm"
        >
          {profile?.avatar ? (
            <Image src={profile.avatar} alt={name} width={40} height={40} className="h-full w-full object-cover rounded-xl" />
          ) : (
            <span>{initials}</span>
          )}
        </button>
      </GlassDropdownTrigger>
      
      <GlassDropdownContent align="end" className="w-72 mt-2">
        <div className="flex items-center gap-3 p-2">
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-surface-border bg-surface flex items-center justify-center text-accent font-bold">
            {profile?.avatar ? (
              <Image src={profile.avatar} alt={name} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate">{name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            <div className="mt-1">
              <GlassBadge variant="default" className="text-[10px] py-0 px-1.5 h-4">
                {profile?.plan || "free"} plan
              </GlassBadge>
            </div>
          </div>
        </div>

        <GlassDropdownSeparator />

        <div className="p-3">
          <div className="flex justify-between text-xs font-medium mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-accent" /> Storage
            </span>
            <span className="text-foreground">{storageUsedMB}MB / {storageLimitMB}MB</span>
          </div>
          <GlassProgress value={storagePercentage} className="h-2" />
        </div>

        <GlassDropdownSeparator />

        <div className="p-1">
          <GlassDropdownItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-accent" />
            <span>My Profile</span>
          </GlassDropdownItem>

          <GlassDropdownItem onClick={() => router.push("/dashboard")}>
            <Settings className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-accent" />
            <span>Workspace Settings</span>
          </GlassDropdownItem>
        </div>

        <GlassDropdownSeparator />

        {/* Theme Toggles */}
        {mounted && (
          <div className="px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-2 block">Theme</span>
            <div className="flex bg-surface-hover rounded-lg border border-surface-border p-1 gap-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 flex justify-center p-1.5 rounded-md transition-colors ${theme === "light" ? "bg-surface border border-surface-border text-accent shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-surface/50"}`}
                title="Light Mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex-1 flex justify-center p-1.5 rounded-md transition-colors ${theme === "system" ? "bg-surface border border-surface-border text-accent shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-surface/50"}`}
                title="System Theme"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 flex justify-center p-1.5 rounded-md transition-colors ${theme === "dark" ? "bg-surface border border-surface-border text-accent shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-surface/50"}`}
                title="Dark Mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <GlassDropdownSeparator />

        <div className="p-1">
          <GlassDropdownItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </GlassDropdownItem>
        </div>
      </GlassDropdownContent>
    </GlassDropdown>
  );
}
