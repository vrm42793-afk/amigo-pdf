import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const glassBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-xl",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/20 text-primary shadow hover:bg-primary/30",
        secondary:
          "border-transparent bg-secondary/20 text-secondary hover:bg-secondary/30",
        destructive:
          "border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30",
        success:
          "border-transparent bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30",
        outline: "text-foreground border-surface-border bg-surface",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassBadgeVariants> {}

function GlassBadge({ className, variant, ...props }: GlassBadgeProps) {
  return (
    <div className={cn(glassBadgeVariants({ variant }), className)} {...props} />
  )
}

export { GlassBadge, glassBadgeVariants }
