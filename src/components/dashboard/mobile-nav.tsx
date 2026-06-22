"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Files,
  MessageSquare,
  BookOpen,
  StickyNote,
  Wrench,
  HelpCircle,
  FileText,
  Folder,
  Search,
  Database,
  Users
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/files", label: "My Files", icon: Files },
  { href: "/dashboard/collections", label: "Collections", icon: Folder },
  { href: "/dashboard/search", label: "Search Workspace", icon: Search },
  { href: "/ai/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/ai/summarize", label: "AI Summaries", icon: FileText },
  { href: "/ai/notes", label: "AI Notes", icon: StickyNote },
  { href: "/ai/flashcards", label: "Flashcards", icon: BookOpen },
  { href: "/ai/quiz", label: "Quiz Generator", icon: HelpCircle },
  { href: "/ai/question-bank", label: "Question Bank", icon: Database },
  { href: "/dashboard/collaboration", label: "Collaboration", icon: Users },
  { href: "/tools/merge", label: "PDF Tools", icon: Wrench },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-72 sm:max-w-xs flex flex-col p-0">
        <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
        <div className="flex h-14 items-center gap-2 border-b border-border px-4 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-sm">
            A
          </span>
          <span className="text-sm font-bold tracking-tight">
            AMIGO <span className="text-primary">PDF</span>
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
