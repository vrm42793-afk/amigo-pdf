"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  Brain,
  Shield,
  Zap,
  Users,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  Merge,
  Scissors,
  FileSearch,
  BookOpen,
  MessageSquare,
  PenLine,
  Layers,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Chat",
    description: "Chat with any PDF using Gemini AI. Ask questions, get summaries, and extract insights instantly.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Brain,
    title: "Smart Study Tools",
    description: "Auto-generate flashcards, quizzes, mind maps, and revision notes from your documents.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Merge,
    title: "PDF Merge & Split",
    description: "Combine multiple PDFs or split documents into individual pages with precision.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: FileSearch,
    title: "OCR & Text Extraction",
    description: "Extract text from scanned documents and images with high-accuracy OCR technology.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: PenLine,
    title: "Digital Signatures",
    description: "Sign documents digitally with a full audit trail. Secure, legal, and paperless.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share collections, collaborate with friends, and comment on documents in real time.",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: BookOpen,
    title: "Question Bank",
    description: "Build a personal question bank from your study materials with AI-generated Q&As.",
    color: "from-teal-500 to-green-600",
  },
  {
    icon: MessageSquare,
    title: "Mock Interviews",
    description: "Practice verbal interviews with an AI examiner trained on your own lecture notes.",
    color: "from-yellow-500 to-orange-600",
  },
];

const pdfTools = [
  "Merge PDFs", "Split PDF", "Compress PDF", "Rotate Pages",
  "Reorder Pages", "Extract Pages", "OCR Scan", "Add Watermark",
  "Digital Signature", "Convert to Image", "Extract Text", "Delete Pages",
];

const stats = [
  { value: "40+", label: "Powerful Tools" },
  { value: "AI", label: "Gemini Powered" },
  { value: "100%", label: "Secure & Private" },
  { value: "Free", label: "To Get Started" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AMIGO PDF</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#tools" className="text-sm text-white/60 hover:text-white transition-colors">PDF Tools</a>
            <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-8">
            <Sparkles className="h-3 w-3" />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Your Intelligent{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              PDF Workspace
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Edit, Convert, Sign, Summarize, Chat, Study, and Manage Documents —
            all in one AI-powered platform built for students and professionals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 font-bold text-base transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
            >
              Start for Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 font-semibold text-base text-white/70 hover:text-white transition-all"
            >
              Sign in
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Everything you need,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                powered by AI
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              From document editing to AI-powered studying — AMIGO PDF does it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${feature.color} items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PDF Tools */}
      <section id="tools" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Professional{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                PDF Tools
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              A complete suite of PDF processing tools — fast, secure, and browser-based.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {pdfTools.map((tool) => (
              <div
                key={tool}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-white/70 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all cursor-default"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Simple, transparent{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                pricing
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Free</div>
              <div className="text-5xl font-black mb-1">$0</div>
              <div className="text-white/40 text-sm mb-8">Forever free</div>
              <ul className="space-y-3 mb-8">
                {["100MB storage", "50,000 AI words/month", "All PDF tools", "AI Chat & Summarize", "Basic study tools"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3 rounded-xl border border-white/10 text-center font-semibold text-sm hover:bg-white/5 transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/30 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold">
                  <Star className="h-3 w-3" /> Popular
                </div>
              </div>
              <div className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-3">Pro</div>
              <div className="text-5xl font-black mb-1">$9<span className="text-2xl font-semibold text-white/50">/mo</span></div>
              <div className="text-white/40 text-sm mb-8">Everything in Free, plus:</div>
              <ul className="space-y-3 mb-8">
                {["5GB storage", "Unlimited AI words", "Priority processing", "Quiz Battle multiplayer", "Advanced collaboration", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-center font-bold text-sm transition-all shadow-lg shadow-violet-500/20">
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />
            <Zap className="h-10 w-10 text-violet-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Ready to transform the way you work with PDFs?
            </h2>
            <p className="text-white/50 mb-8 text-lg">
              Join thousands of students and professionals using AMIGO PDF every day.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 font-bold text-base transition-all shadow-2xl shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <FileText className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-sm">AMIGO PDF</span>
          </div>
          <p className="text-white/30 text-sm">© 2025 AMIGO PDF. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-sm text-white/40 hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
