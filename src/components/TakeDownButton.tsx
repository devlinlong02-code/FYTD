"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { takeDownOutfit } from "@/app/actions/outfit-mutations";

interface Props {
  outfitId: string;
  /** "dots" renders a ⋯ icon button; "menu-item" renders a text row for use inside a menu */
  variant?: "dots" | "menu-item";
}

export default function TakeDownButton({ outfitId, variant = "dots" }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isOpen = menuOpen || confirmOpen;

  // Ensure we only render portals client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  const openConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const dismiss = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMenuOpen(false);
    setConfirmOpen(false);
    setError(null);
  };

  const handleTakeDown = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    const result = await takeDownOutfit(outfitId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/profile");
      router.refresh();
    }
  };

  return (
    <>
      {/* Trigger */}
      {variant === "dots" && (
        <button
          type="button"
          onClick={openMenu}
          className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-neutral-700 shadow-sm hover:bg-white transition-colors"
          aria-label="Manage post"
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      )}

      {variant === "menu-item" && (
        <button
          type="button"
          onClick={openConfirm}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-50 transition-colors"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            className="text-red-500 shrink-0"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          <span className="text-sm font-medium text-red-600">Take Down Post</span>
        </button>
      )}

      {/* Dots menu bottom sheet — portaled to document.body */}
      {mounted && menuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={dismiss}
          />
          {/* Sheet panel */}
          <div
            className="relative z-10 w-full max-w-md mx-auto rounded-t-3xl bg-white shadow-2xl overflow-hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mt-3 mb-2" />
            <button
              type="button"
              onClick={openConfirm}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 transition-colors"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                className="text-red-500 shrink-0"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              <span className="text-base font-medium text-red-600">Take Down Post</span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="w-full px-5 py-4 text-sm font-medium text-neutral-500 text-center hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation bottom sheet — portaled to document.body */}
      {mounted && confirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={dismiss}
          />
          {/* Sheet panel */}
          <div
            className="relative z-10 w-full max-w-md mx-auto rounded-t-3xl bg-white shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-neutral-200" />
            {/* Content */}
            <div className="px-5 pb-2">
              <h2 className="text-lg font-bold text-neutral-900">Take down this post?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                This will remove the post from your profile and the feed. You can&apos;t undo this from the app right now.
              </p>
              {error && (
                <div className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}
            </div>
            {/* Buttons */}
            <div className="px-5 pt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleTakeDown}
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Taking down…
                  </>
                ) : (
                  "Take Down"
                )}
              </button>
              <button
                type="button"
                onClick={dismiss}
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-neutral-100 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
