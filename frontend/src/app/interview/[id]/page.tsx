"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Mic,
  MicOff,
  Send,
  Timer,
  Brain,
  MessageSquare,
  Sparkles,
  Volume2,
  Trash2,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle
} from "lucide-react";

interface Question {
  id: number;
  session_id: number;
  question_text: string;
  question_order: number;
}

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  order?: number;
}

export default function InterviewSimulator() {
  const { id } = useParams();
  const { user, apiFetch, loading } = useAuth();
  const router = useRouter();

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessionTopic, setSessionTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(1800); // 30 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Input states
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [finishingSession, setFinishingSession] = useState(false);
  const [error, setError] = useState("");

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load Session and First Question
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await apiFetch(`/interviews/sessions/${id}`);
        setSessionTopic(sessionData.topic);
        setDifficulty(sessionData.difficulty);

        if (sessionData.status === "completed") {
          router.push(`/interview/${id}/report`);
          return;
        }

        // Reconstruct chat history from any existing responses
        const initialChats: ChatMessage[] = [];
        sessionData.responses.forEach((resp: any) => {
          initialChats.push({ sender: "ai", text: resp.question_text });
          if (resp.user_answer) {
            initialChats.push({ sender: "user", text: resp.user_answer });
          }
        });
        setChatHistory(initialChats);

        // Fetch current question
        fetchNextQuestion();
      } catch (err: any) {
        setError("Failed to initialize session: " + err.message);
      }
    };

    fetchSession();

    // Start Timer
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          alert("Time is up! Submitting interview session...");
          handleCompleteInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [id]);

  const fetchNextQuestion = async () => {
    try {
      setError("");
      const q = await apiFetch(`/interviews/sessions/${id}/next-question`);
      setCurrentQuestion(q);
      setChatHistory((prev) => [...prev, { sender: "ai", text: q.question_text, order: q.question_order }]);
      setUserAnswer("");
    } catch (err: any) {
      // If next question fails, check if we reached 5 questions
      if (err.message && err.message.includes("maximum")) {
        // Ready to complete
        setCurrentQuestion(null);
      } else {
        setError(err.message || "Failed to fetch question");
      }
    }
  };

  // Web Speech API Initialization
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please type your answer or use Google Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsRecording(true);
    };

    rec.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setUserAnswer((prev) => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error: ", event.error);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Submit User Answer
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || submittingAnswer) return;

    // Stop recording if active
    if (isRecording) {
      stopSpeechRecognition();
    }

    setSubmittingAnswer(true);
    setError("");

    try {
      // Add response to chat visualizer
      setChatHistory((prev) => [...prev, { sender: "user", text: userAnswer }]);

      // Post response
      await apiFetch(`/interviews/questions/${currentQuestion.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: userAnswer }),
      });

      // Load next question
      await fetchNextQuestion();
    } catch (err: any) {
      setError(err.message || "Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Finalize Session
  const handleCompleteInterview = async () => {
    setFinishingSession(true);
    try {
      await apiFetch(`/interviews/sessions/${id}/complete`, { method: "POST" });
      router.push(`/interview/${id}/report`);
    } catch (err: any) {
      alert("Failed to complete interview: " + err.message);
    } finally {
      setFinishingSession(false);
    }
  };

  // Format Time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 flex flex-col gap-6 flex-1">
      
      {/* SIMULATOR TOP PANEL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4">
        <div>
          <span className="rounded bg-primary/10 border border-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
            Mock Interview
          </span>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">{sessionTopic} ({difficulty})</h1>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
          <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
            <Timer className={`h-4.5 w-4.5 ${secondsLeft < 180 ? "text-red-500 animate-pulse" : "text-muted"}`} />
            <span className={secondsLeft < 180 ? "text-red-500 font-bold" : ""}>{formatTime(secondsLeft)}</span>
          </div>
          <div className="text-xs text-muted font-semibold">
            {chatHistory.filter((c) => c.sender === "user").length} of 5 Answered
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CORE WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 flex-1 items-stretch">
        
        {/* INTERVIEWER PANEL */}
        <div className="lg:col-span-1 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center py-6">
            <div className="relative inline-flex mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              {submittingAnswer && (
                <span className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              )}
            </div>
            <h3 className="font-bold text-lg">AI Interviewer</h3>
            <p className="text-xs text-muted mt-0.5">Gemini Coach</p>

            <div className="mt-6 rounded-xl bg-secondary/40 border border-border p-4 text-sm text-left leading-relaxed">
              {currentQuestion ? (
                <span>"{currentQuestion.question_text}"</span>
              ) : (
                <div className="text-center py-2">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <span className="font-semibold block text-emerald-500">Interview Finished!</span>
                  <span className="text-xs text-muted block mt-1">AI has processed your answers. Ready to compile report.</span>
                </div>
              )}
            </div>
          </div>

          {/* VOICE INPUT PANEL */}
          {currentQuestion && (
            <div className="border-t border-border/40 pt-6 space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition-all cursor-pointer shadow-lg ${
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 pulse-mic" 
                      : "bg-primary hover:bg-primary/95 shadow-primary/20"
                  }`}
                  aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                <button
                  type="button"
                  onClick={() => setUserAnswer("")}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-muted transition-all cursor-pointer"
                  title="Clear Answer"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Speech Soundwave visualizer */}
              {isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <div className="sound-wave-active flex items-center gap-0.5 h-8">
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                    <div className="sound-bar" />
                  </div>
                  <span className="text-xs text-muted font-semibold animate-pulse">Listening... Speak clearly.</span>
                </div>
              )}
            </div>
          )}

          {!currentQuestion && (
            <div className="border-t border-border/40 pt-6">
              <button
                type="button"
                onClick={handleCompleteInterview}
                disabled={finishingSession}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {finishingSession ? "Compiling Evaluation..." : "Generate Performance Report"}
                <Sparkles className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* CHAT LOG & TEXT INPUT */}
        <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden min-h-[450px]">
          
          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[380px] mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted border-b border-border/40 pb-2 mb-4">
              <MessageSquare className="h-4 w-4" /> Live Session Conversation Log
            </div>

            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  chat.sender === "ai"
                    ? "bg-secondary/70 mr-auto border border-border/20 rounded-tl-none"
                    : "bg-primary text-primary-foreground ml-auto rounded-tr-none shadow-sm"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                  chat.sender === "ai" ? "text-primary" : "text-primary-foreground/85"
                }`}>
                  {chat.sender === "ai" ? "AI Interviewer" : "You"}
                </span>
                {chat.text}
              </div>
            ))}
          </div>

          {/* Text Input submit box */}
          {currentQuestion && (
            <form onSubmit={handleAnswerSubmit} className="border-t border-border/40 pt-4 flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1 block">Your Answer Response</label>
                <textarea
                  rows={2}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Record your voice or type your technical response here..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none placeholder:text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingAnswer || !userAnswer.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 shrink-0 cursor-pointer"
                title="Send Answer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
