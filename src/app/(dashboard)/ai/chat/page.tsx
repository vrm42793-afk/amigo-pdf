"use client";

import React, { useState, useEffect, useRef } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { createChatSession, getChatSessions, getChatMessages, deleteChatSession } from "@/actions/ai/chat-with-pdf";
import { FileRow } from "@/types/files.types";
import { AIChatSession, AIChatMessage, AISource } from "@/types/ai/ai.types";
import { MessageSquare, Send, Plus, Trash, FileText, ChevronRight, BookOpen, AlertCircle, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

let tempIdCounter = 0;
function nextTempId() {
  tempIdCounter++;
  return `temp-${Date.now()}-${tempIdCounter}`;
}

export default function AiChatPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<AIChatSession | null>(null);
  
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sources, setSources] = useState<AISource[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch files on mount
  useEffect(() => {
    async function loadFiles() {
      const res = await getUserFilesAction();
      if (res.success && res.data) {
        setFiles(res.data);
        if (res.data.length > 0) {
          setSelectedFile(res.data[0]);
        }
      }
      setLoadingFiles(false);
    }
    loadFiles();
  }, []);

  // Fetch sessions when selected file changes
  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    async function loadSessions() {
      setLoadingSessions(true);
      const res = await getChatSessions(selectedFile!.id);
      if (res.success && res.data) {
        setSessions(res.data);
        if (res.data.length > 0) {
          setActiveSession(res.data[0]);
        } else {
          setActiveSession(null);
          setMessages([]);
          setSources([]);
        }
      }
      setLoadingSessions(false);
    }
    loadSessions();
  }, [selectedFile]);

  // Fetch messages when active session changes
  useEffect(() => {
    if (!activeSession) {
      return;
    }

    async function loadMessages() {
      setIsLoading(true);
      const res = await getChatMessages(activeSession!.id);
      if (res.success && res.data) {
        setMessages(res.data);
        setSources([]);
      }
      setIsLoading(false);
    }
    loadMessages();
  }, [activeSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleStartNewSession = async () => {
    if (!selectedFile) return;
    const title = `Chat on ${selectedFile.name.substring(0, 20)}`;
    const res = await createChatSession({ fileId: selectedFile.id, title });
    if (res.success && res.data) {
      setSessions(prev => [res.data!, ...prev]);
      setActiveSession(res.data);
      setMessages([]);
      setSources([]);
    } else {
      setErrorMessage(res.error || "Failed to create session");
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat history?")) return;
    const res = await deleteChatSession(sessionId);
    if (res.success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
        setSources([]);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !selectedFile) return;

    let currentSessionId = activeSession?.id;
    
    // Create new session if none exists
    if (!currentSessionId) {
      const title = text.length > 25 ? `${text.substring(0, 25)}...` : text;
      const res = await createChatSession({ fileId: selectedFile.id, title });
      if (res.success && res.data) {
        setSessions(prev => [res.data!, ...prev]);
        setActiveSession(res.data);
        currentSessionId = res.data.id;
      } else {
        setErrorMessage(res.error || "Failed to create chat session");
        return;
      }
    }

    // Append user message immediately
    const userMsg: AIChatMessage = {
      id: nextTempId(),
      role: "user",
      message: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsStreaming(true);
    setErrorMessage("");

    // Setup placeholder assistant message
    const assistantMsgId = nextTempId();
    const assistantMsg: AIChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      message: "",
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: text
        })
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No readable stream");

      const textChunks: string[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawText = decoder.decode(value);
        // Process SSE data chunks (data: {...}\n\n)
        const lines = rawText.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                setErrorMessage(data.error);
                break;
              }
              if (data.sources) {
                setSources(data.sources);
              }
              if (data.text) {
                textChunks.push(data.text);
                const updatedText = textChunks.join("");
                // Update assistant message with accumulated text
                setMessages(prev =>
                  prev.map(m => (m.id === assistantMsgId ? { ...m, message: updatedText } : m))
                );
              }
            } catch {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to get streaming response";
      setErrorMessage(errMsg);
      // Remove temporary assistant placeholder if failed
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
    } finally {
      setIsStreaming(false);
    }
  };

  const suggestedQuestions = [
    "Summarize the document",
    "What are the main topics discussed?",
    "Explain the key definitions"
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
      {/* Sidebar: Files & Sessions list */}
      <div className="w-80 shrink-0 flex flex-col border border-border bg-card rounded-xl overflow-hidden shadow-sm">
        {/* File Select */}
        <div className="p-4 border-b border-border space-y-2 bg-muted/30">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Select Document
          </label>
          {loadingFiles ? (
            <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
          ) : files.length === 0 ? (
            <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-2.5 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Upload a file to start chatting.
            </div>
          ) : (
            <select
              value={selectedFile?.id || ""}
              onChange={(e) => {
                const found = files.find(f => f.id === e.target.value);
                if (found) {
                  setSelectedFile(found);
                  setSessions([]);
                  setActiveSession(null);
                  setMessages([]);
                  setSources([]);
                }
              }}
              className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {files.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Sessions list */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chat History
            </span>
            {selectedFile && (
              <button
                onClick={handleStartNewSession}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                title="Start new chat"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {loadingSessions ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-muted animate-pulse rounded-md" />
              ))
            ) : sessions.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No chat sessions found. Start by sending a message below!
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-md text-sm transition-all hover:bg-muted group ${
                    activeSession?.id === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="truncate">{s.title}</span>
                  </div>
                  <Trash
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col border border-border bg-card rounded-xl overflow-hidden shadow-sm">
        {/* Active header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-6 bg-muted/20">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold truncate max-w-lg">
              {selectedFile ? `Chatting on: ${selectedFile.name}` : "AI Chat"}
            </h2>
          </div>
        </div>

        {/* Message body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages view */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="text-xs text-muted-foreground">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Chat with your PDF</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask questions, generate study questions, or summarize parts of the document in real time.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full mt-4">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={!selectedFile}
                      className="text-left text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground p-3 rounded-lg border border-border transition-colors flex items-center justify-between group disabled:opacity-50"
                    >
                      <span>{q}</span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/70 text-foreground border border-border whitespace-pre-wrap leading-relaxed"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))
            )}
            
            {/* Streaming typing indicator */}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted/70 text-muted-foreground rounded-2xl px-4 py-2.5 text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Error alerts */}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sources context panel (side bar) */}
          <AnimatePresence>
            {sources.length > 0 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="shrink-0 border-l border-border bg-muted/10 flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center gap-1.5 bg-muted/20">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    Sources
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sources.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-card p-3 rounded-lg border border-border shadow-xs hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                          Page {s.pageNumber ?? "?"}
                        </span>
                        <span className="text-[9px] font-semibold text-muted-foreground truncate max-w-[120px]">
                          {s.sectionTitle || "General"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed group-hover:line-clamp-none transition-all">
                        {s.chunkText}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-border bg-muted/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!selectedFile || isStreaming}
              placeholder={
                selectedFile
                  ? "Ask a question about this document..."
                  : "Please select a file to chat..."
              }
              className="flex-1 h-10 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!selectedFile || isStreaming || !inputText.trim()}
              className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
