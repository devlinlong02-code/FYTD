"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

type SignupState = { error: string | null; confirm?: boolean; email?: string; redirectTo?: string } | null;

function ConfirmScreen({ email }: { email: string }) {
  const [resendStatus, setResendStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    setResendStatus("pending");
    setResendError("");

    const callbackUrl = `${window.location.origin}/auth/callback`;
    console.log("[resend] email:", email, "callbackUrl:", callbackUrl);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callbackUrl },
    });

    if (error) {
      console.error("[resend] error:", error.message);
      setResendError(error.message);
      setResendStatus("error");
    } else {
      console.log("[resend] success");
      setResendStatus("sent");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm w-full mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-500">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">Check your email</h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-2">
          We sent a confirmation link to
        </p>
        <p className="text-sm font-semibold text-neutral-900 mb-4">{email}</p>
        <p className="text-sm text-neutral-500 leading-relaxed mb-2">
          Tap the link to confirm your account, then sign in.
        </p>
        <p className="text-sm text-amber-600 leading-relaxed mb-8">
          Don&apos;t see it? Check your <strong>Junk</strong> or <strong>Spam</strong> folder.
        </p>

        <div className="mb-6 min-h-[28px]">
          {resendStatus === "sent" && (
            <p className="text-sm text-green-600 font-medium">
              Confirmation email sent. Check your inbox or junk folder.
            </p>
          )}
          {resendStatus === "error" && (
            <p className="text-sm text-red-500">
              {resendError || "Could not resend. Please try again."}
            </p>
          )}
          {(resendStatus === "idle" || resendStatus === "error") && (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-900 transition-colors mt-1"
            >
              Resend confirmation email
            </button>
          )}
          {resendStatus === "pending" && (
            <p className="text-sm text-neutral-400">Sending…</p>
          )}
        </div>

        <Link
          href="/auth/login"
          className="w-full inline-block py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold text-center hover:bg-neutral-700 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, null);

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  if (state?.confirm) {
    return <ConfirmScreen email={state.email ?? ""} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm w-full mx-auto">
        <div className="mb-10 text-center">
          <span className="font-bold text-3xl tracking-tight text-neutral-900">FYTD</span>
          <p className="text-neutral-400 text-sm mt-2">Create your account</p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="yourhandle"
                className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
              />
            </div>
            <div>
              <label htmlFor="display_name" className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
                Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                autoComplete="name"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="min. 8 characters"
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
            />
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-neutral-900 text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 mt-2"
          >
            {pending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-400 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
