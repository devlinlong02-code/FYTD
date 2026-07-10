"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type FeedbackType = "bug" | "feedback" | "feature";

const TYPE_OPTIONS: { value: FeedbackType; label: string; desc: string }[] = [
  { value: "bug", label: "Bug", desc: "Something broke" },
  { value: "feedback", label: "Feedback", desc: "What I think" },
  { value: "feature", label: "Feature", desc: "I wish FYTD had…" },
];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setSubmitted(false);
    setMessage("");
    setType("feedback");
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSubmit() {
    if (!message.trim() || pending) return;
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("beta_feedback").insert({
        type,
        message: message.trim(),
        user_id: user?.id ?? null,
      });
      setSubmitted(true);
      setTimeout(() => setOpen(false), 2000);
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed z-40 flex items-center gap-1.5 text-[11px] font-semibold bg-neutral-900 text-white px-3 py-2 rounded-full shadow-lg hover:bg-neutral-700 transition-all active:scale-95"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))", right: "1rem" }}
        aria-label="Send feedback"
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {/* Sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[110]"
            onClick={handleClose}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[111] bg-white rounded-t-3xl max-w-md mx-auto flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 px-8 text-center gap-3">
                <div className="text-4xl">🙌</div>
                <p className="text-base font-bold text-neutral-900">Thanks for the feedback!</p>
                <p className="text-sm text-neutral-400">It helps us build a better FYTD.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900">Send feedback</h2>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-2xl border text-center transition-all ${
                        type === value
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <span className="text-xs font-bold">{label}</span>
                      <span className={`text-[10px] leading-tight ${type === value ? "text-white/70" : "text-neutral-400"}`}>
                        {desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === "bug"
                      ? "What happened? What did you expect?"
                      : type === "feature"
                      ? "What would you love to see in FYTD?"
                      : "What's on your mind?"
                  }
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none bg-neutral-100 rounded-2xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || pending}
                  className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {pending ? "Sending…" : "Send"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
