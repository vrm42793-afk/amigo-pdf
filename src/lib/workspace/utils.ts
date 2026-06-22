import {
  Folder,
  Book,
  Code,
  PenTool,
  Database,
  Brain,
  GraduationCap,
  Library,
  LucideIcon
} from "lucide-react";

export const WORKSPACE_ICONS: Record<string, LucideIcon> = {
  Folder,
  Book,
  Code,
  PenTool,
  Database,
  Brain,
  GraduationCap,
  Library,
};

export interface WorkspaceColorPreset {
  name: string;
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  accent: string;
}

export const WORKSPACE_COLORS: Record<string, WorkspaceColorPreset> = {
  blue: {
    name: "Blue",
    bg: "bg-blue-500/10",
    text: "text-blue-500 dark:text-blue-400",
    border: "border-blue-500/20",
    hoverBg: "hover:bg-blue-500/20",
    accent: "bg-blue-500",
  },
  green: {
    name: "Green",
    bg: "bg-green-500/10",
    text: "text-green-500 dark:text-green-400",
    border: "border-green-500/20",
    hoverBg: "hover:bg-green-500/20",
    accent: "bg-green-500",
  },
  purple: {
    name: "Purple",
    bg: "bg-purple-500/10",
    text: "text-purple-500 dark:text-purple-400",
    border: "border-purple-500/20",
    hoverBg: "hover:bg-purple-500/20",
    accent: "bg-purple-500",
  },
  amber: {
    name: "Amber",
    bg: "bg-amber-500/10",
    text: "text-amber-500 dark:text-amber-400",
    border: "border-amber-500/20",
    hoverBg: "hover:bg-amber-500/20",
    accent: "bg-amber-500",
  },
  rose: {
    name: "Rose",
    bg: "bg-rose-500/10",
    text: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/20",
    hoverBg: "hover:bg-rose-500/20",
    accent: "bg-rose-500",
  },
  indigo: {
    name: "Indigo",
    bg: "bg-indigo-500/10",
    text: "text-indigo-500 dark:text-indigo-400",
    border: "border-indigo-500/20",
    hoverBg: "hover:bg-indigo-500/20",
    accent: "bg-indigo-500",
  },
};

export function getIconComponent(iconName: string): LucideIcon {
  return WORKSPACE_ICONS[iconName] || Folder;
}

export function getColorPreset(colorName: string): WorkspaceColorPreset {
  return WORKSPACE_COLORS[colorName] || WORKSPACE_COLORS.blue;
}
