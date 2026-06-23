"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const GlassProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string
  }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-surface border border-surface-border backdrop-blur-md",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      asChild
    >
      <motion.div
        layoutId="progress-indicator"
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40 opacity-50" />
      </motion.div>
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
GlassProgress.displayName = ProgressPrimitive.Root.displayName

export { GlassProgress }
