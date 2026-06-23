import * as React from "react"

import { cn } from "@/lib/utils"

export type GlassInputProps = React.InputHTMLAttributes<HTMLInputElement>

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary focus-visible:border-secondary backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassInput.displayName = "GlassInput"

export { GlassInput }
