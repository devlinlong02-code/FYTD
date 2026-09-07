"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MediaCarousel from "@/components/MediaCarousel";
import TakeDownButton from "@/components/TakeDownButton";
import FollowButton from "@/components/FollowButton";
import CommentsSection from "@/components/CommentsSection";
import { toggleSave } from "@/app/actions/saved";
import BreakdownSheet, { type SheetState } from "@/components/BreakdownSheet";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useToast } from "@/context/ToastContext";
import { useLikeContext } from "@/context/LikeContext";
import { createClient } from "@/lib/supabase/client";
import type { Outfit, OutfitItem } from "@/types";

interface Props {
  outfit: Outfit;
  isOwner: boolean;
  initialSaved: boolean;
  isAuthenticated: boolean;
  initialSavedItemIds: string[];
  initialLiked: boolean;
  isFollowingCreator: boolean;
  currentUserId: string | null;
  currentUserUsername?: string;
  currentUserAvatar?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function CompletenessBadge({ score }: { score: number }) {
  if (score < 60) return null;
  const tier = score === 100 ? 100 : score >= 80 ? 80 : 60;
  const config = {
    60: { label: "Good Breakdown", cls: "bg-neutral-100 text-neutral-500" },
    80: { label: "Strong Breakdown", cls: "bg-neutral-200 text-neutral-700" },
    100: { label: "Complete Fit ✦", cls: "bg-black text-white" },
  }[tier];
  return (
    <span className={`text-[10px] font-medium tracking-[0.06em] uppercase px-2.5 py-1 rounded-full ${config.cls}`}>
      {config.label}
    </span>
  );
}

// ─── Share Breakdown ─────────────────────────────────────────────────────────

function ShareBreakdownButton({ outfit }: { outfit: Outfit }) {
  const handleShare = useCallback(async () => {
    const fitValue = getFitValue(outfit.items);
    const lines: string[] = [];
    lines.push(outfit.title);
    lines.push(`by ${outfit.creatorHandle}`);
    lines.push("");
    outfit.items.forEach((item) => {
      const parts = [item.category];
      if (item.brand) parts.push(item.brand);
      parts.push(item.name);
      if (item.price > 0) parts.push(`$${item.price.toLocaleString()}`);
      lines.push(parts.join(" · "));
    });
    if (fitValue) { lines.push(""); lines.push(`Total: ${fitValue}`); }
    lines.push(""); lines.push("fytd.org");

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 400 * scale;
    canvas.height = (80 + lines.length * 26 + 40) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, canvas.height / scale);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(outfit.title, 32, 52);
    ctx.fillStyle = "#888888";
    ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`by ${outfit.creatorHandle}`, 32, 72);
    let y = 104;
    lines.slice(2).forEach((line) => {
      if (!line) { y += 10; return; }
      if (line.startsWith("Total:")) {
        ctx.fillStyle = "#000000";
        ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
      } else if (line === "fytd.org") {
        ctx.fillStyle = "#aaaaaa";
        ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(line, 400 - 32 - ctx.measureText(line).width, y);
        return;
      } else {
        ctx.fillStyle = "#333333";
        ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
      }
      ctx.fillText(line, 32, y);
      y += 26;
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "fytd-breakdown.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `${outfit.title} — FYTD Breakdown` }); return; }
        catch { /* fall through */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "fytd-breakdown.png"; a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [outfit]);

  return (
    <button
      onClick={handleShare}
      title="Share breakdown"
      className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    </button>
  );
}

// ─── Heart SVG ───────────────────────────────────────────────────────────────

function HeartIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#000" : "none"} stroke="#000" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OutfitDetailClient({
  outfit,
  isOwner,
  initialSaved,
  isAuthenticated,
  initialSavedItemIds,
  initialLiked,
  isFollowingCreator,
  currentUserId,
  currentUserUsername,
  currentUserAvatar,
}: Props) {
  const router = useRouter();
  const { openPrompt, authLoaded } = useAuthPrompt();
  const { showToast } = useToast();

  const [stickyVisible, setStickyVisible] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [savedItemIds, setSavedItemIds] = useState<string[]>(initialSavedItemIds);

  const { getLiked, getCount, setLike } = useLikeContext();

  // Seed from context if a like was recorded on the feed card
  const ctxLiked = getLiked(outfit.id);
  const ctxCount = getCount(outfit.id);

  // Like state
  const [liked, setLiked] = useState(
    ctxLiked !== undefined ? ctxLiked : initialLiked
  );
  const [likeCount, setLikeCount] = useState(
    ctxCount !== undefined ? ctxCount : (outfit.likesCount ?? 0)
  );

  // Refs for rapid-tap safety
  const likeAnimTimerId = useRef<number>(0);
  const dbCallTimerId = useRef<number>(0);
  const countAnimTimerId = useRef<number>(0);
  const likeCountRef = useRef(
    ctxCount !== undefined ? ctxCount : (outfit.likesCount ?? 0)
  );

  // Animation state — only fires on user action
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [commentAnimating, setCommentAnimating] = useState(false);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [countAnimating, setCountAnimating] = useState(false);

  // Heart burst at tap position
  const [heartPos, setHeartPos] = useState<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const fitValue = getFitValue(outfit.items);
  const commentCount = outfit.commentsCount ?? 0;
  const saveCount = outfit.savesCount ?? 0;

  // ── Cleanup timer refs on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(likeAnimTimerId.current);
      clearTimeout(dbCallTimerId.current);
      clearTimeout(countAnimTimerId.current);
    };
  }, []);

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
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
    // Immediately publish to shared context so the feed card reflects this
    // when the user navigates back without a full refetch.
    setLike(outfit.id, nextLiked, nextCount);

    // Debounce DB write — only final tap state reaches the server
    clearTimeout(dbCallTimerId.current);
    dbCallTimerId.current = window.setTimeout(async () => {
      const supabase = createClient();
      try {
        if (nextLiked) {
          await supabase.from("likes").upsert(
            { user_id: currentUserId, outfit_id: outfit.id },
            { onConflict: "user_id,outfit_id" }
          );
          const { data: outfitRow } = await supabase
            .from("outfits").select("creator_id").eq("id", outfit.id).maybeSingle();
          const ownerId = outfitRow?.creator_id as string | undefined;
          if (ownerId && ownerId !== currentUserId) {
            await supabase.from("notifications").insert({
              recipient_id: ownerId, actor_id: currentUserId,
              type: "like", outfit_id: outfit.id,
            });
          }
        } else {
          await supabase.from("likes").delete()
            .eq("user_id", currentUserId).eq("outfit_id", outfit.id);
        }
      } catch {
        // Silent fail — UI is correct; DB will reconcile on next page load
      }
    }, 500);
  }, [liked, currentUserId, outfit.id, authLoaded, isAuthenticated, openPrompt, setLike]);

  // ── Double-tap to like at position ─────────────────────────────────────────
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as Element).closest("button, a")) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // touchend: active touches are empty — use changedTouches for the lifted finger
    const clientX = "changedTouches" in e
      ? (e.changedTouches[0]?.clientX ?? rect.left + rect.width / 2)
      : (e as React.MouseEvent).clientX;
    const clientY = "changedTouches" in e
      ? (e.changedTouches[0]?.clientY ?? rect.top + rect.height / 2)
      : (e as React.MouseEvent).clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) handleLike();
      setHeartPos({ x, y });
      lastTapRef.current = 0;
      setTimeout(() => setHeartPos(null), 700);
    } else {
      lastTapRef.current = now;
    }
  }, [liked, handleLike]);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSaveToggle() {
    if (!isAuthenticated) { openPrompt("save"); return; }
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 350);
    const result = await toggleSave(outfit.id);
    setSaved(result.saved);
    showToast(result.saved ? "Saved" : "Removed from saved");
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  async function handleShare() {
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 350);
    const url = `https://fytd.org/outfit/${outfit.id}`;
    const shareData = {
      title: outfit.title,
      text: `Check out this fit on FYTD by ${outfit.creatorHandle}`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      } catch {
        showToast("Copy: " + url);
      }
    }
  }

  // ── Breakdown sheet ─────────────────────────────────────────────────────────
  const handleToggleSavedItem = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated) { openPrompt("save"); return; }
      setSavedItemIds((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
      toggleSavedItem(itemId, outfit.id).catch(() => {
        setSavedItemIds((prev) =>
          prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
      });
    },
    [isAuthenticated, openPrompt, outfit.id]
  );

  const activateItem = useCallback(
    (index: number) => {
      setActiveItemIndex(index);
      setSheetState("half");
    },
    []
  );

  // ── Scroll to comments ──────────────────────────────────────────────────────
  function scrollToComments() {
    setCommentAnimating(true);
    setTimeout(() => setCommentAnimating(false), 300);
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }


  // ── Intersection observer for sticky header ─────────────────────────────────
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);



  return (
    <>
      {/* Sticky header */}
      <div
        className={`sticky top-0 z-30 backdrop-blur-md transition-all duration-200 ${
          stickyVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{ background: "var(--settings-header-bg)", borderBottom: "0.5px solid var(--page-border)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full"
            style={{ background: "var(--page-surface)", color: "var(--page-icon)" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <p className="flex-1 text-sm font-medium truncate" style={{ color: "var(--page-text-primary)" }}>{outfit.title}</p>
          <span className="text-xs shrink-0" style={{ color: "var(--page-text-muted)" }}>{outfit.items.length} {outfit.items.length === 1 ? "pc" : "pcs"}</span>
        </div>
      </div>

      {/* Hero — double-tap to like */}
      <div
        ref={heroRef}
        className="relative aspect-[3/4] w-full bg-neutral-100 cursor-pointer"
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap as unknown as React.TouchEventHandler}
      >
        <MediaCarousel media={outfit.media} title={outfit.title} priority sizes="100vw" showVideoControls />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/25 pointer-events-none" />

        {/* Heart burst at tap position */}
        {heartPos && (
          <svg
            key={`${heartPos.x}-${heartPos.y}`}
            className="heart-burst"
            style={{ left: heartPos.x, top: heartPos.y }}
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="white"
            stroke="white"
            strokeWidth="1.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )}

        {/* Hotspot dots */}
        {outfit.items.filter((i) => i.hotspotX != null && i.hotspotY != null).map((item) => (
          <div
            key={item.id}
            style={{ position: "absolute", left: `${item.hotspotX}%`, top: `${item.hotspotY}%`, width: 28, height: 28, transform: "translate(-50%, -50%)", zIndex: 20, cursor: "pointer" }}
            aria-label={item.name}
            onClick={(e) => { e.stopPropagation(); activateItem(outfit.items.indexOf(item)); }}
          >
            <span className="hotspot-ring" />
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 10, height: 10, background: "#fff", borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.35)", zIndex: 2 }} />
          </div>
        ))}

        {/* Back button */}
        <button onClick={() => router.back()} aria-label="Back" className="absolute top-14 left-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-neutral-900 shadow-sm">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {/* Three-dot manage — owner only */}
        {isOwner && (
          <div className="absolute top-14 right-4 z-20">
            <TakeDownButton outfitId={outfit.id} />
          </div>
        )}

        {/* Hero content — title, creator, follow */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 z-10 pointer-events-none">
          <h1 className="font-editorial text-white text-[26px] font-medium leading-[1.1] tracking-[-0.02em] mb-1">{outfit.title}</h1>
          <p className="font-data text-white/55 text-[11px] uppercase tracking-[0.08em] mb-3">
            {outfit.items.length} {outfit.items.length === 1 ? "piece" : "pieces"}
            {outfit.media.length > 1 && ` · ${outfit.media.length} ${outfit.media.length === 1 ? "photo" : "photos"}`}
            {fitValue && ` · ${fitValue} fit value`}
          </p>
          {/* View breakdown CTA */}
          {outfit.items.length > 0 && (
            <button
              className="pointer-events-auto mb-3"
              onClick={(e) => { e.stopPropagation(); setSheetState("half"); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              View Breakdown
            </button>
          )}

          {/* Creator row */}
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="pointer-events-auto shrink-0"
              style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.2)" }}
              onClick={(e) => { e.stopPropagation(); router.push(isOwner ? "/profile" : `/profile/${outfit.creatorHandle.replace("@", "")}`); }}
            >
              {outfit.creatorAvatar ? (
                <img src={outfit.creatorAvatar} alt={outfit.creatorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                    {outfit.creatorName[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
            </div>
            {/* Name + handle */}
            <div
              className="flex-1 min-w-0 pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); router.push(isOwner ? "/profile" : `/profile/${outfit.creatorHandle.replace("@", "")}`); }}
              style={{ cursor: "pointer" }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: "white", lineHeight: 1.3, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }} className="truncate">
                {outfit.creatorName}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.2, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }} className="truncate">
                {outfit.creatorHandle}
              </p>
            </div>
            {/* Follow button — far right */}
            {!isOwner && outfit.creatorId && (
              <div className="pointer-events-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                <FollowButton
                  targetUserId={outfit.creatorId}
                  currentUserId={currentUserId}
                  initialIsFollowing={isFollowingCreator}
                  size="sm"
                  variant="overlay"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social interaction bar */}
      <div
        className="flex items-center px-4"
        style={{
          gap: 20,
          paddingTop: 11,
          paddingBottom: 11,
          borderTop: "0.5px solid rgba(10,10,10,0.06)",
          borderBottom: "0.5px solid rgba(10,10,10,0.06)",
        }}
      >
        {/* Like */}
        <button onClick={handleLike} className="flex items-center gap-1.5">
          <span className={likeAnimating ? "animate-like-pop" : ""} style={{ display: "flex" }}>
            <HeartIcon filled={liked} size={20} />
          </span>
          {typeof likeCount === "number" && likeCount > 0 && (
            <span
              className={`font-data tabular-nums ${countAnimating ? "animate-count-flip" : ""}`}
              style={{ fontSize: 12, color: "#888" }}
            >
              {likeCount.toLocaleString()}
            </span>
          )}
        </button>

        {/* Comments — scrolls to section */}
        <button onClick={scrollToComments} className="flex items-center gap-1.5">
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.8"
            className={commentAnimating ? "animate-comment-pulse" : ""}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentCount > 0 && (
            <span className="font-data tabular-nums" style={{ fontSize: 12, color: "#888" }}>
              {commentCount.toLocaleString()}
            </span>
          )}
        </button>

        {/* Save/Bookmark */}
        <button onClick={handleSaveToggle} className="flex items-center gap-1.5">
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill={saved ? "#0A0A0A" : "none"} stroke="#0A0A0A" strokeWidth="1.8"
            className={saveAnimating ? "animate-save-drop" : ""}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {saveCount > 0 && (
            <span className="font-data tabular-nums" style={{ fontSize: 12, color: "#888" }}>
              {saveCount.toLocaleString()}
            </span>
          )}
        </button>

        {/* Share — pushed to far right */}
        <button onClick={handleShare} className="ml-auto flex items-center">
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.8"
            className={shareAnimating ? "animate-share-float" : ""}
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Details */}
      <div className="pt-4 pb-2">
        <div className="px-4">
          {/* Tags — plain text, no pills */}
          {outfit.tags.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-3">
              {outfit.tags.map((tag) => (
                <span key={tag} className="font-data text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "#888" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Caption */}
          {outfit.description && (
            <p className="text-[14px] leading-relaxed mb-4 italic" style={{ color: "rgba(10,10,10,0.55)" }}>{outfit.description}</p>
          )}
        </div>

      </div>

      <BreakdownSheet
        outfit={outfit}
        sheetState={sheetState}
        onSheetStateChange={setSheetState}
        activeItemIndex={activeItemIndex}
        onItemChange={setActiveItemIndex}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        savedItemIds={savedItemIds}
        onToggleSavedItem={handleToggleSavedItem}
      />

      {/* Comments section divider */}
      <div ref={commentsRef}>
        <div className="flex items-center gap-3 px-4 pt-6 pb-1">
          <div className="flex-1 h-px" style={{ background: "rgba(10,10,10,0.1)" }} />
          <span
            className="font-data text-[9px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap"
            style={{ color: "rgba(0,0,0,0.4)" }}
          >
            Comments
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(10,10,10,0.1)" }} />
        </div>
        <CommentsSection
          outfitId={outfit.id}
          currentUserId={currentUserId}
          currentUserUsername={currentUserUsername}
          currentUserAvatar={currentUserAvatar}
        />
      </div>
    </>
  );
}
