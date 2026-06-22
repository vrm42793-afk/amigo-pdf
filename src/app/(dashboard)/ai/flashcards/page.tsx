"use client";

import React, { useState, useEffect } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import { generateFlashcardDeck, getUserDecks, deleteFlashcardDeck } from "@/actions/ai/generate-flashcards";
import { FileRow } from "@/types/files.types";
import { AIFlashcardDeck, AIFlashcard } from "@/types/ai/ai.types";
import { BookOpen, Sparkles, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, RefreshCw, Trash, FileJson, FileSpreadsheet, Printer } from "lucide-react";

export default function AiFlashcardsPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);
  
  const [deckName, setDeckName] = useState("");
  const [decksList, setDecksList] = useState<AIFlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<AIFlashcardDeck | null>(null);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load files and decks on mount
  useEffect(() => {
    async function loadInitialData() {
      const res = await getUserFilesAction();
      if (res.success && res.data) {
        setFiles(res.data);
        if (res.data.length > 0) {
          setSelectedFile(res.data[0]);
        }
      }
      setLoadingFiles(false);

      setLoadingDecks(true);
      const decksRes = await getUserDecks();
      if (decksRes.success && decksRes.data) {
        setDecksList(decksRes.data);
        if (decksRes.data.length > 0) {
          setActiveDeck(decksRes.data[0]);
        }
      }
      setLoadingDecks(false);
    }
    loadInitialData();
  }, []);

  const handleGenerateDeck = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    setIsFlipped(false);
    setCurrentCardIndex(0);

    const res = await generateFlashcardDeck({
      fileId: selectedFile.id,
      deckName: deckName.trim() || undefined
    });

    if (res.success && res.data) {
      setDecksList(prev => [res.data!, ...prev]);
      setActiveDeck(res.data!);
      setDeckName("");
      setSuccessMessage("Flashcards generated and saved successfully!");
    } else {
      setErrorMessage(res.error || "Failed to generate deck");
    }
    setIsGenerating(false);
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this deck?")) return;
    const res = await deleteFlashcardDeck(deckId);
    if (res.success) {
      setDecksList(prev => prev.filter(d => d.id !== deckId));
      if (activeDeck?.id === deckId) {
        setActiveDeck(null);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
      setSuccessMessage("Deck deleted successfully.");
    } else {
      setErrorMessage(res.error || "Failed to delete deck");
    }
  };

  const handleNextCard = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % activeDeck.cards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
    }, 150);
  };

  const handleExportJSON = () => {
    if (!activeDeck) return;
    const blob = new Blob([JSON.stringify(activeDeck.cards, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDeck.deck_name.toLowerCase().replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!activeDeck) return;
    const csvRows = ["Question,Answer,Difficulty,Topic,Page"];
    activeDeck.cards.forEach((c) => {
      const q = `"${c.question.replace(/"/g, '""')}"`;
      const a = `"${c.answer.replace(/"/g, '""')}"`;
      const diff = `"${c.difficulty}"`;
      const topic = `"${c.topic.replace(/"/g, '""')}"`;
      const page = c.source_page ? `"${c.source_page}"` : '""';
      csvRows.push(`${q},${a},${diff},${topic},${page}`);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDeck.deck_name.toLowerCase().replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!activeDeck) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeDeck.deck_name}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 40px; color: #333; }
            h1 { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            .card { border: 1px dashed #aaa; padding: 20px; border-radius: 8px; page-break-inside: avoid; }
            .header { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 8px; display: flex; justify-content: space-between; }
            .question { font-weight: bold; margin-bottom: 12px; font-size: 14px; }
            .answer { font-size: 13px; color: #555; border-top: 1px solid #eee; padding-top: 8px; }
          </style>
        </head>
        <body>
          <h1>${activeDeck.deck_name}</h1>
          <div class="grid">
            ${activeDeck.cards.map((c, i) => `
              <div class="card">
                <div class="header">
                  <span>Card ${i + 1} (${c.difficulty})</span>
                  <span>Page ${c.source_page || "N/A"} - ${c.topic || "General"}</span>
                </div>
                <div class="question">Q: ${c.question}</div>
                <div class="answer">A: ${c.answer}</div>
              </div>
            `).join("")}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeCard: AIFlashcard | null = activeDeck ? activeDeck.cards[currentCardIndex] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          AI Flashcards
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate deck cards from PDFs and practice with interactive flip sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings block */}
        <div className="space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
              Deck Settings
            </h3>

            {/* Document select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Select Document
              </label>
              {loadingFiles ? (
                <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
              ) : files.length === 0 ? (
                <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please upload a PDF file first.
                </div>
              ) : (
                <select
                  value={selectedFile?.id || ""}
                  onChange={(e) => {
                    const found = files.find(f => f.id === e.target.value);
                    if (found) setSelectedFile(found);
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Deck title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Deck Name (Optional)
              </label>
              <input
                type="text"
                placeholder="E.g., History Exam Deck"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateDeck}
              disabled={!selectedFile || isGenerating}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Flashcards
                </>
              )}
            </button>
          </div>

          {/* Decks history */}
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
              My Saved Decks
            </h3>

            {loadingDecks ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-muted animate-pulse rounded-md" />
              ))
            ) : decksList.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                No decks found. Let&apos;s generate one!
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {decksList.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveDeck(d);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all group ${
                      activeDeck?.id === d.id
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="truncate">{d.deck_name}</span>
                    </div>
                    <Trash
                      onClick={(e) => handleDeleteDeck(e, d.id)}
                      className="h-3.5 w-3.5 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Play interface */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[600px]">
          {/* Toolbar */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold truncate max-w-sm">
              {activeDeck ? `${activeDeck.deck_name} (${currentCardIndex + 1}/${activeDeck.cards.length})` : "Card Deck Player"}
            </span>
            {activeDeck && (
              <div className="flex items-center gap-1.5 bg-background p-1 border border-border rounded-lg shadow-xs">
                <button
                  onClick={handleExportJSON}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  title="Export deck to JSON file"
                >
                  <FileJson className="h-4 w-4" />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  title="Export deck to CSV file"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  title="Print flashcard sheets"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Player View */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            {/* Feedback notifications */}
            {successMessage && (
              <div className="w-full max-w-md bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-semibold border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="w-full max-w-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                  Extracting facts, writing answers, and formatting cards...
                </p>
              </div>
            ) : !activeDeck || !activeCard ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No deck selected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document and click &quot;Generate Flashcards&quot; above.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-lg flex flex-col items-center space-y-6">
                {/* 3D Flashcard box */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-72 cursor-pointer group"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    className="relative w-full h-full text-center transition-transform duration-500 rounded-2xl shadow-md border border-border bg-card"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                    }}
                  >
                    {/* Front card face */}
                    <div
                      className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 bg-card rounded-2xl"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        <span>Card {currentCardIndex + 1}</span>
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                          {activeCard.difficulty}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center py-4">
                        <p className="text-base font-semibold leading-relaxed text-foreground">
                          {activeCard.question}
                        </p>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        Topic: {activeCard.topic || "General"} {activeCard.source_page && `• Page ${activeCard.source_page}`}
                      </div>
                    </div>

                    {/* Back card face */}
                    <div
                      className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 bg-muted/30 rounded-2xl"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)"
                      }}
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        <span>Answer Key</span>
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                          {activeCard.difficulty}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center py-4">
                        <p className="text-sm leading-relaxed text-foreground font-medium">
                          {activeCard.answer}
                        </p>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        Click card to flip back
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player actions (left, right buttons) */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={handlePrevCard}
                    className="h-10 w-10 border border-border rounded-full flex items-center justify-center bg-card hover:bg-muted text-foreground transition-colors shadow-xs"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <span className="text-xs font-semibold text-muted-foreground select-none">
                    {currentCardIndex + 1} of {activeDeck.cards.length}
                  </span>

                  <button
                    onClick={handleNextCard}
                    className="h-10 w-10 border border-border rounded-full flex items-center justify-center bg-card hover:bg-muted text-foreground transition-colors shadow-xs"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
