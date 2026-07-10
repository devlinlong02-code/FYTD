"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { Outfit, OutfitItem } from "@/types";
import CreatorBadge from "./CreatorBadge";
import DbSaveButton from "./DbSaveButton";
import MediaCarousel from "./MediaCarousel";
import TakeDownButton from "./TakeDownButton";
import { toggleSave } from "@/app/actions/saved";
import { createClient } from "@/lib/supabase/client";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useLikeContext } from "@/context/LikeContext";

interface OutfitCardProps {
  outfit: Outfit;
  savedIds?: string[];
  likedIds?: string[];
  isAuthenticated?: boolean;
  isOwner?: boolean;
  variant?: "hero" | "grid" | "feed";
  priority?: boolean;
  showSocialBar?: boolean;
  currentUserId?: string | null;
}

function getFitValue(items: OutfitItem[]): string | null {
  const priced = items.filter((i) => i.price > 0);
  if (priced.length < 1) return null;
  const total = priced.reduce((a, i) => a + i.price, 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);
}

export default function OutfitCard({
  outfit,
  savedIds = [],
  likedIds = [],
  isAuthenticated = false,
  isOwner = false,
  variant = "grid",
  priority = false,
  showSocialBar = false,
  currentUserId = null,
}: OutfitCardProps) {
  const router = useRouter();
  const { openPrompt, authLoaded } = useAuthPrompt();
  const { getLiked, getCount, setLike } = useLikeContext();

  const isFeed = variant === "feed" || variant === "hero";
  const fitValue = getFitValue(outfit.items);
  const creatorUsername = outfit.creatorHandle.replace("@", "");

  // Seed from context if a like was recorded elsewhere (e.g. detail page),
  // otherwise fall back to server-rendered props.
  const ctxLiked = getLiked(outfit.id);
  const ctxCount = getCount(outfit.id);

  // Interaction state
  const [liked, setLiked] = useState(() =>
    ctxLiked !== undefined ? ctxLiked : likedIds.includes(outfit.id)
  );
  const [likeCount, setLikeCount] = useState(
    ctxCount !== undefined ? ctxCount : (outfit.likesCount ?? 0)
  );
  const [saved, setSaved] = useState(() => savedIds.includes(outfit.id));

  // Refs for rapid-tap safety — typed as number for browser clearTimeout compat
  const likeAnimTimerId = useRef<number>(0);
  const dbCallTimerId = useRef<number>(0);
  const countAnimTimerId = useRef<number>(0);
  const likeCountRef = useRef(
    ctxCount !== undefined ? ctxCount : (outfit.likesCount ?? 0)
  );

  // Animation state — only fires on user action, never on mount
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [commentAnimating, setCommentAnimating] = useState(false);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [countAnimating, setCountAnimating] = useState(false);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(likeAnimTimerId.current);
      clearTimeout(dbCallTimerId.current);
      clearTimeout(countAnimTimerId.current);
    };
  }, []);

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (authLoaded && !isAuthenticated) { openPrompt("like"); return; }
    if (!currentUserId) { openPrompt("like"); return; }

    // Restart animation cleanly even on rapid taps
    clearTimeout(likeAnimTimerId.current);
    setLikeAnimating(false);
    requestAnimationFrame(() => {
      setLikeAnimating(true);
      likeAnimTimerId.current = window.setTimeout(() => setLikeAnimating(false), 400);
    });

    // Count-flip animation
    clearTimeout(countAnimTimerId.current);
    setCountAnimating(false);
    requestAnimationFrame(() => {
      setCountAnimating(true);
      countAnimTimerId.current = window.setTimeout(() => setCountAnimating(false), 280);
    });

    const nextLiked = !liked;
    const nextCount = nextLiked
      ? likeCountRef.current + 1
      : Math.max(0, likeCountRef.current - 1);

    setLiked(nextLiked);
    setLikeCount(nextCount);
    likeCountRef.current = nextCount;
    // Immediately publish to shared context so the feed shows the right state
    // when the user navigates back from the detail page (or vice versa).
    setLike(outfit.id, nextLiked, nextCount);

    // Debounce DB write — only the final tap state reaches the server
    clearTimeout(dbCallTimerId.current);
    dbCallTimerId.current = window.setTimeout(async () => {
      const supabase = createClient();
      try {
        if (nextLiked) {
          await supabase.from("likes").upsert(
            { user_id: currentUserId, outfit_id: outfit.id },
            { onConflict: "user_id,outfit_id" }
          );
        } else {
          await supabase.from("likes").delete()
            .eq("user_id", currentUserId)
            .eq("outfit_id", outfit.id);
        }
      } catch {
        // Silent fail — UI is correct; DB will reconcile on next page load
      }
    }, 500);
  }, [liked, currentUserId, outfit.id, authLoaded, isAuthenticated, openPrompt, setLike]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (authLoaded && !isAuthenticated) { openPrompt("save"); return; }

    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 350);

    const prev = saved;
    setSaved(!saved);
    try {
      const result = await toggleSave(outfit.id);
      setSaved(result.saved);
    } catch {
      setSaved(prev);
    }
  }, [saved, isAuthenticated, outfit.id, authLoaded, openPrompt]);

  // ── Comment ───────────────────────────────────────────────────────────────
  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCommentAnimating(true);
    setTimeout(() => setCommentAnimating(false), 300);
    router.push(`/outfit/${outfit.id}#comments`);
  }, [router, outfit.id]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 350);
    const url = `https://fytd.org/outfit/${outfit.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: outfit.title, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    }
  }, [outfit.id, outfit.title]);

  return (
    <div>
      <Link href={`/outfit/${outfit.id}`} className="block group">
        <div
          className={`relative overflow-hidden bg-neutral-100 ${isFeed ? "" : "rounded-xl"}`}
          style={isFeed ? { borderBottom: "0.5px solid rgba(10,10,10,0.08)" } : undefined}
        >
          <div className={`relative ${isFeed ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
            <MediaCarousel
              media={outfit.media}
              title={outfit.title}
              priority={priority}
              sizes={isFeed ? "(max-width: 640px) 100vw, 448px" : "(max-width: 640px) 50vw, 224px"}
              showCounter={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent pointer-events-none" />
          </div>

          {/* Top-right: save button (grid only) + owner management */}
          <div className={`absolute z-20 flex flex-col items-end gap-1.5 ${isFeed ? "top-3 right-3" : "top-2 right-2"}`}>
            {!showSocialBar && (
              <DbSaveButton outfitId={outfit.id} initialSaved={saved} isAuthenticated={isAuthenticated} />
            )}
            {isOwner && <TakeDownButton outfitId={outfit.id} />}
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div
              className={isFeed ? "px-4 pb-5" : "p-3"}
              style={isFeed ? {
                background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                paddingTop: 40,
              } : undefined}
            >
              {isFeed && (
                <p className="font-data text-[11px] text-white/55 uppercase tracking-[0.06em] mb-1.5">
                  {outfit.items.length > 0 && `${outfit.items.length} ${outfit.items.length === 1 ? "piece" : "pieces"}`}
                  {fitValue && ` · ${fitValue}`}
                </p>
              )}
              <p
                className={`font-editorial text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] ${
                  isFeed
                    ? "text-[22px] font-medium tracking-[-0.02em] mb-2"
                    : "text-[15px] font-medium mb-1.5"
                }`}
              >
                {outfit.title}
              </p>
              <div
                role="button"
                className="pointer-events-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/profile/${creatorUsername}`);
                }}
              >
                <CreatorBadge
                  name={outfit.creatorName}
                  handle={outfit.creatorHandle}
                  avatar={outfit.creatorAvatar}
                  size="sm"
                  colorScheme="light"
                />
              </div>
              {isFeed && outfit.tags.length > 0 && (
                <div className="flex gap-4 mt-2">
                  {outfit.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="font-data text-[10px] text-white/45 uppercase tracking-[0.08em]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {!isFeed && fitValue && (
                <p className="font-data text-[10px] text-white/55 tracking-[0.04em]">{fitValue}</p>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Interactive social bar — feed mode only */}
      {showSocialBar && (
        <div
          className="flex items-center px-4"
          style={{
            gap: 20,
            paddingTop: 11,
            paddingBottom: 11,
            borderBottom: "0.5px solid rgba(10,10,10,0.06)",
          }}
        >
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5"
            aria-label={liked ? "Unlike" : "Like"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={liked ? "#0A0A0A" : "none"}
              stroke={liked ? "#0A0A0A" : "rgba(0,0,0,0.5)"}
              strokeWidth="1.8"
              className={likeAnimating ? "animate-like-pop" : ""}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {typeof likeCount === "number" && likeCount > 0 && (
              <span
                className={`font-data text-[12px] ${countAnimating ? "animate-count-flip" : ""}`}
                style={{ color: "#888" }}
              >
                {likeCount.toLocaleString()}
              </span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={handleComment}
            className="flex items-center gap-1.5"
            aria-label="Comments"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.8"
              className={commentAnimating ? "animate-comment-pulse" : ""}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {(outfit.commentsCount ?? 0) > 0 && (
              <span className="font-data text-[12px]" style={{ color: "#888" }}>
                {(outfit.commentsCount ?? 0).toLocaleString()}
              </span>
            )}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5"
            aria-label={saved ? "Unsave" : "Save"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={saved ? "#0A0A0A" : "none"}
              stroke={saved ? "#0A0A0A" : "rgba(0,0,0,0.5)"}
              strokeWidth="1.8"
              className={saveAnimating ? "animate-save-drop" : ""}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center ml-auto"
            aria-label="Share"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.8"
              className={shareAnimating ? "animate-share-float" : ""}
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
