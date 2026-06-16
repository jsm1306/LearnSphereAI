import ProtectedShell from "@/lib/protected-shell";

export default function DashboardPage() {
  return (
    <ProtectedShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Upload a PDF, generate a summary, quiz yourself, and chat with your
            document using AI.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/upload"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
              Upload PDF
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Extract text and prepare for learning.
            </p>
          </a>

          <a
            href="/quiz"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
              Take Quiz
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Practice with AI-generated multiple-choice questions.
            </p>
          </a>

          <a
            href="/chat"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
              Chat Assistant
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Ask questions based on your uploaded study material.
            </p>
          </a>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Tip</p>
            <p className="mt-2 text-sm text-slate-600">
              Use the Upload page to generate Summary + Quiz, then return here.
            </p>
          </div>
        </div>
      </div>
    </ProtectedShell>
  );
}


