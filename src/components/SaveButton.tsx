"use client";

import { useTransition } from "react";

interface SaveButtonProps {
  saved: boolean;
  onToggle: () => void;
  pending?: boolean;
  className?: string;
}

export default function SaveButton({
  saved,
  onToggle,
  pending = false,
  className = "",
}: SaveButtonProps) {
  const [transitioning, startTransition] = useTransition();
  const isLoading = pending || transitioning;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => onToggle());
      }}
      aria-label={saved ? "Unsave outfit" : "Save outfit"}
      disabled={isLoading}
      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150 ${
        saved
          ? "bg-neutral-900 text-white"
          : "bg-white/90 text-neutral-500 hover:bg-neutral-900 hover:text-white"
      } shadow-sm disabled:opacity-60 ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
