"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedShell from "@/lib/protected-shell";
import { getTrackerStats, TrackerStats } from "@/lib/tracker";
import { 
  BarChart2, 
  Award, 
  FileText, 
  HelpCircle, 
  ArrowRight,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  BookOpen
} from "lucide-react";

export default function ProgressPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<TrackerStats | null>(null);

  useEffect(() => {
    setMounted(true);
    setStats(getTrackerStats());

    const handleTrackerUpdate = () => {
      setStats(getTrackerStats());
    };
    window.addEventListener("learnsphere_tracker_update", handleTrackerUpdate);
    return () => {
      window.removeEventListener("learnsphere_tracker_update", handleTrackerUpdate);
    };
  }, []);

  if (!mounted || !stats) {
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

  const averageScore = stats.totalQuizQuestions > 0 
    ? (stats.totalCorrectQuizAnswers / stats.totalQuizQuestions) * 100 
    : 0;

  return (
    <ProtectedShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-indigo-600" />
              Learning Progress Tracker
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical analytics of quizzes taken, questions answered, and scores achieved.
            </p>
          </div>
          
          <Link 
            href="/quiz" 
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Practice Quiz
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Detailed Stats Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Quizzes Taken */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quizzes</span>
              <Award className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3">{stats.quizzesAttempted}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Self-assessment quizzes taken</p>
          </div>

          {/* Average Score */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</span>
              <BarChart2 className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3">{averageScore.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Overall correct percentage</p>
          </div>

          {/* Highest Score */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest Score</span>
              <Award className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3">{stats.highestScorePercentage.toFixed(0)}%</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Peak quiz result percentage</p>
          </div>

          {/* Total Questions Answered */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions Answered</span>
              <HelpCircle className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3">{stats.totalQuizQuestions}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Total questions completed</p>
          </div>
        </div>

        {/* Quiz History Log Card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Attempt History Log</h2>
              <p className="text-xs text-slate-500">Record of all practice questions graded by AI</p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              {stats.quizHistory.length} attempts
            </span>
          </div>

          {stats.quizHistory.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No attempts logged yet</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                Take a quiz on any uploaded study document to begin compiling your history log.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Document Title</th>
                    <th className="px-6 py-4">Questions Checked</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stats.quizHistory.map((item, index) => {
                    const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });
                    const passed = item.percentage >= 70;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition">
                        {/* Date */}
                        <td className="px-6 py-4 font-semibold text-slate-600 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {dateStr}
                        </td>
                        {/* Document Title */}
                        <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">
                          {item.documentName}
                        </td>
                        {/* Questions Checked */}
                        <td className="px-6 py-4 font-medium text-slate-500 font-mono">
                          {item.totalQuestions} questions
                        </td>
                        {/* Score */}
                        <td className="px-6 py-4 font-extrabold text-slate-900 font-mono">
                          {item.score} / {item.totalQuestions}
                        </td>
                        {/* Percentage */}
                        <td className="px-6 py-4 font-extrabold text-indigo-600 font-mono">
                          {item.percentage.toFixed(0)}%
                        </td>
                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {passed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle className="h-3 w-3" />
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              <XCircle className="h-3 w-3" />
                              Revise
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedShell>
  );
}
