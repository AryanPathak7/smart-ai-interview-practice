"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Calendar,
  Sparkles,
  Trophy,
  Upload,
  User,
  Settings,
  Brain,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

interface TopicScore {
  topic: string;
  average_score: number;
  count: number;
}

interface TrendPoint {
  date: string;
  score: number;
}

interface InterviewSession {
  id: number;
  topic: string;
  difficulty: string;
  status: string;
  overall_score: number;
  created_at: string;
}

interface LeaderboardItem {
  rank: number;
  name: string;
  average_score: number;
  interviews_completed: number;
}

interface DashboardData {
  total_interviews: number;
  average_score: number;
  streak_days: number;
  weakest_topics: TopicScore[];
  performance_trend: TrendPoint[];
  interview_history: InterviewSession[];
  leaderboard: LeaderboardItem[];
}

interface DailyChallenge {
  id: number;
  topic: string;
  question_text: string;
  assigned_date: string;
}

export default function Dashboard() {
  const { user, apiFetch, updateProfile, loading } = useAuth();
  const router = useRouter();

  // Component States
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [dailyAnswer, setDailyAnswer] = useState("");
  const [dailySubmitted, setDailySubmitted] = useState(false);
  const [dailyFeedback, setDailyFeedback] = useState<any>(null);
  const [dailySubmitting, setDailySubmitting] = useState(false);

  // Profile Edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Entry Level");
  const [profileSaving, setProfileSaving] = useState(false);

  // Resume Upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState({ type: "", text: "" });

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user) return;
    try {
      setPageLoading(true);
      setError("");
      
      // Load Stats
      const statsData = await apiFetch("/dashboard/stats");
      setStats(statsData);

      // Load Daily Challenge
      const dailyData = await apiFetch("/daily-challenges/today");
      setDailyChallenge(dailyData);

      // Load user profile details
      setFullName(user.full_name);
      setTargetRole(user.target_role);
      setSkills(user.skills);
      setExperienceLevel(user.experience_level);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        target_role: targetRole,
        skills,
        experience_level: experienceLevel
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Resume Upload
  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setResumeUploading(true);
    setResumeMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const response = await apiFetch("/resumes/upload", {
        method: "POST",
        body: formData, // fetch will set content-type automatically for FormData, but we must override token in apiFetch
      });
      setResumeMessage({ type: "success", text: `Resume "${response.filename}" successfully parsed! Skills updated.` });
      setResumeFile(null);
      // Reload stats and user settings
      await loadData();
    } catch (err: any) {
      setResumeMessage({ type: "error", text: err.message || "Resume parsing failed." });
    } finally {
      setResumeUploading(false);
    }
  };

  // Handle Daily Challenge Submit
  const handleDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyChallenge || !dailyAnswer.trim()) return;

    setDailySubmitting(true);
    try {
      const result = await apiFetch(`/daily-challenges/${dailyChallenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: dailyAnswer }),
      });
      setDailyFeedback(result);
      setDailySubmitted(true);
      // Reload history and stats
      const statsData = await apiFetch("/dashboard/stats");
      setStats(statsData);
    } catch (err: any) {
      alert("Failed to submit answer: " + err.message);
    } finally {
      setDailySubmitting(false);
    }
  };

  if (loading || pageLoading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-muted">Analyzing dashboard metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      
      {/* HEADER ROW */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.full_name}</h1>
          <p className="text-muted mt-1">
            Tailoring mock preparation for your target role: <span className="font-semibold text-primary">{user.target_role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-all cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Customize Profile
          </button>
          <button
            onClick={() => router.push("/interview")}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Start Mock Interview
          </button>
        </div>
      </div>

      {/* EDIT PROFILE DRAWER */}
      {isEditingProfile && (
        <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Target Profile Customization
          </h3>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="e.g. Data Scientist, Frontend Developer"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Core Skills (comma separated)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="e.g. Python, SQL, NLP"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
              >
                {profileSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Interviews Done</span>
            <h3 className="text-3xl font-extrabold mt-1">{stats?.total_interviews}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Average Score</span>
            <h3 className="text-3xl font-extrabold mt-1">
              {stats?.average_score && stats.average_score > 0 ? `${stats.average_score}/10` : "N/A"}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Trophy className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Current Streak</span>
            <h3 className="text-3xl font-extrabold mt-1">{stats?.streak_days} days</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
        
        {/* PROGRESS GRAPH */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Practice Performance Trend
          </h3>
          <div className="h-72 w-full mt-6">
            {stats?.performance_trend && stats.performance_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.performance_trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)"
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                No interview sessions completed yet. Take an interview to plot your score graph!
              </div>
            )}
          </div>
        </div>

        {/* PROFILE RESUME UPLOAD */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Resume Analysis (PDF)
            </h3>
            <p className="text-xs text-muted mb-6">
              Upload your PDF resume. Gemini will parse your details, identify skills, and generate custom-tailored interview challenges.
            </p>

            {resumeMessage.text && (
              <div className={`mb-6 rounded-lg border p-4 text-xs ${
                resumeMessage.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
                {resumeMessage.text}
              </div>
            )}

            <form onSubmit={handleResumeUpload} className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-secondary/50 hover:bg-secondary transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-8 h-8 text-muted mb-2" />
                    <p className="text-xs font-semibold text-muted">
                      {resumeFile ? resumeFile.name : "Click to select PDF resume"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!resumeFile || resumeUploading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {resumeUploading ? "Extracting skills..." : "Upload & Analyze"}
              </button>
            </form>
          </div>

          <div className="border-t border-border/40 pt-4 mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Current Identified Skills</h4>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.skills ? (
                user.skills.split(",").map((s) => (
                  <span key={s} className="rounded bg-primary/10 border border-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                    {s.trim()}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted italic">No skills listed yet. Set in profile or upload resume.</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECOND ROW GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* DAILY INTERVIEW CHALLENGE */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Daily Interview Challenge
            </h3>
            <span className="rounded bg-primary/10 border border-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
              {dailyChallenge?.topic}
            </span>
          </div>

          {dailyChallenge ? (
            <div>
              <p className="text-sm font-semibold mb-4 leading-relaxed">{dailyChallenge.question_text}</p>

              {dailySubmitted ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm">
                    <h4 className="font-bold text-emerald-500 flex items-center gap-1.5 mb-2">
                      <CheckCircle className="h-4 w-4" /> Evaluated Score: {dailyFeedback?.score}/100
                    </h4>
                    <p className="text-xs leading-relaxed text-muted mt-1">{dailyFeedback?.feedback}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDailySubmitted(false);
                      setDailyAnswer("");
                      setDailyFeedback(null);
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
                  >
                    Retry Challenge
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDailySubmit} className="space-y-4">
                  <textarea
                    rows={4}
                    value={dailyAnswer}
                    onChange={(e) => setDailyAnswer(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={dailySubmitting || !dailyAnswer.trim()}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {dailySubmitting ? "Evaluating response..." : "Submit Answer"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted italic">No daily challenge generated for today.</p>
          )}
        </div>

        {/* LEADERBOARD & WEAK TOPICS */}
        <div className="space-y-8">
          
          {/* WEAKEST TOPICS */}
          {stats?.weakest_topics && stats.weakest_topics.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Improvement Targets
              </h3>
              <div className="space-y-3">
                {stats.weakest_topics.map((t) => (
                  <div key={t.topic} className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div>
                      <span className="text-sm font-semibold">{t.topic}</span>
                      <span className="text-xs text-muted block">{t.count} practices completed</span>
                    </div>
                    <span className={`text-sm font-bold ${t.average_score < 7.0 ? "text-red-500" : "text-amber-500"}`}>
                      {t.average_score}/10 avg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEADERBOARD */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Platform Leaderboard
            </h3>
            <div className="space-y-3">
              {stats?.leaderboard.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      item.rank === 1 ? "bg-yellow-500 text-yellow-950" :
                      item.rank === 2 ? "bg-slate-300 text-slate-800" :
                      item.rank === 3 ? "bg-amber-600 text-amber-950" : "bg-secondary text-muted"
                    }`}>
                      {item.rank}
                    </span>
                    <div>
                      <span className="text-sm font-bold">{item.name}</span>
                      <span className="text-xs text-muted block">{item.interviews_completed} interviews</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{item.average_score}/10</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* RECENT SESSIONS TABLE */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Interview Practice History</h3>
        
        {stats?.interview_history && stats.interview_history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/40 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.interview_history.map((s) => (
                  <tr key={s.id} className="border-b border-border/20 text-sm hover:bg-secondary/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{s.topic}</td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold border ${
                        s.difficulty === "Easy" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        s.difficulty === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                      }`}>
                        {s.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold capitalize text-muted">
                      {s.status === "in_progress" ? "In Progress" : s.status}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-primary">
                      {s.status === "completed" ? `${s.overall_score}/10` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {s.status === "completed" ? (
                        <button
                          onClick={() => router.push(`/interview/${s.id}/report`)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Feedback Report <ChevronRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/interview/${s.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Resume Session <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 rounded-xl bg-secondary/20 border border-dashed border-border mt-4">
            <HelpCircle className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted">No interviews completed yet.</p>
            <button
              onClick={() => router.push("/interview")}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all"
            >
              Take Your First Mock Interview
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
