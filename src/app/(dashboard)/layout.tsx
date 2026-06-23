import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MobileUploadFab } from "@/components/mobile/mobile-upload-fab";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { GlassSidebar, GlassSidebarItem } from "@/components/ui-premium/navigation/glass-sidebar";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";

export const dynamic = "force-dynamic";

import {
  LayoutDashboard,
  Files,
  MessageSquare,
  BookOpen,
  StickyNote,
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
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Premium Glass Sidebar */}
      <GlassSidebar>
        <div className="flex h-14 items-center gap-3 px-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-black text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            A
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            AMIGO <span className="text-accent">PDF</span>
          </span>
          <div className="ml-auto">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-accent border border-primary/30">
              AI
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {group.href ? (
                <Link href={group.href} className="px-2 mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">
                  {group.label}
                </Link>
              ) : (
                <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // TODO: determine active state via usePathname in a client component or here?
                  // Since layout is Server Component, we pass active=false to all for now or refactor to client component.
                  // We'll wrap links to make them functional.
                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <GlassSidebarItem icon={<Icon className="h-4 w-4" />}>
                        {item.label}
                      </GlassSidebarItem>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-8 border-t border-surface-border pt-4">
          <div className="glass-panel p-4 space-y-3 rounded-2xl relative overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-2 relative z-10">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold text-foreground">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-muted-foreground relative z-10 leading-relaxed">
              Unlimited AI, 5GB storage & priority support.
            </p>
            <Link href="/pricing" className="block relative z-10">
              <GlassButton variant="default" size="sm" className="w-full text-xs">
                Upgrade Now
              </GlassButton>
            </Link>
          </div>
        </div>
      </GlassSidebar>

      {/* Main Content Area (offset by sidebar width on md screens) */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-[19rem]">
        {/* Floating Glass Header */}
        <div className="p-4 md:p-6 pb-0 z-40">
          <header className="glass-panel flex h-16 items-center justify-between rounded-2xl px-4 md:px-6 shadow-xl">
            <div className="flex items-center gap-3">
              <MobileNav />
              <div className="md:hidden flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-black text-xs shadow-md">
                  A
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground">AMIGO PDF</span>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  className="h-10 w-full rounded-xl border border-surface-border bg-surface/50 pl-10 pr-12 text-sm text-foreground transition-all hover:bg-surface focus:outline-none focus:ring-1 focus:ring-accent backdrop-blur-md"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-surface border border-surface-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10">
          {children}
          <MobileUploadFab />
        </main>
      </div>
    </div>
  );
}
