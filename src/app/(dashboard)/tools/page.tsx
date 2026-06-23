"use client";

import Link from "next/link";
import {
  Merge,
  Scissors,
  Minimize2,
  RotateCcw,
  AlignJustify,
  Layers,
  ScanText,
  PenLine,
  Type,
  FileImage,
  Wrench,
  Swords,
  Droplet
} from "lucide-react";

const allPdfTools = [
  { label: "Merge PDFs", icon: Merge, href: "/tools/merge", description: "Combine multiple PDFs into one document." },
  { label: "Split PDF", icon: Scissors, href: "/tools/split", description: "Separate one page or a whole set for easy conversion." },
  { label: "Compress PDF", icon: Minimize2, href: "/tools/compress", description: "Reduce file size while optimizing for maximal PDF quality." },
  { label: "Rotate PDF", icon: RotateCcw, href: "/tools/rotate", description: "Rotate your PDFs the way you need them." },
  { label: "Reorder Pages", icon: AlignJustify, href: "/tools/reorder", description: "Drag and drop pages to reorder them." },
  { label: "Extract Pages", icon: Layers, href: "/tools/extract", description: "Extract specific pages into a new PDF." },
  { label: "OCR Scan", icon: ScanText, href: "/tools/ocr", description: "Make text in scanned PDFs searchable." },
  { label: "E-Sign PDF", icon: PenLine, href: "/tools/sign", description: "Sign yourself or request electronic signatures." },
  { label: "Watermark", icon: Droplet, href: "/tools/watermark", description: "Add a watermark image or text to your PDF." },
  { label: "PDF Converter", icon: FileImage, href: "/tools/converter", description: "Convert between PDF and Images effortlessly." },
  { label: "Quiz Battle", icon: Swords, href: "/tools/quiz-battle/new", description: "Compete in live quiz battles generated from PDFs." },
];

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-8 pb-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
          <Wrench className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            All PDF Tools
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Everything you need to merge, split, convert, and manage your PDF documents in one powerful workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allPdfTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex flex-col p-5 rounded-2xl border border-border bg-card hover:bg-muted hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 group shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:shadow-md transition-all duration-300 mb-4">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {tool.label}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
