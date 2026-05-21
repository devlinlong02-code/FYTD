"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { ActionType } from "@/context/AuthPromptContext";

const COPY: Record<ActionType, { headline: string; body: string }> = {
  save: {
    headline: "Save this fit?",
    body: "Create an account to save outfits and build your personal style collection.",
  },
  like: {
    headline: "Like this fit?",
    body: "Create an account to like outfits and help personalize your FYTD feed.",
  },
  comment: {
    headline: "Join the conversation",
    body: "Create an account to comment on fits and connect with creators.",
  },
  follow: {
    headline: "Follow this creator?",
    body: "Create an account to follow creators and see their latest fits in your feed.",
  },
  create: {
    headline: "Post your first fit",
    body: "Create an account to upload outfits, add fit breakdowns, and share your style.",
  },
  profile: {
    headline: "Create your FYTD profile",
    body: "Sign up to post outfits, save fits, and build your fashion profile.",
  },
  account: {
    headline: "Sign in to your account",
    body: "Manage your profile, outfits, saved fits, and settings.",
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
}

export default function AuthPromptSheet({ isOpen, onClose, actionType }: Props) {
  const { headline, body } = COPY[actionType];

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={headline}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-md bg-white rounded-t-3xl shadow-2xl px-6 pt-4 pb-10">
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-neutral-200 mx-auto mb-6" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Content */}
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{headline}</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-7">{body}</p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signup"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold text-center hover:bg-neutral-700 transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl border border-neutral-200 text-neutral-900 text-sm font-semibold text-center hover:bg-neutral-50 transition-colors"
            >
              Log in
            </Link>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </>
  );
}
