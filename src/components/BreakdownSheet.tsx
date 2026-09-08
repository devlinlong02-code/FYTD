"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { normalizeExternalUrl } from "@/lib/links";
import { trackClick } from "@/app/actions/clicks";
import { createClient } from "@/lib/supabase/client";
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
  onAsk?: () => void;
}

const SNAP: Record<SheetState, string> = {
  closed: "translateY(100%)",
  half:   "translateY(30%)",
  full:   "translateY(5%)",
};
const TRANSITION = "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";

const ACTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-data)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--page-text-muted)",
};

interface ItemQuestion {
  id: string;
  question: string;
  created_at: string;
  user_id: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
}

interface ItemSlideProps {
  item: OutfitItem;
  isSaved: boolean;
  onSave: () => void;
  onAsk: () => void;
  shopUrl: string | null;
  outfitId: string;
  isAskOpen: boolean;
  askText: string;
  onAskTextChange: (text: string) => void;
  onAskSubmit: () => void;
  askPosting: boolean;
  askPosted: boolean;
  onCancelAsk: () => void;
  questions: ItemQuestion[];
}

function ItemSlide({ item, isSaved, onSave, onAsk, shopUrl, outfitId, isAskOpen, askText, onAskTextChange, onAskSubmit, askPosting, askPosted, onCancelAsk, questions }: ItemSlideProps) {
  return (
    <div style={{ flex: "0 0 100%", height: "100%", scrollSnapAlign: "start", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
        {/* Image */}
        <div style={{ height: 200, position: "relative", background: "var(--page-surface)", margin: "0 16px 10px", borderRadius: 14, overflow: "hidden" }}>
          {item.image ? (
            <Image src={item.image} alt={item.name} fill sizes="(max-width: 448px) 100vw, 416px" style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" style={{ color: "var(--page-icon)" }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
        {/* Details */}
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--page-text-muted)", background: "var(--page-surface)", padding: "3px 8px", borderRadius: 6 }}>
              {item.category}
            </span>
            {item.shopType === "similar" && (
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b45309", background: "rgba(251,191,36,0.12)", padding: "3px 8px", borderRadius: 6, marginLeft: 6 }}>Similar</span>
            )}
          </div>
          {item.brand && <p style={{ fontSize: 11, color: "var(--page-text-muted)", marginBottom: 2, fontWeight: 500 }}>{item.brand}</p>}
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--page-text-primary)", lineHeight: 1.3, marginBottom: 2, overflow: "hidden" }} className="line-clamp-2">{item.name}</p>
          {item.price > 0 && <p style={{ fontSize: 17, fontWeight: 700, color: "var(--page-text-primary)", marginBottom: 2 }}>${item.price.toLocaleString()}</p>}
          {item.note && <p style={{ fontSize: 12, color: "var(--page-text-muted)", fontStyle: "italic", overflow: "hidden" }} className="line-clamp-2">{item.note}</p>}
        </div>

        {/* Inline actions */}
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "12px 16px 20px",
          borderTop: "0.5px solid var(--page-border)",
          marginTop: 8,
        }}>
          {/* Save */}
          <button
            onClick={onSave}
            aria-label={isSaved ? "Saved" : "Save item"}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, background: "none", border: "none", cursor: "pointer",
              padding: "4px 16px",
              color: isSaved ? "var(--page-text-primary)" : "var(--page-text-muted)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span style={ACTION_LABEL_STYLE}>{isSaved ? "Saved" : "Save"}</span>
          </button>

          {/* Ask */}
          <button
            onClick={onAsk}
            aria-label="Ask about this item"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, background: "none", border: "none", cursor: "pointer",
              padding: "4px 16px", color: "var(--page-text-muted)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={ACTION_LABEL_STYLE}>Ask</span>
          </button>

          {/* Shop */}
          {shopUrl ? (
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(item.id, outfitId).catch(() => {})}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "4px 16px", textDecoration: "none",
                color: "var(--page-text-primary)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span style={ACTION_LABEL_STYLE}>Shop</span>
            </a>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "4px 16px", opacity: 0.3,
              pointerEvents: "none", color: "var(--page-text-muted)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span style={ACTION_LABEL_STYLE}>Shop</span>
            </div>
          )}
        </div>

        {/* Questions list */}
        {questions.length > 0 && (
          <div style={{ borderTop: "0.5px solid var(--page-border)", margin: "0 0 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--page-text-muted)", padding: "10px 16px 6px" }}>
              Questions · {questions.length}
            </p>
            {questions.map((q) => (
              <div key={q.id} style={{ padding: "6px 16px 8px", borderBottom: "0.5px solid var(--page-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--page-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {q.profiles?.avatar_url ? (
                      <img src={q.profiles.avatar_url} alt={q.profiles.username ?? "user"} style={{ width: 18, height: 18, objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--page-text-muted)" }}>
                        {(q.profiles?.username ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--page-text-primary)", fontFamily: "var(--font-body)" }}>
                    {q.profiles?.username ?? "user"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--page-text-muted)", fontFamily: "var(--font-body)" }}>asked</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--page-text-primary)", fontFamily: "var(--font-body)", lineHeight: 1.4, margin: 0, paddingLeft: 24 }}>
                  {q.question}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Ask panel */}
        {isAskOpen && (
          <div style={{ padding: "0 16px 16px" }}>
            {askPosted ? (
              <div style={{
                textAlign: "center",
                padding: "14px",
                fontSize: 13,
                color: "var(--page-text-muted)",
                fontFamily: "var(--font-body)",
              }}>
                ✓ Question posted
              </div>
            ) : (
              <>
                <textarea
                  autoFocus
                  value={askText}
                  onChange={(e) => onAskTextChange(e.target.value)}
                  placeholder="Ask something about this item..."
                  rows={2}
                  style={{
                    width: "100%",
                    background: "var(--page-surface)",
                    border: "1px solid var(--page-border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "var(--page-text-primary)",
                    fontFamily: "var(--font-body)",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, gap: 8 }}>
                  <button
                    onClick={onCancelAsk}
                    style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--page-text-muted)", padding: "4px 8px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onAskSubmit}
                    disabled={askPosting || !askText.trim()}
                    style={{
                      fontSize: 12,
                      background: askText.trim() ? "var(--page-text-primary)" : "var(--page-surface)",
                      color: askText.trim() ? "var(--page-bg)" : "var(--page-text-muted)",
                      border: "none", borderRadius: 6,
                      cursor: askText.trim() ? "pointer" : "default",
                      padding: "4px 12px", fontWeight: 600,
                      opacity: askPosting ? 0.6 : 1,
                    }}
                  >
                    {askPosting ? "Posting..." : "Post"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BreakdownSheet({
  outfit,
  sheetState,
  onSheetStateChange,
  activeItemIndex,
  onItemChange,
  isAuthenticated,
  currentUserId,
  savedItemIds,
  onToggleSavedItem,
  openPrompt = (() => {}) as (action: ActionType) => void,
  commentsRef,
  onAsk,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [askingItemId, setAskingItemId] = useState<string | null>(null);
  const [askText, setAskText] = useState<Record<string, string>>({});
  const [askPosting, setAskPosting] = useState(false);
  const [askPosted, setAskPosted] = useState<string | null>(null);
  const [itemQuestions, setItemQuestions] = useState<Record<string, ItemQuestion[]>>({});
  useEffect(() => { setMounted(true); }, []);

  const supabase = createClient();

  const fetchItemQuestions = useCallback(async (itemId: string) => {
    const { data } = await supabase
      .from("item_questions")
      .select("id, question, created_at, user_id, profiles(username, avatar_url)")
      .eq("item_id", itemId)
      .order("created_at", { ascending: true })
      .limit(20);
    if (data) {
      const mapped = data.map((row) => ({
        ...row,
        profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
      })) as ItemQuestion[];
      setItemQuestions((prev) => ({ ...prev, [itemId]: mapped }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAskSubmit = useCallback(async (item: OutfitItem) => {
    if (!isAuthenticated) { openPrompt("comment"); return; }
    if (!currentUserId) { openPrompt("comment"); return; }
    const text = (askText[item.id] ?? "").trim();
    if (!text) return;

    setAskPosting(true);
    try {
      const { error } = await supabase
        .from("item_questions")
        .insert({ item_id: item.id, user_id: currentUserId, question: text });

      if (error) throw error;

      setAskText((prev) => ({ ...prev, [item.id]: "" }));
      setAskPosted(item.id);
      fetchItemQuestions(item.id);
      setTimeout(() => {
        setAskPosted(null);
        setAskingItemId(null);
      }, 1500);
    } catch (err) {
      console.error("[BreakdownSheet] ask submit failed:", err);
    } finally {
      setAskPosting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUserId, askText, openPrompt, fetchItemQuestions]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartTranslateY = useRef(0);
  const isDragging = useRef(false);
  const scrollTimer = useRef<number>(0);
  const sheetStateRef = useRef(sheetState);

  useEffect(() => { sheetStateRef.current = sheetState; });

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || sheetState === "closed") return;
    const targetX = activeItemIndex * el.offsetWidth;
    if (Math.abs(el.scrollLeft - targetX) > 4) el.scrollTo({ left: targetX, behavior: "smooth" });
  }, [activeItemIndex, sheetState]);

  useEffect(() => {
    if (sheetState === "closed") return;
    const item = outfit.items[activeItemIndex];
    if (item && !itemQuestions[item.id]) {
      fetchItemQuestions(item.id);
    }
  }, [sheetState, activeItemIndex, outfit.items, itemQuestions, fetchItemQuestions]);

  const getTranslateYPx = useCallback((s: SheetState): number => {
    const h = sheetRef.current ? sheetRef.current.offsetHeight : window.innerHeight - 60;
    if (s === "closed") return h;
    if (s === "half")   return h * 0.30;
    return h * 0.05;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartTranslateY.current = getTranslateYPx(sheetStateRef.current);
    sheet.style.transition = "none";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [getTranslateYPx]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const raw = dragStartTranslateY.current + (e.clientY - dragStartY.current);
    sheet.style.transform = `translateY(${Math.max(sheet.offsetHeight * 0.05, raw)}px)`;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const delta = e.clientY - dragStartY.current;
    const current = sheetStateRef.current;
    let next: SheetState;
    if (delta < -60)     next = current === "half" ? "full" : "full";
    else if (delta > 60) next = current === "full" ? "half" : "closed";
    else                 next = current;
    sheet.style.transition = TRANSITION;
    sheet.style.transform = SNAP[next];
    onSheetStateChange(next);
  }, [onSheetStateChange]);

  const handleCarouselScroll = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = carouselRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      if (idx !== activeItemIndex) onItemChange(idx);
    }, 60);
  }, [activeItemIndex, onItemChange]);

  const scrollToItem = useCallback((i: number) => {
    onItemChange(i);
    const el = carouselRef.current;
    if (el) el.scrollTo({ left: i * el.offsetWidth, behavior: "smooth" });
  }, [onItemChange]);

  const items = outfit.items;

  // Don't render until client-side and there are items
  if (!mounted || items.length === 0) return null;

  const isOpen = sheetState !== "closed";
  const currentItem = items[activeItemIndex] ?? items[0];
  const shopUrl = normalizeExternalUrl(currentItem.shopLink ?? "");
  const hasShopLink = !!shopUrl;
  const isSaved = savedItemIds.includes(currentItem.id);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}>
      {/* Backdrop */}
      <div
        onClick={() => onSheetStateChange("closed")}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", opacity: isOpen ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: isOpen ? "auto" : "none" }}
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
          height: "calc(100vh - 60px)",
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
        <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
          style={{ padding: "14px 0 8px", cursor: "grab", touchAction: "none", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: "var(--page-border)", borderRadius: 2, margin: "0 auto" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 12px", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--page-text-primary)" }}>
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </span>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {items.map((_, i) => (
              <button key={i} onClick={() => scrollToItem(i)} aria-label={`Item ${i + 1}`}
                style={{ width: i === activeItemIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === activeItemIndex ? "var(--page-text-primary)" : "var(--page-border)", transition: "width 0.2s ease, background 0.2s ease", border: "none", padding: 0, cursor: "pointer" }}
              />
            ))}
          </div>
          <button onClick={() => onSheetStateChange("closed")} aria-label="Close"
            style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--page-surface)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--page-icon)" }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Carousel */}
        <div ref={carouselRef} onScroll={handleCarouselScroll}
          style={{ flex: "1 1 0", minHeight: 0, display: "flex", overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.map((item) => {
            const url = normalizeExternalUrl(item.shopLink ?? "");
            return (
              <ItemSlide
                key={item.id}
                item={item}
                outfitId={outfit.id}
                shopUrl={url || null}
                isSaved={savedItemIds.includes(item.id)}
                isAskOpen={askingItemId === item.id}
                askText={askText[item.id] ?? ""}
                onAskTextChange={(text) => setAskText((prev) => ({ ...prev, [item.id]: text }))}
                onAskSubmit={() => handleAskSubmit(item)}
                askPosting={askPosting}
                askPosted={askPosted === item.id}
                questions={itemQuestions[item.id] ?? []}
                onCancelAsk={() => setAskingItemId(null)}
                onSave={() => {
                  if (!isAuthenticated) { openPrompt("save"); return; }
                  onToggleSavedItem(item.id);
                }}
                onAsk={() => setAskingItemId(askingItemId === item.id ? null : item.id)}
              />
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
