"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: number;
  email: string;
  full_name: string;
  target_role: string;
  skills: string;
  experience_level: string;
  is_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string) => Promise<void>;
  googleLogin: (mockEmail: string, mockName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" 
    ? "/_/backend/api" 
    : "http://localhost:8000/api");


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  // Initialize Auth & Theme
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedTheme = localStorage.getItem("theme");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    const isDark = storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setLoading(false);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Base API fetch helper
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${path}`;
    const headers = new Headers(options.headers || {});
    
    // Attach token if present
    const currentToken = token || localStorage.getItem("token");
    if (currentToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error occurred" }));
      throw new Error(errorData.detail || "Request failed");
    }

    return response.json();
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, full_name: string) => {
    setLoading(true);
    try {
      const newUser = await apiFetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name }),
      });
      
      // Automatically log in after signup
      await login(email, password);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (mockEmail: string, mockName: string) => {
    setLoading(true);
    try {
      // Create a mock token format matching the backend verify helper
      const mockToken = `mock_google_${mockEmail}_${mockName.replace(/\s+/g, "-")}`;
      const data = await apiFetch("/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mockToken }),
      });

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const updatedUser = await apiFetch("/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        darkMode,
        toggleDarkMode,
        login,
        signup,
        googleLogin,
        logout,
        updateProfile,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
