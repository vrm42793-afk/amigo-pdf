import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare, FileText, StickyNote, BookOpen, Brain, Zap, ArrowUpRight } from "lucide-react";

export async function AiUsageStatisticsWidget() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("ai_words_used, ai_words_limit, plan")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const used = profile.ai_words_used;
  const limit = profile.ai_words_limit;
  const percentage = Math.min(Math.round((used / limit) * 100), 100);

  return (
    <div className="border-2 border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
          <Zap className="h-4 w-4 text-primary fill-primary/20" />
          AI Words Budget
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
          {profile.plan} Plan
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{used.toLocaleString()} / {limit.toLocaleString()} words used</span>
          <span className="font-bold text-foreground">{percentage}%</span>
        </div>
        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground leading-normal">
        Your word limit resets monthly. Upgrade to Pro for unlimited generation limits and larger files processing.
      </p>
    </div>
  );
}

export async function RecentAiActivityWidget() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch recent chats
  const { data: chats } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  // 2. Fetch recent summaries
  const { data: summaries } = await supabase
    .from("generated_summaries")
    .select("id, summary_type, file_id, created_at, files(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  // 3. Fetch recent notes
  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  // 4. Fetch recent flashcard decks
  const { data: decks } = await supabase
    .from("flashcards")
    .select("id, deck_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  const hasActivity = 
    (chats && chats.length > 0) || 
    (summaries && summaries.length > 0) || 
    (notes && notes.length > 0) || 
    (decks && decks.length > 0);

  return (
    <div className="border-2 border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
          <Brain className="h-4 w-4 text-primary" />
          Recent AI Activity
        </h3>
      </div>

      {!hasActivity ? (
        <div className="text-xs text-muted-foreground text-center py-6">
          No recent AI tool activity recorded. Get started by selecting a tool from the sidebar.
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Chats */}
          {chats && chats.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Recent Chats</span>
              {chats.map(c => (
                <Link
                  key={c.id}
                  href="/ai/chat"
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted text-xs transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate text-foreground group-hover:text-primary">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}

          {/* Summaries */}
          {summaries && summaries.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Recent Summaries</span>
              {summaries.map(s => (
                <Link
                  key={s.id}
                  href="/ai/summarize"
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted text-xs transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate text-foreground group-hover:text-primary">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{(s.files as unknown as { name: string })?.name || "Document"} ({(s.summary_type).toUpperCase()})</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}

          {/* Notes */}
          {notes && notes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Recent Notes</span>
              {notes.map(n => (
                <Link
                  key={n.id}
                  href="/ai/notes"
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted text-xs transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate text-foreground group-hover:text-primary">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{n.title}</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}

          {/* Flashcards */}
          {decks && decks.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Recent Decks</span>
              {decks.map(d => (
                <Link
                  key={d.id}
                  href="/ai/flashcards"
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted text-xs transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate text-foreground group-hover:text-primary">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{d.deck_name}</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
