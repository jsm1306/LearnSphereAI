"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedShell from "@/lib/protected-shell";
import { 
  getActiveDoc, 
  trackQuizSubmission, 
  saveLatestRecommendations, 
  ActiveDoc 
} from "@/lib/tracker";
import { 
  Award, 
  Upload, 
  AlertTriangle, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  BookOpen,
  RefreshCw
} from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function QuizPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);

  // Quiz questions state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // User input states
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Recommendations state
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [hasRecs, setHasRecs] = useState(false);

  useEffect(() => {
    setMounted(true);
    const doc = getActiveDoc();
    setActiveDoc(doc);

    if (doc) {
      const questionsKey = `learnsphere_quiz_questions_${doc.name}`;
      const submissionKey = `learnsphere_quiz_submission_${doc.name}`;
      try {
        const cachedQuestions = localStorage.getItem(questionsKey);
        if (cachedQuestions) {
          setQuizQuestions(JSON.parse(cachedQuestions));
        }

        const cachedSubmission = localStorage.getItem(submissionKey);
        if (cachedSubmission) {
          const parsed = JSON.parse(cachedSubmission);
          setUserAnswers(parsed.answers || {});
          setQuizSubmitted(parsed.submitted || false);
          setQuizScore(parsed.score || 0);
          setHasRecs(parsed.hasRecs || false);
        }
      } catch (e) {
        console.error("Failed to load cached quiz state:", e);
      }
    }
  }, []);

  // Sync submission state to localStorage
  const saveQuizState = (
    answers: { [key: number]: string },
    submitted: boolean,
    score: number,
    hasRecsVal: boolean
  ) => {
    if (!activeDoc) return;
    const submissionKey = `learnsphere_quiz_submission_${activeDoc.name}`;
    try {
      localStorage.setItem(
        submissionKey,
        JSON.stringify({ answers, submitted, score, hasRecs: hasRecsVal })
      );
    } catch (e) {
      console.error("Failed to save quiz state:", e);
    }
  };

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

  const handleGenerateQuiz = async () => {
    setQuizError(null);
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setHasRecs(false);

    if (!activeDoc || !activeDoc.text) {
      setQuizError("Upload a PDF before generating a quiz.");
      return;
    }

    try {
      setQuizLoading(true);
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: activeDoc.text,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to generate quiz");
      }

      const data = await response.json();

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid quiz format received");
      }

      setQuizQuestions(data.questions);

      // Cache questions
      const questionsKey = `learnsphere_quiz_questions_${activeDoc.name}`;
      localStorage.setItem(questionsKey, JSON.stringify(data.questions));
      saveQuizState({}, false, 0, false);
    } catch (caught) {
      setQuizError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeDoc) return;
    let score = 0;

    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        score += 1;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);
    
    // Save attempt to global progress tracker
    trackQuizSubmission(score, quizQuestions.length, activeDoc.name);
    saveQuizState(userAnswers, true, score, false);
  };

  const handleGetRecommendations = async () => {
    setRecsError(null);

    if (!activeDoc || !quizQuestions.length) {
      setRecsError("Generate and submit a quiz before requesting recommendations.");
      return;
    }

    const incorrectQuestions = quizQuestions
      .map((q, index) => ({ q, index }))
      .filter(({ q, index }) => userAnswers[index] !== q.correctAnswer)
      .map(({ q }) => q.question);

    try {
      setRecsLoading(true);

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: activeDoc.text,
          score: quizScore,
          totalQuestions: quizQuestions.length,
          incorrectQuestions,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to get recommendations");
      }

      const data = await response.json();

      // Save to tracker storage
      saveLatestRecommendations({
        documentName: activeDoc.name,
        weakAreas: Array.isArray(data.weakAreas) ? data.weakAreas : [],
        revisionTopics: Array.isArray(data.revisionTopics) ? data.revisionTopics : [],
        studyPlan: Array.isArray(data.studyPlan) ? data.studyPlan : [],
        score: quizScore,
        totalQuestions: quizQuestions.length,
        timestamp: Date.now()
      });

      setHasRecs(true);
      saveQuizState(userAnswers, true, quizScore, true);

      // Redirect user to the recommendations page
      router.push("/recommendations");
    } catch (caught) {
      setRecsError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRecsLoading(false);
    }
  };

  const handleResetQuiz = () => {
    if (!activeDoc) return;
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setHasRecs(false);
    saveQuizState({}, false, 0, false);
  };

  return (
    <ProtectedShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-600" />
            AI Practice Quiz
          </h1>
          {activeDoc ? (
            <p className="text-xs text-slate-500 mt-1">
              Active Document: <span className="font-semibold text-indigo-600">{activeDoc.name}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Generate self-assessment questions</p>
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
              To test your understanding, please upload a study document. Our AI will analyze the text to generate 10 unique multiple-choice questions.
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
        ) : (
          <div className="space-y-6">
            {/* Generate Quiz Action Banner */}
            {quizQuestions.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center text-center">
                <HelpCircle className="h-12 w-12 text-indigo-500 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">Assess Your Knowledge</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                  Generate 10 interactive multiple-choice questions tailored to the contents of <span className="font-semibold text-indigo-600">{activeDoc.name}</span>.
                </p>

                {quizError && (
                  <div className="mt-4 w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {quizError}
                  </div>
                )}

                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white px-6 py-3 mt-6 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quizLoading ? "Analyzing & Generating…" : "Generate AI Quiz"}
                </button>
              </div>
            )}

            {/* Quiz loading skeletal state */}
            {quizLoading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <p className="text-sm font-bold text-slate-600 animate-pulse">Formulating educational quiz questions…</p>
                <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto mt-4">
                  <div className="bg-indigo-600 h-full w-1/3 rounded-full animate-[loading_1.5s_infinite]"></div>
                </div>
              </div>
            )}

            {/* Quiz Interface */}
            {quizQuestions.length > 0 && (
              <div className="space-y-6">
                {/* Top Score Banner if submitted */}
                {quizSubmitted && (
                  <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-8 text-center text-white shadow-lg shadow-indigo-950/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left space-y-1">
                      <h3 className="text-xl font-bold">Quiz Results Submitted!</h3>
                      <p className="text-xs text-slate-400">Your score has been stored in your learning profile.</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="bg-white/10 rounded-2xl px-6 py-4 text-center border border-white/10 shrink-0">
                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Score</span>
                        <p className="text-3xl font-extrabold text-white mt-1">
                          {quizScore} <span className="text-lg font-medium text-slate-400">/ {quizQuestions.length}</span>
                        </p>
                      </div>

                      <div className="bg-white/10 rounded-2xl px-6 py-4 text-center border border-white/10 shrink-0">
                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Percentage</span>
                        <p className="text-3xl font-extrabold text-white mt-1">
                          {((quizScore / quizQuestions.length) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Cards */}
                <div className="space-y-4">
                  {quizQuestions.map((q, index) => {
                    const selectedOption = userAnswers[index];
                    const isCorrect = selectedOption === q.correctAnswer;
                    
                    return (
                      <div 
                        key={index} 
                        className={`rounded-3xl border p-6 transition duration-150 ${
                          !quizSubmitted 
                            ? "border-slate-200 bg-white" 
                            : isCorrect 
                              ? "border-emerald-200 bg-emerald-50/40" 
                              : "border-red-200 bg-red-50/40"
                        }`}
                      >
                        <h4 className="text-base font-bold text-slate-900 flex items-start gap-2.5">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-extrabold text-indigo-700 shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          {q.question}
                        </h4>

                        <div className="mt-4 space-y-2.5 pl-8">
                          {q.options.map((option, optIndex) => {
                            const isSelected = selectedOption === option;
                            const isThisCorrect = q.correctAnswer === option;
                            
                            let optionStyle = "border-slate-200 hover:border-slate-300 bg-white";
                            if (isSelected) optionStyle = "border-indigo-600 bg-indigo-50/20";
                            
                            if (quizSubmitted) {
                              if (isThisCorrect) {
                                optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                              } else if (isSelected && !isCorrect) {
                                optionStyle = "border-red-400 bg-red-50 text-red-900";
                              } else {
                                optionStyle = "border-slate-200 bg-slate-50/30 opacity-60";
                              }
                            }

                            return (
                              <label 
                                key={optIndex} 
                                className={`flex items-center gap-3 border rounded-2xl px-4 py-3 cursor-pointer transition text-sm ${optionStyle}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option}
                                  checked={isSelected}
                                  disabled={quizSubmitted}
                                  onChange={() => {
                                    const nextAnswers = { ...userAnswers, [index]: option };
                                    setUserAnswers(nextAnswers);
                                    saveQuizState(nextAnswers, false, 0, false);
                                  }}
                                  className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="flex-1 select-none">{option}</span>
                                
                                {quizSubmitted && isThisCorrect && (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                                )}
                                {quizSubmitted && isSelected && !isCorrect && (
                                  <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer quiz actions */}
                <div className="flex flex-col gap-4">
                  {!quizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(userAnswers).length !== quizQuestions.length}
                      className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-4 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
                    >
                      Submit Answers ({Object.keys(userAnswers).length} / {quizQuestions.length})
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleGetRecommendations}
                        disabled={recsLoading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-700 px-6 py-4 text-sm font-bold text-white transition disabled:opacity-50 shadow-md shadow-violet-600/10"
                      >
                        <Sparkles className="h-4 w-4" />
                        {recsLoading ? "Generating Recommendations…" : "Get AI Study Recommendations"}
                      </button>

                      {recsError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                          {recsError}
                        </div>
                      )}

                      {hasRecs && (
                        <Link
                          href="/recommendations"
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <BookOpen className="h-4 w-4" />
                          View Active Study Plan
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}

                      <button
                        onClick={handleResetQuiz}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retake Quiz
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateQuiz}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-xs font-semibold text-slate-500 hover:bg-slate-100/60 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate Entire Quiz (New Questions)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedShell>
  );
}
