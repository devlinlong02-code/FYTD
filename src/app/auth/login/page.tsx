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

  const inputStyle = {
    background: "var(--page-surface)",
    color: "var(--page-text-primary)",
    border: "1px solid var(--page-border)",
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12" style={{ background: "var(--page-bg)" }}>
      <div className="max-w-sm w-full mx-auto">
        <div className="mb-10 text-center">
          <span className="font-bold text-3xl tracking-tight" style={{ color: "var(--page-text-primary)" }}>FYTD</span>
          <p className="text-sm mt-2" style={{ color: "var(--page-text-muted)" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--page-text-muted)" }}>
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
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--page-text-muted)" }}>
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
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
              style={inputStyle}
            />
          </div>

          {error && (
            <div className="text-center">
              <p className="text-red-500 text-sm">{error}</p>
              {emailUnconfirmed && email && (
                <Link
                  href={`/auth/signup?resend=true&email=${encodeURIComponent(email)}`}
                  className="inline-block mt-2 text-sm underline underline-offset-2 transition-colors"
                  style={{ color: "var(--page-text-secondary)" }}
                >
                  Resend confirmation email
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50 mt-2"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--page-text-muted)" }}>
          No account?{" "}
          <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: "var(--page-text-primary)" }}>
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
