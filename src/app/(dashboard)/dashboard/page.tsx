"use client";

import Link from "next/link";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { RecentFilesWidget } from "@/components/dashboard/recent-files-widget";
import { StorageWidget } from "@/components/dashboard/storage-widget";
import { useUser } from "@/hooks/use-user";
import {
  MessageSquare,
  BookOpen,
  StickyNote,
  HelpCircle,
  Brain,
  GitFork,
  ClipboardList,
  Mic,
  Database,
  Merge,
  Scissors,
  ScanText,
  PenLine,
  Minimize2,
  Swords,
  ArrowRight,
  Sparkles,
  Droplet,
  FileImage,
} from "lucide-react";

const quickActions = [
  {
    label: "AI Chat",
    description: "Chat with your PDF",
    icon: MessageSquare,
    href: "/ai/chat",
    color: "from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800",
    iconColor: "text-violet-500",
  },
  {
    label: "Summarize",
    description: "Generate AI summary",
    icon: Brain,
    href: "/ai/summarize",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
  {
    label: "Flashcards",
    description: "Auto-generate cards",
    icon: BookOpen,
    href: "/ai/flashcards",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-500",
  },
  {
    label: "Quiz",
    description: "Test your knowledge",
    icon: HelpCircle,
    href: "/ai/quiz",
    color: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
  },
  {
    label: "AI Notes",
    description: "Structured study notes",
    icon: StickyNote,
    href: "/ai/notes",
    color: "from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-800",
    iconColor: "text-pink-500",
  },
  {
    label: "Mind Map",
    description: "Visualize concepts",
    icon: GitFork,
    href: "/ai/mindmap",
    color: "from-indigo-500/10 to-blue-500/10 border-indigo-200 dark:border-indigo-800",
    iconColor: "text-indigo-500",
  },
  {
    label: "Mock Interview",
    description: "AI-powered practice",
    icon: Mic,
    href: "/ai/interview",
    color: "from-teal-500/10 to-green-500/10 border-teal-200 dark:border-teal-800",
    iconColor: "text-teal-500",
  },
  {
    label: "Exam Generator",
    description: "Create exam papers",
    icon: ClipboardList,
    href: "/ai/exam-generator",
    color: "from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-500",
  },
];

const pdfTools = [
  { label: "Watermark", icon: Droplet, href: "/tools/watermark" },
  { label: "Converter", icon: FileImage, href: "/tools/converter" },
  { label: "Merge PDFs", icon: Merge, href: "/tools/merge" },
  { label: "Split PDF", icon: Scissors, href: "/tools/split" },
  { label: "Compress", icon: Minimize2, href: "/tools/compress" },
  { label: "OCR Scan", icon: ScanText, href: "/tools/ocr" },
  { label: "Digital Sign", icon: PenLine, href: "/tools/sign" },
  { label: "Quiz Battle", icon: Swords, href: "/tools/quiz-battle/new" },
];

export default function DashboardPage() {
  const { profile, isLoading } = useUser();

  const firstName = profile?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isLoading ? "Loading..." : `${greeting}, ${firstName} 👋`}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload a document to get started with AI-powered insights.
          </p>
        </div>
        <Link
          href="/dashboard/files"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-2"
        >
          View all files <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Upload + Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <UploadWidget />
          <RecentFilesWidget />
        </div>
        <div className="space-y-4">
          <StorageWidget />

          {/* Question Bank quick link */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Question Bank</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Build and review your personal question bank from any document.
            </p>
            <Link
              href="/ai/question-bank"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
            >
              Open Question Bank <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">AI Features</h2>
          <span className="text-xs text-muted-foreground ml-1">Select a document first, then use any tool below</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex flex-col gap-2.5 p-4 rounded-xl border bg-gradient-to-br ${action.color} hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className={`h-8 w-8 rounded-lg bg-background/60 flex items-center justify-center ${action.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* PDF Tools */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">PDF Tools</h2>
          <Link href="/tools" className="text-xs text-primary hover:underline ml-auto">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {pdfTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                  {tool.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
