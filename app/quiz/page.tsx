import ProtectedShell from "@/lib/protected-shell";

export default function QuizPage() {
  return (
    <ProtectedShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quiz</h1>
          <p className="mt-2 text-slate-600">
            Generate a quiz from your uploaded PDF (on the Upload page), then
            submit answers and get recommendations.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Start here
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Go to{" "}
            <a className="font-medium text-indigo-700 hover:underline" href="/upload">
              /upload
            </a>{" "}
            to upload a PDF and generate quiz questions.
          </p>
        </div>
      </div>
    </ProtectedShell>
  );
}

