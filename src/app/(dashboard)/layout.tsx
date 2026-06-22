import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MobileUploadFab } from "@/components/mobile/mobile-upload-fab";

export const dynamic = "force-dynamic";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { MobileNav } from "@/components/dashboard/mobile-nav";
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
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center">
            <MobileNav />
            <div className="md:hidden flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs">
                A
              </span>
              <span className="text-sm font-bold tracking-tight">AMIGO</span>
            </div>
          </div>
          <ProfileDropdown />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {children}
          <MobileUploadFab />
        </main>
      </div>
    </div>
  );
}
