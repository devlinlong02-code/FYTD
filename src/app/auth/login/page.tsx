"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please confirm your email before signing in. Check your inbox or junk folder.",
  "User not found": "No account found with this email.",
};

function friendlyError(msg: string) {
  return ERROR_MAP[msg] ?? msg ?? "Something went wrong. Try again.";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/";
  // Validate to prevent open redirect — only allow internal paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError ?? "");
  const [loading, setLoading] = useState(false);
  // Tracks whether the last failure was specifically "email not confirmed"
  const [emailUnconfirmed, setEmailUnconfirmed] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setEmailUnconfirmed(false);
    setLoading(true);

    const supabase = createClient();
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const isUnconfirmed = authError.message === "Email not confirmed";
      setError(friendlyError(authError.message));
      setEmailUnconfirmed(isUnconfirmed);
      // Clear password so user can retype it; email is preserved in state
      setPassword("");
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

    // Hard navigation ensures the new session cookie is sent with the request
    window.location.assign(destination);
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
            <div className="text-center">
              <p className="text-red-500 text-sm">{error}</p>
              {emailUnconfirmed && email && (
                <Link
                  href={`/auth/signup?resend=true&email=${encodeURIComponent(email)}`}
                  className="inline-block mt-2 text-sm text-neutral-600 underline underline-offset-2 hover:text-neutral-900 transition-colors"
                >
                  Resend confirmation email
                </Link>
              )}
            </div>
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
