"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedShell from "@/lib/protected-shell";
import { getStudentLearningProfile, getLearningLevelFromProfile } from "@/lib/student-profile";

import { 
  getTrackerStats, 
  getActiveDoc, 
  calculateStreak, 
  TrackerStats, 
  ActiveDoc 
} from "@/lib/tracker";
import { 
  FileText, 
  Award, 
  MessageSquare, 
  Flame, 
  Plus, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  GraduationCap,
  Upload
} from "lucide-react";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);

  useEffect(() => {
    setMounted(true);
    setStats(getTrackerStats());
    setActiveDoc(getActiveDoc());

    const handleTrackerUpdate = () => {
      setStats(getTrackerStats());
    };
    const handleDocUpdate = () => {
      setActiveDoc(getActiveDoc());
    };

    window.addEventListener("learnsphere_tracker_update", handleTrackerUpdate);
    window.addEventListener("learnsphere_active_doc_update", handleDocUpdate);

    return () => {
      window.removeEventListener("learnsphere_tracker_update", handleTrackerUpdate);
      window.removeEventListener("learnsphere_active_doc_update", handleDocUpdate);
    };
  }, []);

  if (!mounted || !stats) {
    return (
      <ProtectedShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="h-4 w-72 rounded bg-slate-200"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-slate-200"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="col-span-2 h-72 rounded-3xl bg-slate-200"></div>
            <div className="h-72 rounded-3xl bg-slate-200"></div>
          </div>
        </div>
      </ProtectedShell>
    );
  }

  const streak = calculateStreak(stats.activeDates);
  const averageScore = stats.totalQuizQuestions > 0 
    ? (stats.totalCorrectQuizAnswers / stats.totalQuizQuestions) * 100 
    : 0;

  // Personalized learning profile (localStorage-based)
  const profile = getStudentLearningProfile();
  const learningLevel = getLearningLevelFromProfile(profile);




  // Prepare chart data (last 7 quiz attempts, chronological)
  const lastAttempts = stats.quizHistory.slice(0, 7).reverse();

  // SVG Chart Config
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = svgHeight - 2 * paddingY;

  const points = lastAttempts.map((attempt, index) => {
    const x = paddingX + (index * chartWidth) / (lastAttempts.length - 1 || 1);
    const y = paddingY + chartHeight - (attempt.percentage / 100) * chartHeight;
    return { x, y, ...attempt };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`
    : "";

  return (
    <ProtectedShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/10">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back, Learner!</h1>
            <p className="text-slate-300 max-w-xl text-sm">
              Keep learning and mastering your study documents. Check your stats, quiz yourself, and consult your AI study tutor below.
            </p>
          </div>
          <Link 
            href="/upload" 
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-slate-100 hover:scale-[1.02] shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            Upload PDF
          </Link>
        </div>

        {/* Personalized Learning Mode Card */}
        <div className="rounded-3xl border border-indigo-100/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-2">
                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                  Personalized Learning Mode Active
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-bold text-slate-900">Current Learning Level:</span>
                <span className="text-sm font-extrabold text-indigo-700">{learningLevel}</span>
              </div>
              <div className="text-xs text-slate-500">
                Weak Areas:
                {profile.weakTopics.length > 0 ? (
                  <span className="font-semibold text-slate-700"> {profile.weakTopics.join(", ")}</span>
                ) : (
                  <span className="font-semibold text-emerald-700"> (none detected yet)</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Score</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{profile.averageScore.toFixed(0)}%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Questions Asked</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{profile.questionsAsked}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">

          {/* Documents Card */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Docs Uploaded</span>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.documentsUploaded}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Uploaded study materials</p>
            </div>
          </div>

          {/* Quizzes Attempted */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quizzes Taken</span>
              <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.quizzesAttempted}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Multiple-choice attempts</p>
            </div>
          </div>

          {/* Average Score */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Quiz Score</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{averageScore.toFixed(0)}%</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Correct answers average</p>
            </div>
          </div>

          {/* Questions Asked */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions Asked</span>
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{stats.questionsAsked}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Tutor assistant questions</p>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="col-span-2 lg:col-span-1 rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow transition bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-orange-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Study Streak</span>
              <div className="rounded-xl bg-orange-100 p-2 text-orange-600 animate-bounce">
                <Flame className="h-5 w-5 fill-orange-600 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-slate-900">{streak} {streak === 1 ? "Day" : "Days"}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Consecutive study days</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Details Panel */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Chart Section */}
          <div className="md:col-span-2 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quiz Score History</h2>
                <p className="text-xs text-slate-500">Score percentage on your last 7 quiz attempts</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase">
                Progress Chart
              </span>
            </div>

            {lastAttempts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 p-6 text-center">
                <GraduationCap className="h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No quiz data yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">Upload a document and attempt a quiz to visualize your score progression.</p>
              </div>
            ) : (
              <div className="relative w-full h-48">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline Grids */}
                  {[0, 25, 50, 75, 100].map((level) => {
                    const y = paddingY + chartHeight - (level / 100) * chartHeight;
                    return (
                      <g key={level}>
                        <line 
                          x1={paddingX} 
                          y1={y} 
                          x2={svgWidth - paddingX} 
                          y2={y} 
                          className="stroke-slate-100" 
                          strokeWidth="1"
                        />
                        <text 
                          x={paddingX - 10} 
                          y={y + 4} 
                          textAnchor="end" 
                          className="fill-slate-400 text-[9px] font-semibold font-mono"
                        >
                          {level}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Under Line (Gradient) */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#chart-grad)" />
                  )}

                  {/* Score Path Line */}
                  {linePath && (
                    <path 
                      d={linePath} 
                      fill="none" 
                      className="stroke-indigo-600" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {/* Interactive Nodes */}
                  {points.map((p, i) => (
                    <g key={i} className="group/node cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4.5" 
                        className="fill-indigo-600 stroke-white stroke-2 transition-all group-hover/node:r-6 group-hover/node:fill-indigo-700" 
                      />
                      
                      {/* Tooltip Overlay */}
                      <g className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-150 pointer-events-none">
                        <rect 
                          x={p.x - 32} 
                          y={p.y - 32} 
                          width="64" 
                          height="20" 
                          rx="6" 
                          className="fill-slate-900 shadow-lg" 
                        />
                        <text 
                          x={p.x} 
                          y={p.y - 19} 
                          textAnchor="middle" 
                          className="fill-white text-[9px] font-bold font-mono"
                        >
                          {p.percentage.toFixed(0)}% ({p.score}/{p.totalQuestions})
                        </text>
                      </g>

                      {/* X-axis labels (Quiz Attempt Index) */}
                      <text 
                        x={p.x} 
                        y={svgHeight - 4} 
                        textAnchor="middle" 
                        className="fill-slate-500 text-[9px] font-bold"
                      >
                        Q#{lastAttempts.length - i}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* Active Workspace / PDF Widget */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-slate-900">Current Material</h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              {activeDoc ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 flex items-start gap-3">
                    <FileText className="h-6 w-6 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{activeDoc.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{activeDoc.pageCount} pages extracted</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You have this document active. You can immediately generate summary notes, practice quizzes, or initiate a chat session.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center py-6">
                  <BrainCircuit className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No active document</p>
                  <p className="text-[10px] text-slate-400 mt-1">Upload a PDF to activate workspace features.</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              {activeDoc ? (
                <div className="space-y-2">
                  <Link 
                    href="/chat" 
                    className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 p-3 text-xs font-semibold text-slate-900 group"
                  >
                    <span>Ask AI Assistant</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                  <Link 
                    href="/quiz" 
                    className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 p-3 text-xs font-semibold text-slate-900 group"
                  >
                    <span>Attempt AI Quiz</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                </div>
              ) : (
                <Link 
                  href="/upload" 
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white p-3 transition"
                >
                  <Upload className="h-4 w-4" />
                  Get Started: Upload
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedShell>
  );
}
