"use client";

import Link from "next/link";
import { Sparkles, Mic, BarChart2, Shield, ArrowRight, CheckCircle, Brain, Terminal, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="relative isolate overflow-hidden min-h-screen flex flex-col justify-center">
      
      {/* Background Gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#ff80b5] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.187rem]" />
      </div>

      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 sm:pt-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Text Content */}
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6 animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Google Gemini 1.5 Flash
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              Ace Your Technical & HR Mock Interviews
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-muted">
              Antigravity AI Prep is an intelligent, full-stack mock interview workspace. Practice speaking, writing code, and parsing resumes with instant AI feedback scoring.
            </p>
            
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-lg shadow-primary/30"
              >
                Start Practice Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="text-sm font-semibold leading-6 hover:text-primary transition-colors">
                Sign in to your account <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Interactive Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl glass transition-all">
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-red-500" />
                  <div className="h-3.5 w-3.5 rounded-full bg-yellow-500" />
                  <div className="h-3.5 w-3.5 rounded-full bg-green-500" />
                </div>
                <span className="text-xs font-semibold text-muted">AI Interviewer Session</span>
              </div>
              
              {/* Question bubble */}
              <div className="rounded-lg bg-primary/10 border border-primary/10 p-4 text-sm text-foreground mb-4">
                <div className="font-semibold text-primary mb-1 flex items-center gap-1">
                  <Brain className="h-4 w-4" /> AI Interviewer
                </div>
                "Could you explain the bias-variance tradeoff in Machine Learning models, and how cross-validation helps manage it?"
              </div>

              {/* User transcript */}
              <div className="rounded-lg bg-secondary border border-border p-4 text-sm text-foreground mb-6">
                <div className="font-semibold text-muted mb-1 flex items-center gap-1">
                  <Mic className="h-4 w-4 text-muted" /> Your Recorded Transcript
                </div>
                "Bias is the error from simple assumptions in our algorithm, leading to underfitting. Variance is error from sensitivity to training data noise, causing overfitting. Cross-validation helps by..."
              </div>

              {/* Animated visualizer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <span className="text-xs font-bold text-muted">Voice Processing...</span>
                </div>
                <div className="sound-wave-active flex items-center gap-0.5">
                  <div className="sound-bar" />
                  <div className="sound-bar" />
                  <div className="sound-bar" />
                  <div className="sound-bar" />
                  <div className="sound-bar" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Everything You Need to Ace Your Next Role
          </h2>
          <p className="mt-4 text-lg text-muted">
            Engineered with industry-standard features designed for software engineers, data scientists, and managers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1 */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <Mic className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold">Speech-to-Text Mocking</h3>
            <p className="mt-2 text-sm text-muted">
              Record answers natively through your microphone. The platform transcribes your speech and submits it for instant evaluation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <Brain className="h-8 w-8 text-indigo-500 mb-4" />
            <h3 className="text-lg font-bold">Advanced AI Grading</h3>
            <p className="mt-2 text-sm text-muted">
              Receive clear, multidimensional breakdown scores (0-10) for Accuracy, Communication, Confidence, and Completeness.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <FileText className="h-8 w-8 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold">Resume Tailoring</h3>
            <p className="mt-2 text-sm text-muted">
              Upload your resume in PDF. Our system extracts your specific skills and experience to ask custom questions tailored to you.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <Terminal className="h-8 w-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-bold">Coding Sandboxes</h3>
            <p className="mt-2 text-sm text-muted">
              Practice algorithm and programming questions using an interactive code editor, complete with compiler evaluation feedback.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <BarChart2 className="h-8 w-8 text-amber-500 mb-4" />
            <h3 className="text-lg font-bold">Performance Analytics</h3>
            <p className="mt-2 text-sm text-muted">
              Monitor your growth trends, daily challenges completed, weakest domains, and comparative leaderboard rankings over time.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <Shield className="h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-lg font-bold">Admin Panel Auditing</h3>
            <p className="mt-2 text-sm text-muted">
              Access platform-wide operational analytics, session metrics, active user growth, and dashboard logs directly.
            </p>
          </div>

        </div>
      </section>

      {/* CTA SECTION */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="relative isolate overflow-hidden bg-primary/5 rounded-3xl border border-primary/10 px-6 py-12 sm:px-12 md:py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Ready to secure your dream offer?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Join other candidates today and master Python, ML, Data Science, and standard behavioral interviews.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md"
            >
              Sign Up Now
            </Link>
            <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">
              Access Dashboard <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Background Gradients Footer */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-accent to-[#9089fc] opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.187rem]" />
      </div>

    </div>
  );
}
