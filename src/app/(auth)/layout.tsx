"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 glass rounded-2xl p-8 shadow-xl border border-border/50"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xl shadow-lg transition-transform group-hover:scale-105">
              A
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              AMIGO <span className="text-primary font-black">PDF</span>
            </span>
          </Link>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
