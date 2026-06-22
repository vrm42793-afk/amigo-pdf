"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  X,
  FileText,
  StickyNote,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Loader2,
  ExternalLink,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { globalSearchAction, getFileSecureUrlAction } from "@/actions/workspace/workspace-actions";
import { SearchResult } from "@/types/workspace/workspace.types";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "file" | "note" | "flashcard" | "quiz" | "chat">("all");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    const res = await globalSearchAction({ query: query.trim() });
    if (res.success && res.data) {
      setResults(res.data);
      setHasSearched(true);
    } else {
      toast.error(res.error || "Search failed");
    }
    setIsSearching(false);
  };

  const getFilteredResults = () => {
    if (activeTab === "all") return results;
    return results.filter((r) => r.item_type === activeTab);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "note":
        return <StickyNote className="h-4 w-4 text-green-500" />;
      case "flashcard":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4 text-amber-500" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 text-rose-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleOpenResult = async (result: SearchResult) => {
    if (result.item_type === "file") {
      // Fetch direct Cloudinary secure URL
      toast.loading("Retrieving secure file link...");
      const res = await getFileSecureUrlAction({ fileId: result.item_id });
      toast.dismiss();
      if (res.success && res.url) {
        window.open(res.url, "_blank");
      } else {
        toast.error(res.error || "Failed to retrieve secure download link");
      }
    } else {
      // Navigate to matching service pages
      let path = "";
      switch (result.item_type) {
        case "note":
          path = "/ai/notes";
          break;
        case "flashcard":
          path = "/ai/flashcards";
          break;
        case "quiz":
          path = "/ai/quiz";
          break;
        case "chat":
          path = "/ai/chat";
          break;
        default:
          path = "/dashboard";
      }
      router.push(path);
    }
  };

  // Safe highlighted text rendering helper
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!text) return "";
    if (!highlight || !highlight.trim()) return text;

    const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const categories = [
    { value: "all", label: "All Matches" },
    { value: "file", label: "Files" },
    { value: "note", label: "Notes" },
    { value: "flashcard", label: "Flashcards" },
    { value: "quiz", label: "Quizzes" },
    { value: "chat", label: "AI Chats" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Search Workspace</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find matching text across file names, OCR scans, notes, chat history, and flashcard topics
        </p>
      </div>

      {/* Search Input Card */}
      <div className="glass p-5 rounded-xl border border-border">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts, questions, filenames..."
              className="pl-10 pr-10 py-5 w-full bg-background/50 border-border"
              required
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" isLoading={isSearching} className="px-6 py-5">
            Search
          </Button>
        </form>
      </div>

      {/* Categories Filter Bar */}
      {hasSearched && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-border/50">
          {categories.map((cat) => {
            const count = cat.value === "all" ? results.length : results.filter((r) => r.item_type === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border ${
                  activeTab === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/35 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results View */}
      <div className="space-y-4">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Searching your knowledge base...</span>
          </div>
        ) : hasSearched ? (
          getFilteredResults().length === 0 ? (
            <div className="glass rounded-xl py-16 text-center border border-border space-y-3">
              <Search className="h-10 w-10 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">No matches found</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Try checking your spelling or search using another keyword.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredResults().map((result, idx) => (
                <div
                  key={`${result.item_id}-${idx}`}
                  onClick={() => handleOpenResult(result)}
                  className="glass group cursor-pointer border border-border hover:border-primary/20 hover:shadow-md transition-all duration-200 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-card border border-border rounded-lg shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {getResultIcon(result.item_type)}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {renderHighlightedText(result.title, query)}
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted/50 border border-border/40 font-semibold tracking-wider">
                            {result.item_type}
                          </span>
                        </h4>
                        
                        {result.content_snippet && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/10 p-2.5 rounded-lg border border-border/30">
                            {renderHighlightedText(result.content_snippet, query)}
                          </p>
                        )}
                      </div>
                    </div>

                    <button className="text-muted-foreground group-hover:text-primary transition-colors hover:bg-muted p-1.5 rounded-lg">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border/30">
                    <Calendar className="h-3 w-3" />
                    <span>Indexed {new Date(result.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="glass rounded-xl py-16 text-center border border-border space-y-3">
            <Search className="h-10 w-10 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Enter a Search Term</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Search your files, AI-generated revision sheets, formulas, custom collections, mindmaps, and chat records.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
