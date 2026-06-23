"use client";

import React, { useState, useEffect, useRef } from "react";
import { getUserFilesAction } from "@/actions/files/list-files";
import {
  startInterviewSessionAction,
  submitInterviewAnswerAction,
  getInterviewSessionsAction
} from "@/actions/study/study-actions";
import { FileRow } from "@/types/files.types";
import { InterviewSession } from "@/types/study/study.types";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Mic,
  Volume2,
  VolumeX,
  Send,
  User,
  Bot,
  Award,
  MessageSquare,
  Play
} from "lucide-react";

export default function InterviewPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRow | null>(null);

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  
  const [answerInput, setAnswerInput] = useState("");
  
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Load files on mount
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

  // Fetch past sessions when selected file changes
  const loadSessions = async () => {
    if (!selectedFile) return;
    const res = await getInterviewSessionsAction(selectedFile.id);
    if (res.success && res.data) {
      setSessions(res.data);
      if (res.data.length > 0) {
        // Find if there is an active session
        const active = res.data.find(s => s.status === "active");
        setCurrentSession(active || res.data[0]);
      } else {
        setCurrentSession(null);
      }
    }
  };

  useEffect(() => {
    if (selectedFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  // Scroll to bottom on new dialogue messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.dialogue_history]);

  // Text-To-Speech (TTS): read assistant questions aloud
  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop any current speech
    
    // Clean text from score and feedback annotations for cleaner reading
    const cleanText = text.replace(/Score:\s*\d+\/\d+/gi, "").replace(/Feedback:[\s\S]*?(\n|$)/gi, "");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech read whenever assistant writes a question
  useEffect(() => {
    if (currentSession && currentSession.dialogue_history.length > 0) {
      const history = currentSession.dialogue_history;
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        speakText(lastMsg.text);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.dialogue_history]);

  // Speech-To-Text (STT): voice answers capture
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          if (transcript) {
            setAnswerInput(prev => (prev ? prev + " " + transcript : transcript));
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition API is not supported in this browser. Try Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleStartInterview = async () => {
    if (!selectedFile) return;
    setIsInitializing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setAnswerInput("");

    const res = await startInterviewSessionAction({ fileId: selectedFile.id });
    if (res.success && res.data) {
      setSuccessMessage("Interview session started!");
      setCurrentSession(res.data);
      loadSessions();
    } else {
      setErrorMessage(res.error || "Failed to initialize interview");
    }
    setIsInitializing(false);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession || !answerInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    const textToSend = answerInput.trim();
    setAnswerInput("");

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const res = await submitInterviewAnswerAction({
      sessionId: currentSession.id,
      answerText: textToSend,
    });

    if (res.success && res.data) {
      setCurrentSession(res.data);
      loadSessions();
    } else {
      setErrorMessage(res.error || "Failed to submit answer");
      setAnswerInput(textToSend); // preserve answer in text area
    }
    setIsSubmitting(false);
  };

  const getAverageScore = () => {
    if (!currentSession) return 0;
    const scores = currentSession.dialogue_history
      .filter(m => m.role === "user" && typeof m.score === "number")
      .map(m => m.score as number);
    
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Interactive Mock Interviewer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Conduct live verbal or text-based mock technical interviews based on your lecture notes and files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings block */}
        <div className="space-y-4">
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
              Interview Settings
            </h3>

            {/* Document select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Select Study Resource
              </label>
              {loadingFiles ? (
                <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-xl bg-muted/30">
                  <AlertCircle className="h-6 w-6 text-yellow-500 mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">No Documents Found</p>
                  <p className="text-xs text-muted-foreground mb-4">You need to upload a PDF to your vault before using this feature.</p>
                  <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                    Upload a PDF
                  </a>
                </div>
              ) : (
                <select
                  value={selectedFile?.id || ""}
                  onChange={(e) => {
                    const found = files.find(f => f.id === e.target.value);
                    if (found) {
                      setSelectedFile(found);
                      setSessions([]);
                      setCurrentSession(null);
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

            {/* TTS speech toggles */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs font-semibold text-muted-foreground">Read Questions Aloud (TTS)</span>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  speechEnabled
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
                title={speechEnabled ? "Disable Text-To-Speech" : "Enable Text-To-Speech"}
              >
                {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={!selectedFile || isInitializing}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Initializing Chatbot...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Mock Interview
                </>
              )}
            </button>
          </div>

          {/* Historical Sessions list */}
          {sessions.length > 0 && (
            <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
                Interview Sessions
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSession(s)}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all ${
                      currentSession?.id === s.id
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        Interview: {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-full shrink-0 font-bold ${
                      s.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {s.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat / Result panel */}
        <div className="lg:col-span-2 flex flex-col border border-border bg-card rounded-xl shadow-sm overflow-hidden h-[620px]">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-muted/20">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Dialogue Box
            </span>
            {currentSession && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-md">
                {currentSession.status === "active" 
                  ? `Question ${currentSession.current_question_index} of 5`
                  : "Session Completed"}
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-semibold border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!currentSession ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <Bot className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">Ready for assessment</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a document and start the mock interview to test your verbal grasp.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dialogue histories */}
                {currentSession.dialogue_history.map((msg, idx) => (
                  <div key={idx} className="space-y-2">
                    {msg.role === "assistant" ? (
                      <div className="flex items-start gap-3 max-w-[85%]">
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="bg-card border border-border p-3.5 rounded-r-xl rounded-bl-xl text-xs text-foreground shadow-sm whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                          {currentSession.status === "active" && idx === currentSession.dialogue_history.length - 1 && (
                            <button
                              onClick={() => speakText(msg.text)}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary pl-1 font-semibold"
                            >
                              <Play className="h-3 w-3" />
                              Replay Audio
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end space-y-2">
                        {/* Student response */}
                        <div className="flex items-start justify-end gap-3 max-w-[85%] self-end">
                          <div className="bg-primary text-primary-foreground p-3.5 rounded-l-xl rounded-br-xl text-xs shadow-sm whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                          <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Grading and feedback for this response */}
                        {typeof msg.score === "number" && (
                          <div className="mr-11 max-w-[80%] bg-muted/65 border border-border/80 rounded-xl p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-border pb-1.5">
                              <span className="font-bold text-[10px] uppercase text-primary tracking-wider">Evaluation Report</span>
                              <span className="font-bold text-[10px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                                Score: {msg.score}/100
                              </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">{msg.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Final Score Report card on completion */}
                {currentSession.status === "completed" && (
                  <div className="border border-primary/20 bg-primary/5 rounded-xl p-6 text-center space-y-4 max-w-lg mx-auto mt-6 shadow-sm">
                    <Award className="h-10 w-10 text-primary mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">Interview Assessment Completed</h3>
                      <p className="text-xs text-muted-foreground">The AI examiner evaluated your grasp of the reference text.</p>
                    </div>
                    <div className="inline-block px-5 py-2.5 bg-card border border-border rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Cumulative Score</span>
                      <span className="text-2xl font-black text-primary block mt-0.5">{getAverageScore()}%</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Form Input Area */}
          {currentSession && currentSession.status === "active" && (
            <form onSubmit={handleSubmitAnswer} className="h-20 shrink-0 border-t border-border bg-card px-6 flex items-center gap-3">
              {/* Mic capture button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse border-red-600"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
                title={isListening ? "Stop voice capture" : "Record voice answer"}
              >
                <Mic className="h-4.5 w-4.5" />
              </button>

              <input
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder={isListening ? "Listening... Speak your answer now." : "Type your answer here..."}
                disabled={isSubmitting}
                className="flex-1 h-10 rounded-lg border border-border bg-background px-4 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/60"
              />

              <button
                type="submit"
                disabled={!answerInput.trim() || isSubmitting}
                className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
