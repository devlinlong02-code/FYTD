"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateConversation } from "@/app/actions/messages";
import { useToast } from "@/context/ToastContext";

interface MessageButtonProps {
  profileId: string;
  variant?: "default" | "secondary";
}

export default function MessageButton({ profileId, variant = "default" }: MessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleMessage() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await getOrCreateConversation(profileId);
      if ("error" in result) {
        showToast("Could not start conversation. Try again.");
        return;
      }
      router.push(`/messages/${result.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (variant === "secondary") {
    return (
      <button
        onClick={handleMessage}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-50 shrink-0"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {loading ? "…" : "Message"}
      </button>
    );
  }

  return (
    <button
      onClick={handleMessage}
      disabled={loading}
      className="flex-1 text-center py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Message"}
    </button>
  );
}
