"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { submitReport } from "@/app/actions/reports";

interface ReportSheetProps {
  type: "user" | "post";
  targetId: string;
  currentUserId: string;
  onClose: () => void;
}

const USER_REASONS = [
  "Spam",
  "Inappropriate content",
  "Harassment or bullying",
  "Fake account",
  "Hate speech",
  "Other",
];

const POST_REASONS = [
  "Spam",
  "Inappropriate content",
  "Stolen content",
  "Misleading information",
  "Other",
];

export default function ReportSheet({ type, targetId, currentUserId, onClose }: ReportSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const reasons = type === "user" ? USER_REASONS : POST_REASONS;

  async function handleSubmit() {
    if (!selectedReason) return;
    setLoading(true);
    setError(null);

    const result = await submitReport({
      type,
      targetId,
      reason: selectedReason,
      details: selectedReason === "Other" && details.trim() ? details.trim() : undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md mx-auto rounded-t-3xl bg-white shadow-2xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-neutral-200" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900">Report</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-900">Report submitted</p>
            <p className="text-xs text-neutral-400">{"We'll review this and take appropriate action."}</p>
          </div>
        ) : (
          <>
            {/* Reason list */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
                Why are you reporting this {type === "user" ? "account" : "post"}?
              </p>
              <div className="flex flex-col gap-1">
                {reasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                      selectedReason === reason
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {reason}
                    {selectedReason === reason && (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {selectedReason === "Other" && (
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide more details..."
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
                />
              )}

              {error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="px-5 pt-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
                className="w-full h-12 rounded-2xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
