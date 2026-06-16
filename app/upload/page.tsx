"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
}

export default function UploadPage() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Chat state
  const [question, setQuestion] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);
    setDocumentText("");
    setPageCount(null);
    setChatMessages([]);
    setSummary("");
    setSummaryError(null);

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
          documentText,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-6 sm:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">PDF Study Assistant</h1>
          <p className="mt-2 text-lg text-slate-600">
            Upload a PDF and ask questions about its content using AI.
          </p>
        </div>

        {/* Upload Card */}
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
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading || !documentText}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {summaryLoading ? "Generating…" : "Generate Summary"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Summary Section */}
        {documentText && (
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
                {summaryLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400 delay-100"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400 delay-200"></div>
                  </div>
                ) : (
                  <p>Click "Generate Summary" to create a study summary.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Section */}
        {documentText ? (
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/80">
            <h2 className="text-2xl font-semibold text-slate-900">Step 2: Ask Questions</h2>
            <p className="mt-2 text-sm text-slate-600">
              Ask questions about the PDF content and get AI-powered answers.
            </p>

            {/* Question Input */}
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

            {!documentText && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Upload a PDF before asking questions.
              </div>
            )}

            {chatError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {chatError}
              </div>
            ) : null}

            {/* Chat Messages */}
            <div className="mt-8 space-y-6">
              {chatMessages.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversation</h3>
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="space-y-3">
                        {/* Question */}
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                            Your Question
                          </p>
                          <p className="mt-2 text-sm text-blue-900">{message.question}</p>
                        </div>

                        {/* Answer */}
                        <div className="rounded-2xl bg-emerald-50 p-4">
                          <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
                            AI Answer
                          </p>
                          <div className="prose prose-sm max-w-none mt-2 text-emerald-900 prose-headings:text-emerald-900 prose-strong:text-emerald-900 prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
                            <ReactMarkdown>{message.answer}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

