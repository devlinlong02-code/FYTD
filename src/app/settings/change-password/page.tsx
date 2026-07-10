"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError("No email address found on this account.");
        return;
      }
      const { error: err } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900">Change Password</span>
      </div>

      <div className="px-6 py-10 flex flex-col items-center text-center gap-5">
        {sent ? (
          <>
            <div className="text-4xl">📬</div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Check your email</h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                We sent a password reset link to your email address. Click the link to set a new password.
              </p>
            </div>
            <Link
              href="/settings"
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Back to Settings
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-500">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Reset your password</h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                We&apos;ll send a secure link to your email address so you can set a new password.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <button
              onClick={handleSend}
              disabled={pending}
              className="w-full max-w-xs py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send Reset Link"}
            </button>
            <Link
              href="/settings"
              className="text-sm font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Cancel
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}
