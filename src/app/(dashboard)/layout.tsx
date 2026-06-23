import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MobileUploadFab } from "@/components/mobile/mobile-upload-fab";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export const dynamic = "force-dynamic";

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
  Users,
  Brain,
  Zap,
  GitFork,
  ClipboardList,
  Mic,
  Swords,
  Merge,
  Scissors,
  RotateCcw,
  Minimize2,
  ScanText,
  PenLine,
  AlignJustify,
  Layers,
  Droplet,
  FileImage,
} from "lucide-react";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/files", label: "My Files", icon: Files },
      { href: "/dashboard/collections", label: "Collections", icon: Folder },
      { href: "/dashboard/search", label: "Search", icon: Search },
      { href: "/dashboard/collaboration", label: "Collaboration", icon: Users },
    ],
  },
  {
    label: "AI Features",
    items: [
      { href: "/ai/chat", label: "AI Chat", icon: MessageSquare },
      { href: "/ai/summarize", label: "Summarize", icon: FileText },
      { href: "/ai/notes", label: "Notes", icon: StickyNote },
      { href: "/ai/flashcards", label: "Flashcards", icon: BookOpen },
      { href: "/ai/quiz", label: "Quiz", icon: HelpCircle },
      { href: "/ai/revision", label: "Revision", icon: Brain },
      { href: "/ai/exam-generator", label: "Exam Generator", icon: ClipboardList },
      { href: "/ai/question-bank", label: "Question Bank", icon: Database },
      { href: "/ai/interview", label: "Mock Interview", icon: Mic },
      { href: "/ai/mindmap", label: "Mind Map", icon: GitFork },
    ],
  },
  {
    label: "PDF Tools",
    href: "/tools",
    items: [
      { href: "/tools/watermark", label: "Watermark", icon: Droplet },
      { href: "/tools/converter", label: "Converter", icon: FileImage },
      { href: "/tools/merge", label: "Merge PDFs", icon: Merge },
      { href: "/tools/split", label: "Split PDF", icon: Scissors },
      { href: "/tools/compress", label: "Compress", icon: Minimize2 },
      { href: "/tools/rotate", label: "Rotate", icon: RotateCcw },
      { href: "/tools/reorder", label: "Reorder Pages", icon: AlignJustify },
      { href: "/tools/extract", label: "Extract Pages", icon: Layers },
      { href: "/tools/ocr", label: "OCR Scan", icon: ScanText },
      { href: "/tools/sign", label: "Digital Sign", icon: PenLine },
      { href: "/tools/quiz-battle/new", label: "Quiz Battle", icon: Swords },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm shadow-md shadow-primary/20">
            A
          </div>
          <span className="text-sm font-bold tracking-tight">
            AMIGO <span className="text-primary">PDF</span>
          </span>
          <div className="ml-auto">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              AI
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label}>
              {group.href ? (
                <Link href={group.href} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 hover:text-primary transition-colors flex items-center gap-1 group/header">
                  {group.label}
                </Link>
              ) : (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all group relative"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade banner */}
        <div className="p-3 border-t border-border">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Unlimited AI words, 5GB storage &amp; priority support.
            </p>
            <Link
              href="/pricing"
              className="block text-center text-[11px] font-bold py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6 gap-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs shadow-sm">
                A
              </div>
              <span className="text-sm font-bold tracking-tight">AMIGO PDF</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
            <Link
              href="/dashboard/search"
              className="flex-1 flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground hover:border-primary/30 hover:bg-muted/60 transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              Search files...
              <kbd className="ml-auto text-[10px] bg-background border border-border rounded px-1">⌘K</kbd>
            </Link>
          </div>

          <ProfileDropdown />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {children}
          <MobileUploadFab />
        </main>
      </div>
    </div>
  );
}
