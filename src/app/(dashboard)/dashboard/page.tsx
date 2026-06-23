"use client";

import Link from "next/link";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { RecentFilesWidget } from "@/components/dashboard/recent-files-widget";
import { StorageWidget } from "@/components/dashboard/storage-widget";
import { useUser } from "@/hooks/use-user";
import { motion, Variants } from "framer-motion";
import { GlassCard } from "@/components/ui-premium/surfaces/glass-card";
import { GlassButton } from "@/components/ui-premium/inputs/glass-button";
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
    color: "from-violet-500/20 to-purple-500/20 text-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
  },
  {
    label: "Summarize",
    description: "Generate AI summary",
    icon: Brain,
    href: "/ai/summarize",
    color: "from-blue-500/20 to-cyan-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
  },
  {
    label: "Flashcards",
    description: "Auto-generate cards",
    icon: BookOpen,
    href: "/ai/flashcards",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
  },
  {
    label: "Quiz",
    description: "Test your knowledge",
    icon: HelpCircle,
    href: "/ai/quiz",
    color: "from-amber-500/20 to-orange-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  },
];

const advancedFeatures = [
  { label: "AI Notes", description: "Structured notes", icon: StickyNote, href: "/ai/notes" },
  { label: "Mind Map", description: "Visualize concepts", icon: GitFork, href: "/ai/mindmap" },
  { label: "Mock Interview", description: "AI practice", icon: Mic, href: "/ai/interview" },
  { label: "Exam Generator", description: "Create exams", icon: ClipboardList, href: "/ai/exam-generator" },
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function DashboardPage() {
  const { profile, isLoading } = useUser();

  const firstName = profile?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-8 pb-10"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isLoading ? "Loading..." : `${greeting}, ${firstName} 👋`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a document to unlock the power of AI.
          </p>
        </div>
        <Link href="/dashboard/files" className="hidden sm:inline-flex">
          <GlassButton variant="ghost" size="sm" className="text-accent gap-2">
            View all files <ArrowRight className="h-4 w-4" />
          </GlassButton>
        </Link>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <UploadWidget />
          <RecentFilesWidget />
        </motion.div>

        {/* Right Column */}
        <motion.div variants={itemVariants} className="space-y-6">
          <StorageWidget />

          {/* Question Bank quick link using GlassCard */}
          <GlassCard interactive className="p-5 space-y-4 group">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Database className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">Question Bank</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build and review your personal question bank extracted dynamically from any document.
            </p>
            <Link href="/ai/question-bank" className="block pt-2">
              <GlassButton variant="secondary" size="sm" className="w-full text-xs gap-2">
                Open Question Bank <ArrowRight className="h-3.5 w-3.5" />
              </GlassButton>
            </Link>
          </GlassCard>
        </motion.div>
      </div>

      {/* AI Features */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">AI Intelligence</h2>
          <span className="text-xs font-medium bg-surface-hover px-2 py-0.5 rounded-full text-muted-foreground ml-2 border border-surface-border">
            Select a document first
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <GlassCard interactive className="p-5 flex flex-col h-full hover:-translate-y-1">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 ${action.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{action.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </GlassCard>
              </Link>
            );
          })}
        </div>
        
        {/* Advanced Features Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {advancedFeatures.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="glass-panel hover:bg-surface-hover rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer group border border-surface-border">
                  <div className="p-2 rounded-lg bg-surface border border-surface-border group-hover:border-accent/30">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{action.label}</h4>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* PDF Tools */}
      <motion.div variants={itemVariants} className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">PDF Tools</h2>
          <Link href="/tools" className="ml-auto">
            <GlassButton variant="ghost" size="sm" className="text-xs">
              See all
            </GlassButton>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {pdfTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <div className="glass-panel group flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-surface-hover hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-surface border border-surface-border flex items-center justify-center group-hover:border-accent/50 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.2)] transition-all">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground text-center leading-tight">
                    {tool.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
