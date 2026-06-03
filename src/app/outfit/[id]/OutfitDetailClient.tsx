"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MediaCarousel from "@/components/MediaCarousel";
import TagPill from "@/components/TagPill";
import TakeDownButton from "@/components/TakeDownButton";
import FollowButton from "@/components/FollowButton";
import CommentsSection from "@/components/CommentsSection";
import { toggleSave } from "@/app/actions/saved";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { trackClick } from "@/app/actions/clicks";
import { normalizeExternalUrl } from "@/lib/links";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useToast } from "@/context/ToastContext";
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

function calcCompleteness(items: OutfitItem[]): number {
  if (!items.length) return 0;
  const totalPossible = items.length * 5;
  const earned = items.reduce((acc, item) => {
    let pts = 1;
    if (item.brand) pts++;
    if (item.price > 0) pts++;
    if (item.shopLink && item.shopLink !== "#") pts++;
    if (item.image) pts++;
    return acc + pts;
  }, 0);
  return Math.round((earned / totalPossible) * 100);
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

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set(initialSavedItemIds));

  // Like state
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(outfit.likesCount ?? 0);
  const [likePending, setLikePending] = useState(false);
  // bounceKey increments on each like → remounts SVG → CSS animation replays
  const [bounceKey, setBounceKey] = useState(0);

  // Heart burst at tap position
  const [heartPos, setHeartPos] = useState<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const activeResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const score = calcCompleteness(outfit.items);
  const fitValue = getFitValue(outfit.items);
  const commentCount = outfit.commentsCount ?? 0;
  const saveCount = outfit.savesCount ?? 0;

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likePending) return;
    if (authLoaded && !isAuthenticated) { openPrompt("like"); return; }
    if (!currentUserId) { openPrompt("like"); return; }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    if (nextLiked) setBounceKey((k) => k + 1);

    setLikePending(true);
    try {
      const supabase = createClient();
      if (nextLiked) {
        await supabase.from("likes").insert({ user_id: currentUserId, outfit_id: outfit.id });
        const { data: outfitRow } = await supabase.from("outfits").select("creator_id").eq("id", outfit.id).maybeSingle();
        const ownerId = outfitRow?.creator_id as string | undefined;
        if (ownerId && ownerId !== currentUserId) {
          await supabase.from("notifications").insert({ recipient_id: ownerId, actor_id: currentUserId, type: "like", outfit_id: outfit.id });
        }
      } else {
        await supabase.from("likes").delete().eq("user_id", currentUserId).eq("outfit_id", outfit.id);
      }
    } catch {
      setLiked(!nextLiked);
      setLikeCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setLikePending(false);
    }
  }, [likePending, liked, currentUserId, outfit.id, authLoaded, isAuthenticated, openPrompt]);

  // ── Double-tap to like at position ─────────────────────────────────────────
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as Element).closest("button, a")) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e
      ? (e.touches[0]?.clientX ?? rect.left + rect.width / 2)
      : e.clientX;
    const clientY = "touches" in e
      ? (e.touches[0]?.clientY ?? rect.top + rect.height / 2)
      : e.clientY;
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
    const result = await toggleSave(outfit.id);
    setSaved(result.saved);
    showToast(result.saved ? "Saved" : "Removed from saved");
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  async function handleShare() {
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

  // ── Scroll to comments ──────────────────────────────────────────────────────
  function scrollToComments() {
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

  useEffect(() => {
    if (!activeItemId) return;
    document.getElementById(`item-card-${activeItemId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeItemId]);

  function activateItem(id: string) {
    setActiveItemId((prev) => (prev === id ? null : id));
    if (activeResetTimer.current) clearTimeout(activeResetTimer.current);
    activeResetTimer.current = setTimeout(() => setActiveItemId(null), 2000);
  }

  async function handleToggleSavedItem(itemId: string) {
    if (!isAuthenticated) return;
    setSavedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
    await toggleSavedItem(itemId, outfit.id).catch(() => {});
  }

  return (
    <>
      {/* Sticky header */}
      <div
        className={`sticky top-0 z-30 bg-white transition-all duration-200 ${
          stickyVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <p className="flex-1 text-sm font-medium text-neutral-900 truncate">{outfit.title}</p>
          <span className="text-xs text-neutral-400 shrink-0">{outfit.items.length} pcs</span>
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
        {outfit.items.filter((i) => i.hotspotX != null && i.hotspotY != null).map((item) => {
          const isActive = item.id === activeItemId;
          return (
            <button
              key={item.id}
              onClick={() => activateItem(item.id)}
              style={{ position: "absolute", left: `${item.hotspotX}%`, top: `${item.hotspotY}%`, width: 28, height: 28, transform: "translate(-50%, -50%)", zIndex: 20, background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label={item.name}
            >
              <span className={`hotspot-ring ${isActive ? "hotspot-ring-active" : ""}`} />
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%)${isActive ? " scale(1.25)" : ""}`, width: 10, height: 10, background: isActive ? "#000" : "#fff", borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.35)", zIndex: 2, transition: "background 150ms, transform 150ms" }} />
            </button>
          );
        })}

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
          <h1 className="text-white text-2xl font-black leading-tight tracking-tight mb-1">{outfit.title}</h1>
          <p className="text-white/50 text-xs font-medium tracking-wide uppercase mb-3">
            {outfit.items.length} pieces
            {outfit.media.length > 1 && ` · ${outfit.media.length} photos`}
            {fitValue && ` · ${fitValue} fit value`}
          </p>
          {/* Creator row */}
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="pointer-events-auto shrink-0"
              style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.2)" }}
              onClick={(e) => { e.stopPropagation(); if (isOwner) router.push("/profile"); }}
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
              onClick={(e) => { e.stopPropagation(); if (isOwner) router.push("/profile"); }}
              style={{ cursor: isOwner ? "pointer" : "default" }}
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
          paddingTop: 10,
          paddingBottom: 10,
          borderTop: "0.5px solid rgba(0,0,0,0.06)",
          borderBottom: "0.5px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Like */}
        <button onClick={handleLike} disabled={likePending} className="flex items-center gap-1.5 disabled:opacity-60">
          <span key={bounceKey} className={bounceKey > 0 ? "heart-bounce" : ""} style={{ display: "flex" }}>
            <HeartIcon filled={liked} size={20} />
          </span>
          {likeCount > 0 && (
            <span style={{ fontSize: 13, color: "rgba(0,0,0,0.6)" }} className="tabular-nums">
              {likeCount.toLocaleString()}
            </span>
          )}
        </button>

        {/* Comments — scrolls to section */}
        <button onClick={scrollToComments} className="flex items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentCount > 0 && (
            <span style={{ fontSize: 13, color: "rgba(0,0,0,0.6)" }} className="tabular-nums">
              {commentCount.toLocaleString()}
            </span>
          )}
        </button>

        {/* Save/Bookmark */}
        <button onClick={handleSaveToggle} className="flex items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "#000" : "none"} stroke="#000" strokeWidth="1.8">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {saveCount > 0 && (
            <span style={{ fontSize: 13, color: "rgba(0,0,0,0.6)" }} className="tabular-nums">
              {saveCount.toLocaleString()}
            </span>
          )}
        </button>

        {/* Share — pushed to far right */}
        <button onClick={handleShare} className="ml-auto flex items-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Details */}
      <div className="px-4 pt-4 pb-6">
        {outfit.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {outfit.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
          </div>
        )}

        {outfit.description && (
          <p className="text-neutral-500 text-sm leading-relaxed mb-5">{outfit.description}</p>
        )}

        {/* Breakdown header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-neutral-900 tracking-tight">The Breakdown</h2>
            {fitValue
              ? <p className="text-xs text-neutral-400 mt-0.5">{outfit.items.length} pieces · {fitValue} fit value</p>
              : <p className="text-xs text-neutral-400 mt-0.5">{outfit.items.length} items</p>
            }
          </div>
          <div className="flex items-center gap-2">
            <CompletenessBadge score={score} />
            <ShareBreakdownButton outfit={outfit} />
          </div>
        </div>

        {/* Item cards */}
        <div className="flex flex-col gap-2">
          {outfit.items.map((item) => {
            const isActive = item.id === activeItemId;
            const isExact = item.shopType !== "similar";
            const isSaved = savedItemIds.has(item.id);

            return (
              <div
                key={item.id}
                id={`item-card-${item.id}`}
                onClick={() => activateItem(item.id)}
                className="flex items-center gap-3 cursor-pointer"
                style={{ background: "#fff", border: `1.5px solid ${isActive ? "#000" : "rgba(0,0,0,0.08)"}`, borderRadius: 14, padding: "10px 12px 10px 10px", transition: "border-color 200ms", minHeight: 80 }}
              >
                <div className="relative shrink-0" style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", background: "#f4f4f4" }}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="72px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ccc" }}>{item.category}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa" }}>{item.category}</span>
                    {!isExact && (
                      <span style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", background: "#fef3c7", padding: "1px 6px", borderRadius: 999 }}>Similar</span>
                    )}
                  </div>
                  {item.brand && <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", lineHeight: 1.2 }}>{item.brand}</p>}
                  <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#000", lineHeight: 1.3 }}>{item.name}</p>
                  {item.note && <p className="truncate" style={{ fontSize: 10, fontStyle: "italic", color: "#aaa" }}>{item.note}</p>}
                  {item.price > 0 && <p style={{ fontSize: 13, color: "#000" }}>${item.price.toLocaleString()}</p>}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {item.shopLink && item.shopLink !== "#" && (
                    <a
                      href={normalizeExternalUrl(item.shopLink) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.stopPropagation(); trackClick(item.id, outfit.id).catch(() => {}); }}
                      style={{ fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 999, background: isExact ? "#000" : "transparent", color: isExact ? "#fff" : "#000", border: isExact ? "none" : "1.5px solid #000", whiteSpace: "nowrap" }}
                    >
                      {isExact ? "Shop" : "Similar"}
                    </a>
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleSavedItem(item.id); }}
                      style={{ color: isSaved ? "#000" : "#d1d1d1", padding: "4px" }}
                      aria-label={isSaved ? "Unsave item" : "Save item"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {score > 0 && score < 100 && (
          <p className="text-[11px] text-neutral-300 text-center mt-6 tracking-wide">
            Add images, prices, and links to reach Complete Fit ✦
          </p>
        )}
      </div>

      {/* Comments */}
      <div ref={commentsRef} className="border-t border-neutral-100 mt-5">
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
