"use client";

import { FormEvent, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import ProtectedShell from "@/lib/protected-shell";
import { 
  trackUpload, 
  setActiveDoc, 
  getActiveDoc, 
  saveActiveDocSummary, 
  ActiveDoc 
} from "@/lib/tracker";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  FileSearch,
  BookOpen
} from "lucide-react";

export default function UploadPage() {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [activeDoc, setActiveDocState] = useState<ActiveDoc | null>(null);

  // Loading and error states
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setActiveDocState(getActiveDoc());
  }, []);

  if (!mounted) {
    return (
      <ProtectedShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="h-4 w-72 rounded bg-slate-200"></div>
          <div className="h-48 rounded-3xl bg-slate-200"></div>
        </div>
      </ProtectedShell>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);
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

      const newDoc: ActiveDoc = {
        name: file.name,
        text: data.text ?? "",
        pages: Array.isArray(data.pages) ? data.pages : [],
        pageCount: data.pageCount ?? null,
        uploadedAt: Date.now(),
      };

      setActiveDoc(newDoc);
      setActiveDocState(newDoc);
      trackUpload(file.name);
      
      // Clear file input
      setFile(null);
      const fileInput = document.getElementById("pdf-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setSummaryError(null);

    if (!activeDoc || !activeDoc.text) {
      setSummaryError("Please upload a PDF before generating a summary.");
      return;
    }

    try {
      setSummaryLoading(true);
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: activeDoc.text,
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

      saveActiveDocSummary(data.summary);
      
      // Re-read doc state to show updated summary
      setActiveDocState(getActiveDoc());
    } catch (caught) {
      setSummaryError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleClearActiveDoc = () => {
    setActiveDoc(null);
    setActiveDocState(null);
    setFile(null);
  };

  return (
    <ProtectedShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Upload Study Materials</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Import any PDF textbook, lecture slides, or study notes. Our AI will parse the content page by page for precise reference citations.
          </p>
        </div>

        {/* Upload Card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-lg shadow-slate-100/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            Upload PDF Document
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Select a PDF document up to 10MB. Text is extracted directly within secure, serverless environments.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleUpload}>
            <div className="group relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 p-8 text-center transition cursor-pointer">
              <input
                id="pdf-file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploadLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <FileSearch className="h-10 w-10 text-slate-400 mx-auto group-hover:scale-105 transition" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {file ? file.name : "Select or drop a PDF here"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">PDF format only</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              {activeDoc && (
                <button
                  type="button"
                  onClick={handleClearActiveDoc}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Clear Current Doc
                </button>
              )}
              <button
                type="submit"
                disabled={uploadLoading || !file}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadLoading ? "Extracting Text…" : "Upload PDF"}
              </button>
            </div>
          </form>

          {uploadError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {uploadError}
            </div>
          )}

          {activeDoc && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                      {activeDoc.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: Active • {activeDoc.pageCount || 0} page(s) successfully processed
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading || activeDoc.summary !== undefined}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-emerald-600/60 shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  {summaryLoading ? "Summarizing…" : activeDoc.summary ? "Summary Generated" : "Generate Summary"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Output Section */}
        {activeDoc && (
          <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Document Summary Notes
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              AI-generated study companion guide based on your document text.
            </p>

            {summaryError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                {summaryError}
              </div>
            )}

            {activeDoc.summary ? (
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border border-slate-100 p-6">
                <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold prose-strong:text-slate-900 prose-code:text-indigo-600 prose-pre:bg-slate-900 prose-pre:text-white">
                  <ReactMarkdown>{activeDoc.summary}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200/50 bg-slate-50/30 p-8 text-center text-slate-500">
                {summaryLoading ? (
                  <div className="space-y-3 max-w-md mx-auto py-4">
                    <p className="text-xs font-semibold text-slate-600 animate-pulse">Analyzing document structure & reading chapters…</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full w-1/2 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ animationDuration: '2s' }}></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No summary generated yet</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Click the "Generate Summary" button above to extract key themes and create a study sheet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedShell>
  );
}
