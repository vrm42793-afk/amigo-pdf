"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AuroraBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-background">
      {/* Gold Orb */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen opacity-20 dark:opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0) 70%)",
          filter: "blur(300px)",
          willChange: "transform, filter",
        }}
        animate={{
          x: ["0%", "20%", "0%"],
          y: ["0%", "10%", "0%"],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blue Orb */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen opacity-20 dark:opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0) 70%)",
          filter: "blur(350px)",
          willChange: "transform, filter",
        }}
        animate={{
          x: ["0%", "-15%", "0%"],
          y: ["0%", "-20%", "0%"],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Purple Orb */}
      <motion.div
        className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full mix-blend-screen opacity-15 dark:opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0) 70%)",
          filter: "blur(250px)",
          willChange: "transform, filter",
        }}
        animate={{
          x: ["0%", "25%", "0%"],
          y: ["0%", "15%", "0%"],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
