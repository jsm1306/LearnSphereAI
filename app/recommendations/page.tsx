"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedShell from "@/lib/protected-shell";
import { 
  getActiveDoc, 
  getLatestRecommendations, 
  ActiveDoc 
} from "@/lib/tracker";
import { 
  Lightbulb, 
  Upload, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  BookOpen, 
  CheckCircle2, 
  Award,
  AwardIcon,
  HelpCircle
} from "lucide-react";

interface Recommendations {
  documentName: string;
  weakAreas: string[];
  revisionTopics: string[];
  studyPlan: string[];
  score: number;
  totalQuestions: number;
  timestamp: number;
}

export default function RecommendationsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);
  const [recs, setRecs] = useState<Recommendations | null>(null);

  useEffect(() => {
    setMounted(true);
    setActiveDoc(getActiveDoc());
    setRecs(getLatestRecommendations());

    const handleRecsUpdate = () => {
      setRecs(getLatestRecommendations());
    };
    window.addEventListener("learnsphere_recs_update", handleRecsUpdate);
    return () => {
      window.removeEventListener("learnsphere_recs_update", handleRecsUpdate);
    };
  }, []);

  if (!mounted) {
    return (
      <ProtectedShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="h-4 w-72 rounded bg-slate-200"></div>
          <div className="h-64 rounded-3xl bg-slate-200"></div>
        </div>
      </ProtectedShell>
    );
  }

  return (
    <ProtectedShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-indigo-600 animate-pulse" />
            AI Recommendations
          </h1>
          {activeDoc ? (
            <p className="text-xs text-slate-500 mt-1">
              Active Workspace: <span className="font-semibold text-indigo-600">{activeDoc.name}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Personalized study guidance</p>
          )}
        </div>

        {/* Validation Panel */}
        {!activeDoc ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center py-12">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 mb-4 animate-pulse">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">No Active Study Document</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Upload a document and attempt a practice quiz first. The AI tutor requires quiz results to analyze incorrect answers and formulate specific recommendations.
            </p>
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white px-5 py-3 mt-6 shadow-sm transition hover:scale-[1.02]"
            >
              <Upload className="h-4 w-4" />
              Upload PDF
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : !recs || recs.documentName !== activeDoc.name ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center py-12">
            <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600 mb-3">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 font-sans">No Quiz Data</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              We don't have recommendations for <span className="font-semibold text-indigo-600">{activeDoc.name}</span> yet. Head over to the quiz section to evaluate your understanding.
            </p>
            <Link 
              href="/quiz" 
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white px-5 py-3 mt-6 shadow-sm transition hover:scale-[1.02]"
            >
              <HelpCircle className="h-4 w-4" />
              Take Practice Quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Meta Card Banner */}
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Study Guide Prepared</h3>
                <p className="text-xs text-slate-500">
                  Based on your quiz score of <span className="font-bold text-indigo-600">{recs.score}/{recs.totalQuestions}</span> ({((recs.score/recs.totalQuestions)*100).toFixed(0)}%)
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full shrink-0">
                Generated {new Date(recs.timestamp).toLocaleDateString()}
              </span>
            </div>

            {/* Recommendations Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Weak Areas Card */}
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-50 p-2.5 text-red-600 shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Weak Areas</h3>
                  </div>
                  
                  {recs.weakAreas.length > 0 ? (
                    <ul className="space-y-3">
                      {recs.weakAreas.map((area, i) => (
                        <li key={i} className="text-xs text-slate-600 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-red-500">
                          {area}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Excellent job! The AI didn't flag any severe conceptual weaknesses. Keep reinforcing this baseline.
                    </p>
                  )}
                </div>
              </div>

              {/* Revision Topics Card */}
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 shrink-0">
                      <Compass className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Topics to Revise</h3>
                  </div>

                  {recs.revisionTopics.length > 0 ? (
                    <ul className="space-y-3">
                      {recs.revisionTopics.map((topic, i) => (
                        <li key={i} className="text-xs text-slate-600 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber-500">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      No topics require urgent review. Focus on exploring new concepts!
                    </p>
                  )}
                </div>
              </div>

              {/* Study Plan Card */}
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Study Action Plan</h3>
                  </div>

                  {recs.studyPlan.length > 0 ? (
                    <ol className="space-y-3 pl-4 list-decimal text-xs text-slate-600 leading-relaxed marker:font-bold marker:text-emerald-600">
                      {recs.studyPlan.map((step, i) => (
                        <li key={i} className="pl-1">
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Continue with your default reading program. Retake the quiz if you want a new plan.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action links */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link 
                href="/chat" 
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Chat with Tutor
              </Link>
              <Link 
                href="/quiz" 
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition hover:scale-[1.02]"
              >
                Retake Quiz
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProtectedShell>
  );
}
