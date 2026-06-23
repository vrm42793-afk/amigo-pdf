"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./glass-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GlassButton } from "../inputs/glass-button";

interface ToolPageLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function ToolPageLayout({
  title,
  description,
  icon,
  children,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: ToolPageLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      <div className="pt-2">
        <Link href={backHref} className="inline-block mb-4">
          <GlassButton variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </GlassButton>
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-accent/30 shadow-[0_0_15px_rgba(212,175,55,0.2)] flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>

      <GlassCard className="p-6 md:p-8 min-h-[400px]">
        {children}
      </GlassCard>
    </motion.div>
  );
}
