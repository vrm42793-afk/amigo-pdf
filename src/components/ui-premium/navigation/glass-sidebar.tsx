"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface GlassSidebarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export const GlassSidebar = React.forwardRef<HTMLDivElement, GlassSidebarProps>(
  ({ className, isOpen = true, onClose, isMobile = false, children, ...props }, ref) => {
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              />
            )}
            
            <motion.aside
              ref={ref}
              initial={{ x: isMobile ? "-100%" : -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? "-100%" : -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "glass-panel fixed top-4 bottom-4 left-4 z-50 flex w-72 flex-col rounded-2xl overflow-hidden",
                isMobile ? "fixed" : "hidden md:flex",
                className
              )}
              {...props}
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                {children}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }
)
GlassSidebar.displayName = "GlassSidebar"

export const GlassSidebarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { active?: boolean; icon?: React.ReactNode }
>(({ className, active, icon, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active 
          ? "bg-primary/20 text-accent" 
          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        className
      )}
      {...props}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-accent shadow-[0_0_10px_rgba(212,175,55,0.8)]"
        />
      )}
      {icon && (
        <div className={cn("flex-shrink-0 transition-colors", active ? "text-accent" : "group-hover:text-foreground")}>
          {icon}
        </div>
      )}
      <span className="truncate">{children}</span>
    </div>
  )
})
GlassSidebarItem.displayName = "GlassSidebarItem"
