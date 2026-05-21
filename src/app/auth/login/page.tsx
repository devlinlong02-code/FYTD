"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please confirm your email before signing in. Check your inbox.",
  "User not found": "No account found with this email.",
};

function friendlyError(msg: string) {
  return ERROR_MAP[msg] ?? msg ?? "Something went wrong. Try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }

    // For fresh logins with no specific destination, check if onboarding is needed
    let destination = next;
    if (next === "/" && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", data.user.id)
        .single();

      if (!profile?.profile_completed) {
        destination = "/onboarding";
      }
    }

    // Session is live in the browser — refresh server components then navigate
    router.refresh();
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm w-full mx-auto">
        <div className="mb-10 text-center">
          <span className="font-bold text-3xl tracking-tight text-neutral-900">FYTD</span>
          <p className="text-neutral-400 text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-400 mt-6">
          No account?{" "}
          <Link href="/auth/signup" className="font-semibold text-neutral-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
