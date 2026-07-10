"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MediaCarousel from "@/components/MediaCarousel";
import { createClient } from "@/lib/supabase/client";
import { toggleSave } from "@/app/actions/saved";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useLikeContext } from "@/context/LikeContext";
import type { Outfit } from "@/types";

interface HomeFeedCardProps {
  outfit: Outfit;
  initialLiked: boolean;
  initialSaved: boolean;
  isAuthenticated: boolean;
  currentUserId: string | null;
  priority?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function getFitValueNum(items: Outfit["items"]): number {
  return items.filter((i) => i.price > 0).reduce((a, i) => a + i.price, 0);
}

function formatFitValue(n: number): string {
  if (n <= 0) return "";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

function isCompleteFit(outfit: Outfit): boolean {
  return outfit.items.length >= 3 && outfit.items.every((i) => i.name && i.brand && i.price > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-elements
// ─────────────────────────────────────────────────────────────────────────────

function SaveBtn({ saved, animating, onClick }: { saved: boolean; animating: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      className="absolute flex items-center justify-center border-none cursor-pointer"
      style={{ top: 10, right: 10, width: 32, height: 32, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: "50%", zIndex: 10 }}
      onClick={onClick}
      aria-label={saved ? "Unsave" : "Save"}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "white" : "none"} stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" className={animating ? "animate-save-drop" : ""}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

function HeartBurst({ pos }: { pos: { x: number; y: number } }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: pos.x, top: pos.y, zIndex: 20 }}>
      <svg width="80" height="80" viewBox="0 0 24 24" fill="white" stroke="none" className="animate-heart-burst" style={{ position: "absolute", transform: "translate(-50%,-50%)" }}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </div>
  );
}

function DarkSocialBar({
  liked, likeCount, likeAnimating, countAnimating,
  commentsCount, handleLike, handleComment, handleShare,
  router, outfitId,
}: {
  liked: boolean; likeCount: number; likeAnimating: boolean; countAnimating: boolean;
  commentsCount: number; handleLike: () => void; handleComment: (e: React.MouseEvent) => void;
  handleShare: (e: React.MouseEvent) => void; router: ReturnType<typeof useRouter>; outfitId: string;
}) {
  return (
    <div style={{ padding: "10px 14px 8px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", background: "#0a0a0a" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
        {/* Like */}
        <button onClick={handleLike} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label={liked ? "Unlike" : "Like"}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "white" : "none"} stroke={liked ? "white" : "rgba(255,255,255,0.55)"} strokeWidth="1.8" className={likeAnimating ? "animate-like-pop" : ""}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 && (
            <span className={`font-data text-[12px] ${countAnimating ? "animate-count-flip" : ""}`} style={{ color: "rgba(255,255,255,0.5)" }}>{likeCount.toLocaleString()}</span>
          )}
        </button>
        {/* Comment */}
        <button onClick={handleComment} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="Comments">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentsCount > 0 && (
            <span className="font-data text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>{commentsCount.toLocaleString()}</span>
          )}
        </button>
        {/* Share */}
        <button onClick={handleShare} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="Share">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
      {/* View breakdown */}
      <button
        onClick={() => router.push(`/outfit/${outfitId}`)}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.25)", paddingBottom: 1, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "white", letterSpacing: "0.02em", whiteSpace: "nowrap" }}
      >
        View breakdown →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeFeedCard({
  outfit,
  initialLiked,
  initialSaved,
  isAuthenticated,
  currentUserId,
  priority = false,
}: HomeFeedCardProps) {
  const router = useRouter();
  const { openPrompt, authLoaded } = useAuthPrompt();
  const { getLiked, getCount, setLike } = useLikeContext();

  const creatorUsername = outfit.creatorHandle.replace("@", "");
  const fitValueNum = getFitValueNum(outfit.items);
  const fitValueStr = formatFitValue(fitValueNum);
  const pieceCount = outfit.items.length;
  const complete = isCompleteFit(outfit);
  const cardStyle = outfit.cardStyle ?? "editorial";

  // ── Like state ─────────────────────────────────────────────────────────────
  const ctxLiked = getLiked(outfit.id);
  const ctxCount = getCount(outfit.id);

  const [liked, setLiked] = useState(() => ctxLiked !== undefined ? ctxLiked : initialLiked);
  const [likeCount, setLikeCount] = useState(ctxCount !== undefined ? ctxCount : (outfit.likesCount ?? 0));
  const likeCountRef = useRef(ctxCount !== undefined ? ctxCount : (outfit.likesCount ?? 0));
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [countAnimating, setCountAnimating] = useState(false);

  const likeAnimTimer = useRef<number>(0);
  const countAnimTimer = useRef<number>(0);
  const dbTimer = useRef<number>(0);
  const singleTapTimer = useRef<number>(0);

  useEffect(() => () => {
    clearTimeout(likeAnimTimer.current);
    clearTimeout(countAnimTimer.current);
    clearTimeout(dbTimer.current);
    clearTimeout(singleTapTimer.current);
  }, []);

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(initialSaved);
  const [saveAnimating, setSaveAnimating] = useState(false);

  // ── Heart burst (double-tap) ────────────────────────────────────────────────
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number } | null>(null);
  const lastTap = useRef(0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLike = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (authLoaded && !isAuthenticated) { openPrompt("like"); return; }
    if (!currentUserId) { openPrompt("like"); return; }

    clearTimeout(likeAnimTimer.current);
    setLikeAnimating(false);
    requestAnimationFrame(() => {
      setLikeAnimating(true);
      likeAnimTimer.current = window.setTimeout(() => setLikeAnimating(false), 400);
    });
    clearTimeout(countAnimTimer.current);
    setCountAnimating(false);
    requestAnimationFrame(() => {
      setCountAnimating(true);
      countAnimTimer.current = window.setTimeout(() => setCountAnimating(false), 280);
    });

    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCountRef.current + 1 : Math.max(0, likeCountRef.current - 1);
    setLiked(nextLiked);
    setLikeCount(nextCount);
    likeCountRef.current = nextCount;
    setLike(outfit.id, nextLiked, nextCount);

    clearTimeout(dbTimer.current);
    dbTimer.current = window.setTimeout(async () => {
      const supabase = createClient();
      try {
        if (nextLiked) {
          await supabase.from("likes").upsert({ user_id: currentUserId, outfit_id: outfit.id }, { onConflict: "user_id,outfit_id" });
          if (outfit.creatorId && outfit.creatorId !== currentUserId) {
            await supabase.from("notifications").insert({ recipient_id: outfit.creatorId, actor_id: currentUserId, type: "like", outfit_id: outfit.id });
          }
        } else {
          await supabase.from("likes").delete().eq("user_id", currentUserId).eq("outfit_id", outfit.id);
        }
      } catch { /* silent */ }
    }, 500);
  }, [liked, currentUserId, outfit.id, outfit.creatorId, authLoaded, isAuthenticated, openPrompt, setLike]);

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authLoaded && !isAuthenticated) { openPrompt("save"); return; }
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 350);
    const prev = saved;
    setSaved(!saved);
    try {
      const result = await toggleSave(outfit.id);
      setSaved(result.saved);
    } catch { setSaved(prev); }
  }, [saved, isAuthenticated, outfit.id, authLoaded, openPrompt]);

  const handleImageTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(singleTapTimer.current);
      const rect = e.currentTarget.getBoundingClientRect();
      setHeartBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setHeartBurst(null), 700);
      if (!liked) handleLike();
    } else {
      singleTapTimer.current = window.setTimeout(() => router.push(`/outfit/${outfit.id}`), 280);
    }
    lastTap.current = now;
  }, [liked, handleLike, router, outfit.id]);

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/outfit/${outfit.id}#comments`);
  }, [router, outfit.id]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://fytd.org/outfit/${outfit.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: outfit.title, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    }
  }, [outfit.id, outfit.title]);

  const commentsCount = outfit.commentsCount ?? 0;

  // ── Shared footer (all card styles) ───────────────────────────────────────
  const footer = (
    <>
      <DarkSocialBar
        liked={liked} likeCount={likeCount} likeAnimating={likeAnimating} countAnimating={countAnimating}
        commentsCount={commentsCount} handleLike={handleLike} handleComment={handleComment}
        handleShare={handleShare} router={router} outfitId={outfit.id}
      />
      {likeCount > 0 && (
        <div style={{ padding: "2px 14px 3px", background: "#0a0a0a" }}>
          <span className="text-[13px] font-semibold text-white">{likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}</span>
        </div>
      )}
      {outfit.description && (
        <div style={{ padding: "2px 14px 4px", background: "#0a0a0a" }}>
          <span className="text-[13px] font-semibold text-white mr-1">{creatorUsername}</span>
          <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>
            {outfit.description.length > 120
              ? <>{outfit.description.slice(0, 120)}<span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}> more</span></>
              : outfit.description}
          </span>
        </div>
      )}
      {commentsCount > 0 && (
        <button onClick={handleComment} style={{ display: "block", width: "100%", textAlign: "left", padding: "2px 14px 12px", background: "#0a0a0a", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
          View all {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
        </button>
      )}
    </>
  );

  // ── EDITORIAL style ────────────────────────────────────────────────────────
  if (cardStyle === "editorial") {
    return (
      <article style={{ background: "#0a0a0a", borderBottom: "6px solid rgba(255,255,255,0.03)", width: "100%" }}>
        <div className="relative aspect-[4/5] w-full overflow-hidden select-none" style={{ background: "#111", cursor: "pointer" }} onClick={handleImageTap}>
          <MediaCarousel media={outfit.media} title={outfit.title} priority={priority} sizes="(max-width: 480px) 100vw, 480px" showCounter={false} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 40%,transparent 70%)", zIndex: 5 }} />

          {/* Creator pill — overlaid top left */}
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/profile/${creatorUsername}`); }}
            className="absolute border-none cursor-pointer flex items-center gap-1.5"
            style={{ top: 10, left: 10, background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 999, padding: "3px 10px 3px 3px", zIndex: 10 }}
          >
            <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: 20, height: 20, background: "rgba(255,255,255,0.2)" }}>
              {outfit.creatorAvatar
                ? <Image src={outfit.creatorAvatar} alt={outfit.creatorName} width={20} height={20} className="object-cover w-full h-full" />
                : <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{(outfit.creatorName || "?")[0].toUpperCase()}</span>}
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.85)", letterSpacing: "0.02em" }}>@{creatorUsername}</span>
          </button>

          <SaveBtn saved={saved} animating={saveAnimating} onClick={handleSave} />

          {/* Title + tags + value at bottom */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ padding: "16px 14px 14px", zIndex: 10 }}>
            {outfit.tags.length > 0 && (
              <div className="flex gap-2 mb-1.5 flex-wrap">
                {outfit.tags.slice(0, 2).map((tag) => (
                  <span key={tag} style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>#{tag}</span>
                ))}
              </div>
            )}
            <h2 className="font-editorial m-0 leading-[1.1] text-white" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 6, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{outfit.title}</h2>
            {fitValueNum > 0 && (
              <p className="font-data m-0" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {pieceCount} {pieceCount === 1 ? "piece" : "pieces"} · {fitValueStr} fit value
              </p>
            )}
          </div>

          {heartBurst && <HeartBurst pos={heartBurst} />}
        </div>
        {footer}
      </article>
    );
  }

  // ── STATEMENT style ────────────────────────────────────────────────────────
  if (cardStyle === "statement") {
    return (
      <article style={{ background: "#0a0a0a", borderBottom: "6px solid rgba(255,255,255,0.03)", width: "100%" }}>
        <div className="relative aspect-[4/5] w-full overflow-hidden select-none" style={{ background: "#111", cursor: "pointer" }} onClick={handleImageTap}>
          <MediaCarousel media={outfit.media} title={outfit.title} priority={priority} sizes="(max-width: 480px) 100vw, 480px" showCounter={false} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.15) 60%,transparent 100%)", zIndex: 5 }} />

          {/* Value badges — top left: piece count (dark) + value (WHITE pill) */}
          <div className="absolute flex items-center gap-1.5" style={{ top: 10, left: 10, zIndex: 10 }}>
            {pieceCount > 0 && (
              <div style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 999, padding: "4px 10px" }}>
                <span className="font-data" style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{pieceCount} {pieceCount === 1 ? "piece" : "pieces"}</span>
              </div>
            )}
            {fitValueNum > 0 && (
              <div style={{ background: "white", borderRadius: 999, padding: "4px 10px" }}>
                <span className="font-data" style={{ fontSize: 9, fontWeight: 700, color: "#0a0a0a", letterSpacing: "0.06em" }}>{fitValueStr}</span>
              </div>
            )}
          </div>

          <SaveBtn saved={saved} animating={saveAnimating} onClick={handleSave} />

          {/* Title + creator row at bottom */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ padding: "16px 14px 14px", zIndex: 10 }}>
            <h2 className="font-editorial m-0 leading-[1.1] text-white" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>{outfit.title}</h2>
            <div className="flex items-center gap-1.5">
              <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: 18, height: 18, background: "rgba(255,255,255,0.2)" }}>
                {outfit.creatorAvatar && <Image src={outfit.creatorAvatar} alt={outfit.creatorName} width={18} height={18} className="object-cover w-full h-full" />}
              </div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>@{creatorUsername}</span>
            </div>
          </div>

          {heartBurst && <HeartBurst pos={heartBurst} />}
        </div>
        {footer}
      </article>
    );
  }

  // ── STREETWEAR style ───────────────────────────────────────────────────────
  return (
    <article style={{ background: "#111", borderBottom: "6px solid rgba(255,255,255,0.03)", width: "100%" }}>
      {/* Data header — ABOVE the image */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => router.push(`/profile/${creatorUsername}`)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", textAlign: "left", flex: 1, minWidth: 0, padding: 0 }}
        >
          <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, background: "rgba(255,255,255,0.1)" }}>
            {outfit.creatorAvatar
              ? <Image src={outfit.creatorAvatar} alt={outfit.creatorName} width={32} height={32} className="object-cover w-full h-full" />
              : <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>{(outfit.creatorName || "?")[0].toUpperCase()}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {outfit.creatorName}
            </div>
            <div className="font-data" style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
              {pieceCount > 0 && `${pieceCount} pieces`}
              {fitValueNum > 0 && ` · ${fitValueStr} fit`}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {complete && (
            <span className="font-data" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: "3px 8px", fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              COMPLETE ✦
            </span>
          )}
          <button onClick={() => router.push(`/outfit/${outfit.id}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="More">
            <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1" fill="rgba(255,255,255,0.3)" /><circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.3)" /><circle cx="12" cy="19" r="1" fill="rgba(255,255,255,0.3)" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden select-none" style={{ background: "#111", cursor: "pointer" }} onClick={handleImageTap}>
        <MediaCarousel media={outfit.media} title={outfit.title} priority={priority} sizes="(max-width: 480px) 100vw, 480px" showCounter={false} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)", zIndex: 5 }} />

        {/* Tags top left */}
        {outfit.tags.length > 0 && (
          <div className="absolute flex gap-1.5" style={{ top: 10, left: 10, zIndex: 10 }}>
            {outfit.tags.slice(0, 2).map((tag) => (
              <span key={tag} style={{ fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>#{tag}</span>
            ))}
          </div>
        )}

        <SaveBtn saved={saved} animating={saveAnimating} onClick={handleSave} />

        {/* Title bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ padding: "12px 14px", zIndex: 10 }}>
          <h2 className="font-editorial m-0 leading-[1.1] text-white" style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}>{outfit.title}</h2>
        </div>

        {heartBurst && <HeartBurst pos={heartBurst} />}
      </div>

      {footer}
    </article>
  );
}
