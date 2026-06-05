"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Code,
  Trophy,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ShieldAlert,
  GraduationCap
} from "lucide-react";

export default function Navbar() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: GraduationCap },
    { name: "Coding challenges", href: "/challenges", icon: Code },
  ];

  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-border/40 px-4 transition-all lg:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        
        {/* LOGO */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <Sparkles className="h-6 w-6 animate-pulse" />
          <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent dark:from-primary dark:to-accent">
            Antigravity AI Prep
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden items-center gap-6 md:flex">
          {user &&
            navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? "text-primary" : "text-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}

          {user?.is_admin && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                isActive("/admin") ? "text-primary" : "text-muted"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-4 border-l border-border pl-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-none">{user.full_name}</span>
                  <span className="text-xs text-muted mt-0.5">{user.target_role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE NAV BUTTON */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-muted hover:bg-secondary hover:text-foreground"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground"
            aria-label="Open Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* MOBILE NAV MENU */}
      {isOpen && (
        <div className="border-t border-border/40 py-4 md:hidden animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3 px-2">
            {user && (
              <>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                        isActive(link.href) ? "bg-secondary text-primary" : "text-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  );
                })}
                {user.is_admin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                      isActive("/admin") ? "bg-secondary text-primary" : "text-muted"
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                <div className="my-2 border-t border-border/40" />
                <div className="flex items-center gap-3 px-3 py-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.full_name}</span>
                    <span className="text-xs text-muted">{user.target_role}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            )}

            {!user && (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm font-semibold hover:bg-secondary"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
