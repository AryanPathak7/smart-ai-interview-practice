"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Cpu,
  Database,
  Code2,
  FileCheck,
  Settings,
  HelpCircle,
  Briefcase
} from "lucide-react";

export default function InterviewConfig() {
  const { user, apiFetch, loading } = useAuth();
  const router = useRouter();

  // Settings
  const [selectedTopic, setSelectedTopic] = useState("HR");
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [useResume, setUseResume] = useState(false);
  
  const [hasResume, setHasResume] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [fetchingResumeStatus, setFetchingResumeStatus] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Check if user has uploaded a resume
  useEffect(() => {
    const checkResume = async () => {
      if (!user) return;
      try {
        const stats = await apiFetch("/dashboard/stats");
        // We can inspect history or check if they have a parsed resume.
        // Let's assume if their profile skills exist or we hit stats.
        // Let's call the dashboard stats. If the resume is present in their database,
        // we can set hasResume.
        // Let's call a stats endpoint or fetch their profile.
        // Let's do a simple check: if user.skills is populated, they have some context,
        // but to be sure we can check if they uploaded a resume:
        // Let's fetch history/stats. If it succeeds, let's see.
        // We can check if user.skills isn't empty, or we can check stats data.
        setHasResume(!!user.skills);
      } catch (err) {
        setHasResume(false);
      } finally {
        setFetchingResumeStatus(false);
      }
    };
    checkResume();
  }, [user]);

  const topics = [
    { id: "HR", name: "HR / Behavioral", icon: UserCheck, desc: "STAR method, leadership qualities, conflict resolution, and career goals." },
    { id: "Python", name: "Python programming", icon: Code2, desc: "Decorators, generators, memory management, multithreading, and syntax details." },
    { id: "Data Science", name: "Data Science", icon: Database, desc: "Feature engineering, overfitting, model metrics, classification, and metrics analysis." },
    { id: "Machine Learning", name: "Machine Learning", icon: Cpu, desc: "Supervised/Unsupervised models, regression, K-Means, bias-variance, and neural networks." },
    { id: "Custom", name: "Custom Topic", icon: Settings, desc: "Enter your own specialized practice topic (e.g. React.js, System Design, SQL)." }
  ];

  const handleStart = async () => {
    setStartingSession(true);
    const finalTopic = selectedTopic === "Custom" ? customTopic.trim() : selectedTopic;
    
    if (selectedTopic === "Custom" && !finalTopic) {
      alert("Please enter a custom topic");
      setStartingSession(false);
      return;
    }

    try {
      const session = await apiFetch("/interviews/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic,
          difficulty,
          use_resume: useResume
        }),
      });

      router.push(`/interview/${session.id}`);
    } catch (err: any) {
      alert("Failed to start session: " + err.message);
    } finally {
      setStartingSession(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
      
      {/* HEADER */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Configure Mock Interview</h1>
        <p className="text-muted mt-2">
          Customize your AI session. Gemini will generate dynamic questions matching your difficulty and profile.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl glass space-y-8">
        
        {/* SELECT TOPIC */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">1. Select Interview Focus</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTopic === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={`flex flex-col text-left p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-secondary/35 hover:bg-secondary/60"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-4 ${
                    isSelected ? "bg-primary/20 text-primary" : "bg-card text-muted"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold block">{t.name}</span>
                  <span className="text-xs text-muted mt-1 leading-relaxed">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CUSTOM TOPIC INPUT */}
        {selectedTopic === "Custom" && (
          <div className="animate-in slide-in-from-top duration-250">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Enter Custom Interview Topic</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="e.g. React.js Hooks, Database Sharding, System Design patterns"
              required
            />
          </div>
        )}

        {/* SELECT DIFFICULTY */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">2. Select Difficulty</h3>
          <div className="flex gap-4">
            {["Easy", "Medium", "Hard"].map((lvl) => {
              const isSelected = difficulty === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold border transition-all cursor-pointer text-center ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAILOR TO RESUME */}
        <div className="rounded-xl border border-border bg-secondary/20 p-5 flex items-center justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold block">Tailor to Uploaded Resume</span>
              <span className="text-xs text-muted block mt-0.5 max-w-md">
                If enabled, AI will incorporate your actual work experience, side projects, and listed skills into the questions.
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={useResume}
              disabled={fetchingResumeStatus || !hasResume}
              onChange={(e) => setUseResume(e.target.checked)}
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary disabled:opacity-50"></div>
          </label>
        </div>

        {/* START BUTTON */}
        <div className="flex justify-end pt-4 border-t border-border/40">
          <button
            onClick={handleStart}
            disabled={startingSession}
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {startingSession ? "Initializing AI Interviewer..." : "Start Practice Session"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
