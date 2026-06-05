import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antigravity AI Prep - Smart Interview Practice Platform",
  description: "Master your upcoming Python, Data Science, Machine Learning, and HR interviews through realistic, real-time AI mock interviews, code challenge sandboxes, and PDF analysis reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full flex flex-col">{children}</main>
          <footer className="w-full border-t border-border/40 py-6 px-4 text-center text-xs text-muted glass mt-auto">
            <div className="mx-auto max-w-7xl">
              &copy; {new Date().getFullYear()} Antigravity AI Prep. Built for job seekers, developers, and students.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

