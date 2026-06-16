"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialError = useMemo(() => {
    const e = searchParams.get("error");
    if (!e) return null;
    // NextAuth commonly uses "CredentialsSignin".
    return "Invalid email or password.";
  }, [searchParams]);

  const [email, setEmail] = useState<string>("demo@learnsphere.ai");
  const [password, setPassword] = useState<string>("demo123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    setSubmitting(false);

    // If redirect:true succeeded, the page navigates.
    // If it fails, we’ll land here.
    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Login to LearnSphere AI
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Demo authentication (no database). Use the provided credentials.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-indigo-600/10 px-3 py-2">
            <p className="text-xs font-semibold text-indigo-700">Hackathon Demo</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-700">Demo account</p>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              <span className="font-medium">Email:</span>{" "}
              <span className="font-mono">demo@learnsphere.ai</span>
            </p>
            <p>
              <span className="font-medium">Password:</span>{" "}
              <span className="font-mono">demo123</span>
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            After login you’ll be redirected to <span className="font-medium">/dashboard</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

