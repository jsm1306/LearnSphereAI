import type { ReactNode } from "react";
import { LogoutButton } from "@/lib/logout-button";

export default function ProtectedShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              LearnSphere AI
            </p>
            <p className="text-xs text-slate-600">Secure study workspace</p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

