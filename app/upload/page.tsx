"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import ProtectedShell from "@/lib/protected-shell";

interface PdfPage {
  pageNumber: number;
  text: string;
}

interface ChatCitation {
  pageNumber: number;
}

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  citations?: ChatCitation[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const [documentText, setDocumentText] = useState<string>("");
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Chat
  const [question, setQuestion] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Summary
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Recommendations
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [revisionTopics, setRevisionTopics] = useState<string[]>([]);
  const [studyPlan, setStudyPlan] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);
    setDocumentText("");
    setPages([]);
    setPageCount(null);
    setChatMessages([]);
    setSummary("");
    setSummaryError(null);
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizError(null);

    if (!file) {
      setUploadError("Please select a PDF file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadLoading(true);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Upload failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message ?? "Failed to extract PDF text.");
      }

      setDocumentText(data.text ?? "");
      setPages(Array.isArray(data.pages) ? data.pages : []);
      setPageCount(data.pageCount ?? null);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAskQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChatError(null);

    if (!question.trim()) {
      setChatError("Please enter a question.");
      return;
    }

    if (!documentText) {
      setChatError("Upload a PDF before asking questions.");
      return;
    }

    try {
      setChatLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to get answer");
      }

      const data = await response.json();

      if (!data.answer) {
        throw new Error("No answer received from AI");
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        question: question.trim(),
        answer: data.answer,
        citations: Array.isArray(data.citations) ? data.citations : [],
      };

      setChatMessages((prev) => [newMessage, ...prev]);
      setQuestion("");
    } catch (caught) {
      setChatError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setSummaryError(null);
    setSummary("");

    if (!documentText) {
      setSummaryError("Upload a PDF before generating a summary.");
      return;
    }

    try {
      setSummaryLoading(true);
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to generate summary");
      }

      const data = await response.json();

      if (!data.summary) {
        throw new Error("No summary received from AI");
      }

      setSummary(data.summary);
    } catch (caught) {
      setSummaryError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizError(null);
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);

    if (!documentText) {
      setQuizError("Upload a PDF before generating a quiz.");
      return;
    }

    try {
      setQuizLoading(true);
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText,
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
    } catch (caught) {
      setQuizError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = () => {
    let score = 0;

    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        score += 1;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizError(null);

    setRecommendationsLoading(false);
    setRecommendationsError(null);
    setWeakAreas([]);
    setRevisionTopics([]);
    setStudyPlan([]);
  };

  const handleGetRecommendations = async () => {
    setRecommendationsError(null);
    setWeakAreas([]);
    setRevisionTopics([]);
    setStudyPlan([]);

    if (!documentText || !quizQuestions.length) {
      setRecommendationsError("Generate and submit a quiz before requesting recommendations.");
      return;
    }

    const incorrectQuestions = quizQuestions
      .map((q, index) => ({ q, index }))
      .filter(({ q, index }) => userAnswers[index] !== q.correctAnswer)
      .map(({ q }) => q.question);

    try {
      setRecommendationsLoading(true);

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText,
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

      setWeakAreas(Array.isArray(data.weakAreas) ? data.weakAreas : []);
      setRevisionTopics(Array.isArray(data.revisionTopics) ? data.revisionTopics : []);
      setStudyPlan(Array.isArray(data.studyPlan) ? data.studyPlan : []);
    } catch (caught) {
      setRecommendationsError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const renderSources = (citations?: ChatCitation[]) => {
    const items = Array.isArray(citations) ? citations : [];

    // Requirement: show "Document-wide answer" when no source is available
    if (!items.length) {
      return (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Sources
          </span>
          <span className="text-xs font-medium text-slate-600">Document-wide answer</span>
        </div>
      );
    }

    // Requirement: remove duplicate page references, sort by relevance score.
    // The backend currently returns citations already in relevance order.
    // We’ll keep order while removing duplicates, and clamp to top 2.
    const seen = new Set<number>();
    const uniqueInOrder: number[] = [];

    for (const c of items) {
      if (!seen.has(c.pageNumber)) {
        seen.add(c.pageNumber);
        uniqueInOrder.push(c.pageNumber);
      }
      if (uniqueInOrder.length >= 2) break;
    }

    return (
      <div className="mt-4">
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            Sources
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {uniqueInOrder.map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200"
            >
              Page {p}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">PDF Study Assistant</h1>
          <p className="mt-2 text-lg text-slate-600">
            Upload a PDF and ask questions about its content using AI.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
          <h2 className="text-2xl font-semibold text-slate-900">Step 1: Upload PDF</h2>
          <p className="mt-2 text-sm text-slate-600">
            Select a PDF file to extract text and prepare for questions.
          </p>

          <form className="mt-6 space-y-6" onSubmit={handleUpload}>
            <label className="block text-sm font-medium text-slate-700">
              PDF File
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploadLoading}
                className="mt-3 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              />
            </label>

            <button
              type="submit"
              disabled={uploadLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadLoading ? "Uploading…" : "Upload PDF"}
            </button>
          </form>

          {uploadError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {uploadError}
            </div>
          ) : null}

          {documentText ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold">PDF uploaded successfully</p>
                    {pageCount ? (
                      <p className="text-sm text-emerald-600">{pageCount} page(s) extracted</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading || !documentText}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {summaryLoading ? "Generating…" : "Generate Summary"}
                  </button>
                  {quizQuestions.length === 0 && (
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={quizLoading || !documentText}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {quizLoading ? "Generating…" : "Generate Quiz"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {documentText ? (
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
            <h2 className="text-2xl font-semibold text-slate-900">Study Summary</h2>
            <p className="mt-2 text-sm text-slate-600">
              AI-generated structured summary of the PDF content.
            </p>

            {summaryError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {summaryError}
              </div>
            ) : null}

            {summary ? (
              <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-6">
                <div className="prose prose-sm max-w-none text-purple-900 prose-headings:text-purple-900 prose-strong:text-purple-900 prose-a:text-purple-600 hover:prose-a:text-purple-700">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                {summaryLoading ? "Generating…" : <p>Click "Generate Summary" to create a study summary.</p>}
              </div>
            )}

            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-slate-900">Step 2: Ask Questions</h2>
              <p className="mt-2 text-sm text-slate-600">
                Ask questions about the PDF content and get AI-powered answers.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleAskQuestion}>
                <label className="block text-sm font-medium text-slate-700">
                  Your Question
                  <textarea
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      setChatError(null);
                    }}
                    disabled={chatLoading}
                    placeholder="Ask a question about the PDF content..."
                    rows={3}
                    className="mt-3 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                  />
                </label>

                <button
                  type="submit"
                  disabled={chatLoading || !documentText}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chatLoading ? "Asking…" : "Ask Question"}
                </button>
              </form>

              {chatError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {chatError}
                </div>
              ) : null}

              <div className="mt-8 space-y-6">
                {chatMessages.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Conversation
                    </h3>
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="space-y-3">
                          <div className="rounded-2xl bg-blue-50 p-4">
                            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                              Your Question
                            </p>
                            <p className="mt-2 text-sm text-blue-900">{message.question}</p>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 p-4">
                            <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
                              AI Answer
                            </p>
                            <div className="prose prose-sm max-w-none mt-2 text-emerald-900 prose-headings:text-emerald-900 prose-strong:text-emerald-900 prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
                              <ReactMarkdown>{message.answer}</ReactMarkdown>
                            </div>
                            {renderSources(message.citations)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {documentText ? (
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Quiz</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Test your knowledge with AI-generated questions.
                </p>
              </div>
              {!quizQuestions.length && (
                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading || !documentText}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {quizLoading ? "Generating…" : "Generate Quiz"}
                </button>
              )}
            </div>

            {quizError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {quizError}
              </div>
            ) : null}

            {quizQuestions.length > 0 && !quizSubmitted ? (
              <div className="mt-6 space-y-6">
                {quizQuestions.map((q, index) => (
                  <div key={index} className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                    <h3 className="text-lg font-semibold text-indigo-900">
                      Question {index + 1}: {q.question}
                    </h3>
                    <div className="mt-4 space-y-3">
                      {q.options.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={userAnswers[index] === option}
                            onChange={() =>
                              setUserAnswers({ ...userAnswers, [index]: option })
                            }
                            className="h-4 w-4 text-indigo-600"
                          />
                          <span className="text-sm text-indigo-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(userAnswers).length !== quizQuestions.length}
                  className="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit Quiz
                </button>
              </div>
            ) : quizSubmitted ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-8 text-center">
                  <p className="text-sm font-medium text-slate-600">Quiz Score</p>
                  <p className="mt-2 text-5xl font-bold text-indigo-600">
                    {quizScore}/{quizQuestions.length}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {((quizScore / quizQuestions.length) * 100).toFixed(0)}%
                  </p>
                </div>

                {quizQuestions.map((q, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer === q.correctAnswer;

                  return (
                    <div
                      key={index}
                      className={`rounded-2xl border-2 p-6 ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <h3
                        className={`text-lg font-semibold ${
                          isCorrect ? "text-emerald-900" : "text-red-900"
                        }`}
                      >
                        Question {index + 1}: {q.question}
                      </h3>
                      <div className="mt-4 space-y-2">
                        <p
                          className={`text-sm ${
                            isCorrect ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          <span className="font-semibold">Your answer:</span> {userAnswer}
                          {isCorrect && " ✓"}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm font-semibold text-emerald-700">
                            <span>Correct answer:</span> {q.correctAnswer}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6 space-y-4">
                  {quizSubmitted ? (
                    <>
                      <button
                        onClick={handleGetRecommendations}
                        disabled={recommendationsLoading || !quizQuestions.length}
                        className="w-full rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {recommendationsLoading
                          ? "Getting Recommendations…"
                          : "Get Recommendations"}
                      </button>

                      {recommendationsError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          {recommendationsError}
                        </div>
                      ) : null}

                      {weakAreas.length > 0 || revisionTopics.length > 0 || studyPlan.length > 0 ? (
                        <div className="space-y-6">
                          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
                            <h3 className="text-lg font-semibold text-violet-900">Weak Areas</h3>
                            {weakAreas.length ? (
                              <ul className="mt-3 list-disc pl-5 text-sm text-violet-900 space-y-1">
                                {weakAreas.map((a, i) => (
                                  <li key={i}>{a}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-3 text-sm text-violet-800">No specific weak areas found.</p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                            <h3 className="text-lg font-semibold text-indigo-900">Topics To Revise</h3>
                            {revisionTopics.length ? (
                              <ul className="mt-3 list-disc pl-5 text-sm text-indigo-900 space-y-1">
                                {revisionTopics.map((t, i) => (
                                  <li key={i}>{t}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-3 text-sm text-indigo-800">No revision topics found.</p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                            <h3 className="text-lg font-semibold text-emerald-900">Study Plan</h3>
                            {studyPlan.length ? (
                              <ol className="mt-3 list-decimal pl-5 text-sm text-emerald-900 space-y-1">
                                {studyPlan.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ol>
                            ) : (
                              <p className="mt-3 text-sm text-emerald-800">No study plan generated.</p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  <button
                    onClick={resetQuiz}
                    className="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            ) : quizLoading ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400 delay-100"></div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400 delay-200"></div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                <p>Click "Generate Quiz" to create a quiz from the PDF.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ProtectedShell>
  );
}

