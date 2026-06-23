"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/actions/auth";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, Settings, Database, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProfileDropdown() {
  const { profile, user, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-sm font-semibold text-primary transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
      >
        {profile?.avatar ? (
          <Image src={profile.avatar} alt={name} width={32} height={32} className="h-full w-full object-cover rounded-full" />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 origin-top-right border-2 border-border bg-card p-2 focus:outline-none z-50"
          >
            <div className="px-3 py-2 border-b border-border mb-2">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <span className="inline-flex mt-1 items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary uppercase">
                {profile?.plan || "free"} plan
              </span>
            </div>

            <div className="px-3 py-2 border-b border-border mb-2">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Database className="h-3.5 w-3.5" /> Storage
                </span>
                <span className="text-foreground">{storageUsedMB}MB / {storageLimitMB}MB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/profile");
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </button>

              {/* Theme Toggle Sub-menu */}
              {mounted && (
                <div className="px-3 py-1 flex items-center justify-between mt-1 border-t border-border pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">Theme</span>
                  <div className="flex bg-muted rounded-md border border-border">
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-1.5 transition-colors ${theme === "light" ? "bg-background text-foreground border border-border" : "text-muted-foreground hover:text-foreground"}`}
                      title="Light Mode"
                    >
                      <Sun className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`p-1.5 transition-colors ${theme === "system" ? "bg-background text-foreground border border-border" : "text-muted-foreground hover:text-foreground"}`}
                      title="System Theme"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-1.5 transition-colors ${theme === "dark" ? "bg-background text-foreground border border-border" : "text-muted-foreground hover:text-foreground"}`}
                      title="Dark Mode"
                    >
                      <Moon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard");
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Workspace Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
