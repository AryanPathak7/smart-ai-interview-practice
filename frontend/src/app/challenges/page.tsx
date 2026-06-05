"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Code,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  BookOpen,
  Check,
  Award
} from "lucide-react";

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  starter_code: string;
}

interface CodingSubmission {
  id: number;
  challenge_id: number;
  submitted_code: string;
  score: number;
  evaluation: string;
  status: string;
  submitted_at: string;
}

export default function CodingChallenges() {
  const { user, apiFetch, loading } = useAuth();
  const router = useRouter();

  // Challenges list
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null);
  
  // Editor code
  const [code, setCode] = useState("");
  
  // Submission result
  const [submissionResult, setSubmissionResult] = useState<CodingSubmission | null>(null);
  
  const [fetchingChallenges, setFetchingChallenges] = useState(true);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadChallenges = async () => {
    try {
      setFetchingChallenges(true);
      const list = await apiFetch("/challenges");
      setChallenges(list);
      if (list.length > 0) {
        setSelectedChallenge(list[0]);
        setCode(list[0].starter_code);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load challenges");
    } finally {
      setFetchingChallenges(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleSelectChallenge = (ch: CodingChallenge) => {
    setSelectedChallenge(ch);
    setCode(ch.starter_code);
    setSubmissionResult(null);
  };

  const handleResetCode = () => {
    if (selectedChallenge) {
      setCode(selectedChallenge.starter_code);
      setSubmissionResult(null);
    }
  };

  const handleRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge || !code.trim() || submittingCode) return;

    setSubmittingCode(true);
    setSubmissionResult(null);
    try {
      const result = await apiFetch(`/challenges/${selectedChallenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitted_code: code }),
      });
      setSubmissionResult(result);
    } catch (err: any) {
      alert("Submission failed: " + err.message);
    } finally {
      setSubmittingCode(false);
    }
  };

  if (loading || fetchingChallenges || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-muted">Bootstrapping compiler playground...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 flex flex-col gap-6 flex-1">
      
      {/* HEADER */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Algorithms & Code Sandboxes</h1>
        <p className="text-muted mt-1">
          Select a problem on the left, implement your solution in Python, and get automatic AI evaluation feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch flex-1">
        
        {/* SIDEBAR - PROBLEMS LIST */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted px-2 py-1 flex items-center gap-1.5 border-b border-border/40 pb-2 mb-2">
            <BookOpen className="h-4 w-4" /> Coding Challenges
          </h3>
          <div className="space-y-1">
            {challenges.map((ch) => {
              const isSelected = selectedChallenge?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChallenge(ch)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold"
                      : "hover:bg-secondary text-muted hover:text-foreground"
                  }`}
                >
                  <span className="truncate pr-2">{ch.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border shrink-0 ${
                    ch.difficulty === "Easy"
                      ? isSelected ? "bg-white/20 border-white/30 text-white" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                      : isSelected ? "bg-white/20 border-white/30 text-white" : "bg-amber-500/10 border-amber-500/25 text-amber-500"
                  }`}>
                    {ch.difficulty}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE AREA (splitscreen description and editor) */}
        {selectedChallenge ? (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* PROBLEM DESCRIPTION */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                  <h2 className="text-xl font-bold tracking-tight">{selectedChallenge.title}</h2>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold border ${
                    selectedChallenge.difficulty === "Easy"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  }`}>
                    {selectedChallenge.difficulty}
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-muted whitespace-pre-wrap">
                  {selectedChallenge.description}
                </div>
              </div>

              {/* COMPILATION / EVALUATION TERMINAL OUTPUT */}
              {submissionResult && (
                <div className={`mt-6 border rounded-xl p-4 text-xs ${
                  submissionResult.status === "passed"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-destructive/10 border-destructive/20"
                }`}>
                  <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-2">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {submissionResult.status === "passed" ? (
                        <>
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                          <span className="text-emerald-500">Evaluation: Passed (Score: {submissionResult.score}%)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4.5 w-4.5 text-red-500" />
                          <span className="text-red-500">Evaluation: Failed (Score: {submissionResult.score}%)</span>
                        </>
                      )}
                    </span>
                    <Award className={`h-5 w-5 ${submissionResult.status === "passed" ? "text-emerald-500" : "text-muted"}`} />
                  </div>
                  <p className="leading-relaxed text-muted">{submissionResult.evaluation}</p>
                </div>
              )}
            </div>

            {/* CODE EDITOR */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                  <div className="flex items-center gap-2 font-mono text-sm font-semibold">
                    <Terminal className="h-4.5 w-4.5 text-primary" />
                    <span>python_solution.py</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetCode}
                      className="flex items-center gap-1 text-xs font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
                      title="Reset Code Template"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset Template
                    </button>
                  </div>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full rounded-lg border border-input bg-zinc-950 text-zinc-50 p-4 font-mono text-sm focus:border-primary focus:outline-none placeholder:text-muted h-[320px] resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border/40 mt-4">
                <button
                  onClick={handleRunSubmit}
                  disabled={submittingCode || !code.trim()}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="h-4 w-4" />
                  {submittingCode ? "Compiling solution..." : "Submit Code & Evaluate"}
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-3 text-center py-20 rounded-2xl bg-secondary/20 border border-dashed border-border flex flex-col justify-center items-center">
            <HelpCircle className="h-12 w-12 text-muted mb-3" />
            <p className="text-sm font-semibold text-muted">No challenges available.</p>
          </div>
        )}

      </div>

    </div>
  );
}
