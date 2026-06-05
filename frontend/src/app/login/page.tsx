"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  const { user, login, googleLogin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setAuthLoading(true);
    try {
      // Prompt user for Google login simulation details (very elegant for testing!)
      const mockEmail = prompt("Enter your Gmail address to simulate Google Sign-in:", "candidate@gmail.com");
      if (!mockEmail) return;
      const mockName = prompt("Enter your Full Name:", "Google Candidate");
      if (!mockName) return;

      await googleLogin(mockEmail, mockName);
    } catch (err: any) {
      setError(err.message || "Google Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        
        {/* LOGO */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted">
            Or{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/90 transition-colors">
              create a new account for free
            </Link>
          </p>
        </div>

        {/* CARD CONTAINER */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-xl glass">
          
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold">
                Email address
              </label>
              <div className="relative mt-2 rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold">
                  Password
                </label>
                <div className="text-xs">
                  <a href="#" className="font-semibold text-primary hover:underline" onClick={() => alert("Credentials: Use candidate@example.com / password123 for default demo login.")}>
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="relative mt-2 rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading || loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? "Logging in..." : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* GOOGLE SIGN IN */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs font-semibold uppercase">
              <span className="bg-card px-3 text-muted">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading || loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Quick Demo Info */}
          <div className="mt-8 rounded-lg bg-primary/5 border border-primary/10 p-4 text-xs">
            <h4 className="font-semibold text-primary mb-1">Quick Demo Login</h4>
            <p className="text-muted leading-relaxed">
              Email: <span className="font-mono text-foreground font-bold">candidate@example.com</span><br/>
              Password: <span className="font-mono text-foreground font-bold">password123</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
