import ProtectedShell from "@/lib/protected-shell";

export default function ChatPage() {
  return (
    <ProtectedShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chat</h1>
          <p className="mt-2 text-slate-600">
            Use the Upload page to chat with your uploaded document.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Quick start</p>
          <p className="mt-2 text-sm text-slate-600">
            Go to{" "}
            <a
              className="font-medium text-indigo-700 hover:underline"
              href="/upload"
            >
              /upload
            </a>{" "}
            to upload a PDF, then ask questions and generate quizzes.
          </p>
        </div>
      </div>
    </ProtectedShell>
  );
}



