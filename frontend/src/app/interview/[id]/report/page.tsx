"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Trophy,
  Calendar,
  Sparkles,
  Download,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Cpu,
  CornerDownRight
} from "lucide-react";
import jsPDF from "jspdf";

interface ResponseDetail {
  id: number;
  question_text: string;
  user_answer: string;
  score_technical: number;
  score_communication: number;
  score_confidence: number;
  score_completeness: number;
  feedback: string;
}

interface SessionDetail {
  id: number;
  topic: string;
  difficulty: string;
  status: string;
  overall_score: number;
  score_technical: number;
  score_communication: number;
  score_confidence: number;
  score_completeness: number;
  feedback: string;
  strengths: string;
  weaknesses: string;
  recommended_resources: string;
  created_at: string;
  responses: ResponseDetail[];
}

export default function InterviewReport() {
  const { id } = useParams();
  const { user, apiFetch, loading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Accordion active index for question details
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setPageLoading(true);
        const data = await apiFetch(`/interviews/sessions/${id}`);
        setSession(data);
      } catch (err: any) {
        setError(err.message || "Failed to load report data");
      } finally {
        setPageLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Compile and Download Report as PDF
  const downloadPDF = () => {
    if (!session || !user) return;

    const doc = new jsPDF();
    const primaryColor = "#4f46e5";
    const textColor = "#1f2937";
    const lightText = "#6b7280";

    // Accent Header Banner
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 0, 210, 40, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Antigravity AI Prep - Scorecard", 14, 25);

    // Meta details
    doc.setTextColor(textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Candidate Name: ${user.full_name}`, 14, 50);
    doc.text(`Target Role: ${user.target_role}`, 14, 56);
    doc.text(`Interview Topic: ${session.topic}`, 14, 62);
    doc.text(`Difficulty: ${session.difficulty}`, 14, 68);
    doc.text(`Date completed: ${new Date(session.created_at).toLocaleDateString()}`, 14, 74);

    // Overall Score Box
    doc.setFillColor(243, 244, 246);
    doc.rect(135, 47, 60, 28, "F");
    doc.setDrawColor(229, 231, 235);
    doc.rect(135, 47, 60, 28, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OVERALL GRADE", 145, 54);
    doc.setFontSize(26);
    doc.setTextColor(79, 70, 229);
    doc.text(`${session.overall_score}/10`, 145, 68);

    doc.setDrawColor(209, 213, 219);
    doc.line(14, 84, 196, 84);

    // Score dimensions
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Evaluated Performance Metrics", 14, 94);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Technical Accuracy:  ${session.score_technical}/10`, 14, 104);
    doc.text(`Communication Skills: ${session.score_communication}/10`, 14, 110);
    doc.text(`Behavioral Confidence: ${session.score_confidence}/10`, 14, 116);
    doc.text(`Answer Completeness:  ${session.score_completeness}/10`, 14, 122);

    // Detailed Feedback
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AI Interviewer Summary Notes", 14, 134);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const feedbackLines = doc.splitTextToSize(session.feedback, 180);
    doc.text(feedbackLines, 14, 142);

    // Strengths & Weaknesses
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Key Strengths", 14, 168);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const strengthLines = doc.splitTextToSize(session.strengths, 180);
    doc.text(strengthLines, 14, 174);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Improvement Targets", 14, 192);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const weaknessLines = doc.splitTextToSize(session.weaknesses, 180);
    doc.text(weaknessLines, 14, 198);

    // Page 2 - Question Breakdown
    doc.addPage();
    
    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Question-by-Question Evaluation Breakdown", 14, 14);

    let yPosition = 35;
    session.responses.forEach((resp, idx) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 25;
      }

      doc.setTextColor(textColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Q${idx + 1}: ${resp.question_text.substring(0, 85)}...`, 14, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Score: Tech Accuracy (${resp.score_technical}/10), Comm (${resp.score_communication}/10)`, 14, yPosition);
      yPosition += 6;

      doc.setTextColor(lightText);
      const ansLines = doc.splitTextToSize(`Your Response: "${resp.user_answer.substring(0, 150)}..."`, 175);
      doc.text(ansLines, 14, yPosition);
      yPosition += (ansLines.length * 5) + 4;

      doc.setTextColor(textColor);
      const evalLines = doc.splitTextToSize(`Feedback: ${resp.feedback}`, 175);
      doc.text(evalLines, 14, yPosition);
      yPosition += (evalLines.length * 5) + 8;
      
      doc.setDrawColor(243, 244, 246);
      doc.line(14, yPosition - 4, 196, yPosition - 4);
    });

    doc.save(`Interview_Report_${session.topic.replace(/\s+/g, "_")}.pdf`);
  };

  if (loading || pageLoading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-muted">Compiling metrics scorecard...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Failed to load scorecard</h2>
        <p className="text-muted text-sm mt-2">{error || "Interview details could not be found."}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const scoreMetrics = [
    { name: "Technical Accuracy", score: session.score_technical, desc: "Precision of code details and concept definitions." },
    { name: "Communication Skills", score: session.score_communication, desc: "Articulation, structure, and STAR model delivery." },
    { name: "Behavioral Confidence", score: session.score_confidence, desc: "Professional tone, clarity, and phrasing composure." },
    { name: "Answer Completeness", score: session.score_completeness, desc: "Addressed all sub-points and explained complexities." }
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8">
      
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 cursor-pointer"
        >
          <Download className="h-4.5 w-4.5" />
          Download PDF Report
        </button>
      </div>

      {/* OVERALL RESULTS CARD */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl glass mb-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Overall Circle */}
        <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border/40 pb-6 md:pb-0 md:pr-8">
          <span className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Overall Score</span>
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-primary bg-primary/5 shadow-inner">
            <span className="text-4xl font-extrabold tracking-tight text-primary">{session.overall_score}</span>
            <span className="text-xs text-muted absolute bottom-5">Scale: 0–10</span>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold px-3 py-1 mt-4">
            Passed Mock Practice
          </span>
        </div>

        {/* Evaluation Summary */}
        <div className="md:col-span-2 space-y-4 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">AI Evaluation Summary</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">{session.feedback}</p>
          <div className="grid grid-cols-2 gap-4 text-xs mt-4">
            <div>
              <span className="text-muted block uppercase tracking-wider font-bold">Interview Topic</span>
              <span className="text-sm font-bold mt-1 block">{session.topic}</span>
            </div>
            <div>
              <span className="text-muted block uppercase tracking-wider font-bold">Practice Difficulty</span>
              <span className="text-sm font-bold mt-1 block">{session.difficulty}</span>
            </div>
          </div>
        </div>

      </div>

      {/* FOUR DIMENSIONAL METRICS CARD */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {scoreMetrics.map((m) => {
          let scoreColor = "text-primary border-primary bg-primary/5";
          if (m.score < 6.0) scoreColor = "text-red-500 border-red-500 bg-red-500/5";
          else if (m.score < 8.0) scoreColor = "text-amber-500 border-amber-500 bg-amber-500/5";
          
          return (
            <div key={m.name} className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-3">{m.name}</span>
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 font-extrabold text-2xl ${scoreColor}`}>
                {m.score}
              </div>
              <p className="text-[11px] text-muted mt-4 leading-relaxed">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* STRENGTHS, WEAKNESSES, RESOURCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* STRENGTHS & WEAKNESSES */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 text-emerald-500 mb-3">
              <CheckCircle className="h-5 w-5" /> Demonstrated Strengths
            </h3>
            <p className="text-sm text-muted leading-relaxed">{session.strengths}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 text-amber-500 mb-3">
              <AlertTriangle className="h-5 w-5" /> Recommended Improvements
            </h3>
            <p className="text-sm text-muted leading-relaxed">{session.weaknesses}</p>
          </div>
        </div>

        {/* RESOURCES */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 text-indigo-500 mb-4">
              <BookOpen className="h-5 w-5" /> Curated Learning Resources
            </h3>
            <div className="space-y-3">
              {session.recommended_resources.split(",").map((res, index) => (
                <div key={index} className="flex gap-2 text-sm text-muted items-start">
                  <CornerDownRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{res.trim()}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 mt-6 text-xs text-muted flex gap-2">
            <Cpu className="h-5 w-5 text-primary shrink-0" />
            <span>Learning pathways are dynamically customized by our AI compiler based on weak answer responses.</span>
          </div>
        </div>

      </div>

      {/* QUESTION BY QUESTION ACCORDION */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Question Response Review</h3>

        <div className="space-y-4">
          {session.responses.map((resp, index) => {
            const isOpen = activeIndex === index;
            return (
              <div key={resp.id} className="rounded-lg border border-border overflow-hidden">
                
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 text-left transition-colors cursor-pointer"
                >
                  <div className="pr-4">
                    <span className="text-xs font-bold text-primary uppercase block">Question {index + 1}</span>
                    <span className="text-sm font-semibold text-foreground line-clamp-1 mt-0.5">
                      {resp.question_text}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-muted" /> : <ChevronDown className="h-5 w-5 text-muted" />}
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="p-5 border-t border-border/40 space-y-4 text-sm animate-in fade-in duration-200">
                    
                    {/* User Answer */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">Your Submitted Response</span>
                      <p className="rounded bg-secondary p-3 text-sm italic leading-relaxed text-foreground border border-border/20">
                        "{resp.user_answer}"
                      </p>
                    </div>

                    {/* AI Feedback Report */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Evaluation Breakdown</span>
                      <div className="p-3 text-muted leading-relaxed bg-primary/5 border border-primary/10 rounded">
                        {resp.feedback}
                        
                        {/* Dimensional scores within question */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-foreground mt-4 pt-4 border-t border-primary/10">
                          <div>Tech Accuracy: {resp.score_technical}/10</div>
                          <div>Communication: {resp.score_communication}/10</div>
                          <div>Confidence: {resp.score_confidence}/10</div>
                          <div>Completeness: {resp.score_completeness}/10</div>
                        </div>
                      </div>
                    </div>

                    {/* Sample Answer */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Sample Ideal Response Reference</span>
                      <p className="rounded bg-emerald-500/5 p-3 text-sm text-emerald-950 dark:text-emerald-300 border border-emerald-500/10 leading-relaxed">
                        To score perfectly, a response should detail standard definitions, illustrate with examples, outline complexity, and structure using the STAR model.
                      </p>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
