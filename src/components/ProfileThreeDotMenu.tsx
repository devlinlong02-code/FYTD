"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { blockUser } from "@/app/actions/blocks";
import ReportSheet from "@/components/ReportSheet";

interface ProfileThreeDotMenuProps {
  profileId: string;
  username: string;
  displayName: string;
  currentUserId: string | null;
}

export default function ProfileThreeDotMenu({
  profileId,
  username,
  displayName,
  currentUserId,
}: ProfileThreeDotMenuProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else if (!reportOpen) {
      document.body.style.overflow = "";
    }
    return () => {
      if (!reportOpen) document.body.style.overflow = "";
    };
  }, [menuOpen, reportOpen]);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  const dismiss = () => {
    setMenuOpen(false);
  };

  const handleReport = () => {
    setMenuOpen(false);
    setReportOpen(true);
  };

  const handleBlock = async () => {
    setMenuOpen(false);
    setBlocking(true);
    const result = await blockUser(profileId);
    setBlocking(false);
    if (result.success) {
      showToast("User blocked");
      router.push("/");
    } else {
      showToast(result.error ?? "Failed to block user");
    }
  };

  const handleShare = async () => {
    setMenuOpen(false);
    const url = `https://fytd.org/profile/${username}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${displayName} on FYTD`, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Profile link copied");
    } catch {
      showToast("Copy: " + url);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        disabled={blocking}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-neutral-700 disabled:opacity-40"
        aria-label="Profile options"
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {mounted && menuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={dismiss} />
          <div
            className="relative z-10 w-full max-w-md mx-auto rounded-t-3xl bg-white shadow-2xl overflow-hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mt-3 mb-2" />

            {/* Share Profile — always visible */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-600 shrink-0">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span className="text-base font-medium text-neutral-800">Share Profile</span>
            </button>

            {/* Auth-gated options */}
            {currentUserId && (
              <>
                <div className="mx-5 border-t border-neutral-100" />
                <button
                  type="button"
                  onClick={handleReport}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-500 shrink-0">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  <span className="text-base font-medium text-neutral-800">Report @{username}</span>
                </button>

                <div className="mx-5 border-t border-neutral-100" />
                <button
                  type="button"
                  onClick={handleBlock}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 transition-colors"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-red-500 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <span className="text-base font-medium text-red-600">Block @{username}</span>
                </button>
              </>
            )}

            <div className="mx-5 border-t border-neutral-100" />
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

      {reportOpen && currentUserId && (
        <ReportSheet
          type="user"
          targetId={profileId}
          currentUserId={currentUserId}
          onClose={() => {
            setReportOpen(false);
            document.body.style.overflow = "";
          }}
        />
      )}
    </>
  );
}
