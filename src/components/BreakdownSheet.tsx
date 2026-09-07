"use client";

import { useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { normalizeExternalUrl } from "@/lib/links";
import { trackClick } from "@/app/actions/clicks";
import type { Outfit, OutfitItem } from "@/types";
import type { RefObject } from "react";
import type { ActionType } from "@/context/AuthPromptContext";

export type SheetState = "closed" | "half" | "full";

interface Props {
  outfit: Outfit;
  sheetState: SheetState;
  onSheetStateChange: (s: SheetState) => void;
  activeItemIndex: number;
  onItemChange: (i: number) => void;
  isAuthenticated: boolean;
  currentUserId: string | null;
  savedItemIds: string[];
  onToggleSavedItem: (itemId: string) => void;
  openPrompt?: (action: ActionType) => void;
  commentsRef?: RefObject<HTMLDivElement>;
}

const SNAP: Record<SheetState, string> = {
  closed: "translateY(100%)",
  half: "translateY(38%)",
  full: "translateY(8%)",
};
const TRANSITION = "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";

// ─── Item slide ────────────────────────────────────────────────────────────────

const ACTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-data)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--page-text-muted)",
};

function ItemSlide({
  item,
  outfitId,
  isSaved,
  onToggleSave,
  isAuthenticated,
  openPrompt,
  onClose,
  commentsRef,
}: {
  item: OutfitItem;
  outfitId: string;
  isSaved: boolean;
  onToggleSave: () => void;
  isAuthenticated: boolean;
  openPrompt: (action: ActionType) => void;
  onClose: () => void;
  commentsRef?: RefObject<HTMLDivElement>;
}) {
  const shopUrl = normalizeExternalUrl(item.shopLink ?? "");
  const hasShopLink = !!shopUrl;

  return (
    <div
      style={{
        flex: "0 0 100%",
        height: "100%",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Image */}
      <div
        style={{
          flex: "0 0 42%",
          position: "relative",
          background: "var(--page-surface)",
          margin: "0 16px 12px",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 448px) 100vw, 416px"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" style={{ color: "var(--page-icon)" }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: "1 1 0", minHeight: 0, padding: "0 16px", display: "flex", flexDirection: "column" }}>
        {/* Category + similar pill */}
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--page-text-muted)",
              background: "var(--page-surface)",
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            {item.category}
          </span>
          {item.shopType === "similar" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#b45309",
                background: "rgba(251,191,36,0.12)",
                padding: "3px 8px",
                borderRadius: 6,
                marginLeft: 6,
              }}
            >
              Similar
            </span>
          )}
        </div>

        {item.brand && (
          <p style={{ fontSize: 11, color: "var(--page-text-muted)", marginBottom: 2, fontWeight: 500 }}>{item.brand}</p>
        )}
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--page-text-primary)", lineHeight: 1.3, marginBottom: 4 }} className="line-clamp-2">
          {item.name}
        </p>
        {item.price > 0 && (
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--page-text-primary)", marginBottom: 4 }}>
            ${item.price.toLocaleString()}
          </p>
        )}
        {item.note && (
          <p style={{ fontSize: 12, color: "var(--page-text-muted)", fontStyle: "italic", marginBottom: 6 }} className="line-clamp-2">
            {item.note}
          </p>
        )}
      </div>

      {/* Actions — 3 icon+label buttons */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderTop: "0.5px solid var(--page-border)",
          paddingBottom: "env(safe-area-inset-bottom, 12px)",
        }}
      >
        {/* Save */}
        <button
          onClick={() => {
            if (!isAuthenticated) { openPrompt("save"); return; }
            onToggleSave();
          }}
          aria-label={isSaved ? "Saved" : "Save item"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 16px",
            color: isSaved ? "var(--page-text-primary)" : "var(--page-text-muted)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span style={ACTION_LABEL_STYLE}>{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Ask */}
        <button
          onClick={() => {
            onClose();
            commentsRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          aria-label="Ask a question"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 16px",
            color: "var(--page-text-muted)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={ACTION_LABEL_STYLE}>Ask</span>
        </button>

        {/* Shop */}
        {hasShopLink ? (
          <a
            href={shopUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(item.id, outfitId).catch(() => {})}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              textDecoration: "none",
              color: "var(--page-text-primary)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span style={ACTION_LABEL_STYLE}>Shop</span>
          </a>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 16px",
              opacity: 0.3,
              pointerEvents: "none",
              color: "var(--page-text-muted)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span style={ACTION_LABEL_STYLE}>Shop</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function BreakdownSheet({
  outfit,
  sheetState,
  onSheetStateChange,
  activeItemIndex,
  onItemChange,
  isAuthenticated,
  savedItemIds,
  onToggleSavedItem,
  openPrompt = (() => {}) as (action: ActionType) => void,
  commentsRef,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartTranslateY = useRef(0);
  const isDragging = useRef(false);
  const scrollTimer = useRef<number>(0);
  const sheetStateRef = useRef(sheetState);

  useEffect(() => {
    sheetStateRef.current = sheetState;
  });

  // Sync carousel scroll when activeItemIndex changes from outside
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || sheetState === "closed") return;
    const targetX = activeItemIndex * el.offsetWidth;
    if (Math.abs(el.scrollLeft - targetX) > 4) {
      el.scrollTo({ left: targetX, behavior: "smooth" });
    }
  }, [activeItemIndex, sheetState]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const getTranslateYPx = useCallback((s: SheetState): number => {
    const vh = window.innerHeight;
    const sheetH = vh * 0.92;
    if (s === "closed") return sheetH;
    if (s === "half") return sheetH * 0.38;
    return sheetH * 0.08;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      isDragging.current = true;
      dragStartY.current = e.clientY;
      dragStartTranslateY.current = getTranslateYPx(sheetStateRef.current);
      sheet.style.transition = "none";
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getTranslateYPx]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const delta = e.clientY - dragStartY.current;
    const vh = window.innerHeight;
    const min = vh * 0.92 * 0.08;
    const raw = dragStartTranslateY.current + delta;
    // Allow slight overscroll past closed (for bounce feel)
    const clamped = Math.max(min, raw);
    sheet.style.transform = `translateY(${clamped}px)`;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const sheet = sheetRef.current;
      if (!sheet) return;

      const delta = e.clientY - dragStartY.current;
      const current = sheetStateRef.current;

      let next: SheetState;
      if (delta < -60) {
        next = current === "closed" ? "half" : current === "half" ? "full" : "full";
      } else if (delta > 60) {
        next = current === "full" ? "half" : "closed";
      } else {
        next = current;
      }

      // Animate to snap position imperatively (React re-render may lag)
      sheet.style.transition = TRANSITION;
      sheet.style.transform = SNAP[next];
      onSheetStateChange(next);
    },
    [onSheetStateChange]
  );

  // ── Carousel scroll tracking ───────────────────────────────────────────────
  const handleCarouselScroll = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = carouselRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      if (idx !== activeItemIndex) onItemChange(idx);
    }, 60);
  }, [activeItemIndex, onItemChange]);

  // ── Dot navigation ─────────────────────────────────────────────────────────
  const scrollToItem = useCallback((i: number) => {
    onItemChange(i);
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: "smooth" });
  }, [onItemChange]);

  const items = outfit.items;
  if (items.length === 0 || typeof document === "undefined") return null;

  const isOpen = sheetState !== "closed";

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => onSheetStateChange("closed")}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 448,
          margin: "0 auto",
          height: "92vh",
          maxHeight: "92vh",
          background: "var(--page-bg)",
          borderRadius: "20px 20px 0 0",
          transform: SNAP[sheetState],
          transition: TRANSITION,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          zIndex: 41,
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            padding: "14px 0 8px",
            cursor: "grab",
            touchAction: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: "var(--page-border)",
              borderRadius: 2,
              margin: "0 auto",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 16px 12px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--page-text-primary)" }}>
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </span>
          {/* Pill dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToItem(i)}
                aria-label={`Go to item ${i + 1}`}
                style={{
                  width: i === activeItemIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeItemIndex ? "var(--page-text-primary)" : "var(--page-border)",
                  transition: "width 0.2s ease, background 0.2s ease",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          {/* Close */}
          <button
            onClick={() => onSheetStateChange("closed")}
            aria-label="Close breakdown"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--page-surface)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--page-icon)",
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Carousel */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          style={{
            flex: "1 1 0",
            minHeight: 0,
            display: "flex",
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {items.map((item) => (
            <ItemSlide
              key={item.id}
              item={item}
              outfitId={outfit.id}
              isSaved={savedItemIds.includes(item.id)}
              onToggleSave={() => onToggleSavedItem(item.id)}
              isAuthenticated={isAuthenticated}
              openPrompt={openPrompt}
              onClose={() => onSheetStateChange("closed")}
              commentsRef={commentsRef}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
