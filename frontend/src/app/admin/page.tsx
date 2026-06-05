"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  GraduationCap,
  Trophy,
  History,
  Activity,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface RecentUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface RecentSession {
  id: number;
  topic: string;
  difficulty: string;
  status: string;
  score: number;
  created_at: string;
}

interface AdminAnalytics {
  total_users: number;
  total_sessions: number;
  completed_sessions: number;
  average_score: number;
  recent_users: RecentUser[];
  recent_sessions: RecentSession[];
}

export default function AdminDashboard() {
  const { user, apiFetch, loading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  // Restrict access
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.is_admin) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !user.is_admin) return;
      try {
        setPageLoading(true);
        const data = await apiFetch("/admin/analytics");
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || "Failed to load admin analytics");
      } finally {
        setPageLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (loading || pageLoading || !user || !user.is_admin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-muted">Securing admin environment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-6 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Administration Console</h1>
          <p className="text-muted mt-1">
            Monitor system-wide metrics, active user registrations, and mock practice sessions.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Registrations</span>
            <h3 className="text-3xl font-extrabold mt-1">{analytics?.total_users}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Interviews Started</span>
            <h3 className="text-3xl font-extrabold mt-1">{analytics?.total_sessions}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Interviews Completed</span>
            <h3 className="text-3xl font-extrabold mt-1">{analytics?.completed_sessions}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Global Score Average</span>
            <h3 className="text-3xl font-extrabold mt-1">
              {analytics?.average_score ? `${analytics.average_score}/10` : "N/A"}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Trophy className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* DATA MANAGEMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RECENT USERS DIRECTORY */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Active User Directory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-bold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Target Role</th>
                    <th className="py-2.5 px-3">Date Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recent_users.map((u) => (
                    <tr key={u.id} className="border-b border-border/20 text-sm hover:bg-secondary/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-muted font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold text-primary">{u.role}</td>
                      <td className="py-3 px-3 text-xs text-muted">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RECENT PRACTICE LOGS */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> System Interview Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-bold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Session Topic</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3 text-right">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recent_sessions.map((s) => (
                    <tr key={s.id} className="border-b border-border/20 text-sm hover:bg-secondary/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold">{s.topic}</div>
                        <div className="text-xs text-muted uppercase font-bold tracking-tight">Status: {s.status}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                          s.difficulty === "Easy" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                          s.difficulty === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                        }`}>
                          {s.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-primary">
                        {s.status === "completed" ? `${s.score}/10` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {s.status === "completed" && (
                          <button
                            onClick={() => router.push(`/interview/${s.id}/report`)}
                            className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Review <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
