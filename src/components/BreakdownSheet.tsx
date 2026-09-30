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
const SHEET_HEIGHT = "calc(100dvh - 60px)";
// Bottom padding that makes the scroll container overflow by at least the
// off-screen slice + nav height so content is reachable at every snap position.
const NAV_CLEARANCE = "80px + env(safe-area-inset-bottom, 0px)";
const SCROLL_PAD: Record<SheetState, string> = {
  closed: `calc((100dvh - 60px) * 0.30 + ${NAV_CLEARANCE})`,
  half:   `calc((100dvh - 60px) * 0.30 + ${NAV_CLEARANCE})`,
  full:   `calc((100dvh - 60px) * 0.05 + ${NAV_CLEARANCE})`,
};
// Resolved at render time via a CSS custom property set on the sheet root.
const OFFSCREEN_PAD = "var(--sheet-scroll-pad)";

const ACTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-data)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--page-text-muted)",
};

function getCategoryIcon(category: string) {
  const style: React.CSSProperties = { color: "var(--page-text-muted)" };
  switch (category?.toLowerCase()) {
    case "top":
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
        </svg>
      );
    case "bottom":
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <path d="M6 2h12l2 7H4L6 2z"/><path d="M4 9l2 13h5l1-7 1 7h5l2-13"/>
        </svg>
      );
    case "outerwear":
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
          <path d="M8 10v4M16 10v4"/>
        </svg>
      );
    case "footwear":
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <path d="M3 17h10a4 4 0 0 0 4-4V6l4 2v9a2 2 0 0 1-2 2H3v-2z"/>
          <path d="M3 17v2"/>
        </svg>
      );
    case "bag":
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      );
    case "accessory":
    case "accessories":
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
      );
    default:
      return (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={style}>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      );
  }
}

interface ItemQuestion {
  id: string;
  question: string;
  created_at: string;
  user_id: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
}

function ItemImageFallback({ item }: { item: OutfitItem }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10,
      background: "var(--page-surface)",
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: 14,
        background: "var(--page-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {getCategoryIcon(item.category)}
      </div>
      <div style={{ textAlign: "center", padding: "0 16px" }}>
        {item.brand && (
          <p style={{
            fontSize: 13, fontWeight: 700, margin: 0,
            color: "var(--page-text-primary)",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            {item.brand}
          </p>
        )}
        <p style={{
          fontSize: 10, margin: item.brand ? "3px 0 0" : 0,
          color: "var(--page-text-muted)",
          fontFamily: "var(--font-data)",
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          {item.category}
        </p>
      </div>
    </div>
  );
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
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div style={{ flex: "0 0 100%", width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", paddingBottom: OFFSCREEN_PAD }}>
        {/* Image */}
        <div style={{ height: 200, position: "relative", background: "var(--page-surface)", margin: "0 16px 10px", borderRadius: 14, overflow: "hidden" }}>
          {item.image && !imgFailed ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 448px) 100vw, 416px"
              style={{ objectFit: "contain" }}
              onError={() => setImgFailed(true)}
              unoptimized
            />
          ) : (
            <ItemImageFallback item={item} />
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

interface GridItemCardProps {
  item: OutfitItem;
  index: number;
  isSaved: boolean;
  onSave: () => void;
  shopUrl: string | null;
  outfitId: string;
  onAsk: () => void;
  onSelect: () => void;
}

function GridItemCard({ item, index, isSaved, onSave, shopUrl, outfitId, onAsk, onSelect }: GridItemCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={{ background: "var(--page-surface)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", minHeight: 0 }}>
      {/* Image */}
      <div
        onClick={onSelect}
        style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--page-bg)", overflow: "hidden" }}
      >
        {item.image && !imgFailed ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--page-surface)" }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--page-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--page-text-muted)" }}>
              {index + 1}
            </span>
          </div>
        )}
        {isSaved && (
          <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ padding: "8px 10px 4px", cursor: "pointer", minHeight: 52 }} onClick={onSelect}>
        {item.brand && (
          <p style={{ fontSize: 9, fontWeight: 600, color: "var(--page-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px", fontFamily: "var(--font-data)" }}>
            {item.brand}
          </p>
        )}
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--page-text-primary)", margin: "0 0 2px", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
          {item.name}
        </p>
        {item.price > 0 && (
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--page-text-primary)", margin: 0, fontFamily: "var(--font-data)" }}>
            ${item.price.toLocaleString()}
          </p>
        )}
      </div>

      {/* Action row */}
      <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 4px 8px", borderTop: "0.5px solid var(--page-border)", marginTop: "auto", flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: isSaved ? "var(--page-text-primary)" : "var(--page-text-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: 8, fontFamily: "var(--font-data)", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--page-text-muted)" }}>{isSaved ? "Saved" : "Save"}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onAsk(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "var(--page-text-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: 8, fontFamily: "var(--font-data)", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--page-text-muted)" }}>Ask</span>
        </button>

        {shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); trackClick(item.id, outfitId).catch(() => {}); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", textDecoration: "none", color: "var(--page-text-primary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span style={{ fontSize: 8, fontFamily: "var(--font-data)", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--page-text-muted)" }}>Shop</span>
          </a>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", opacity: 0.3, pointerEvents: "none", color: "var(--page-text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span style={{ fontSize: 8, fontFamily: "var(--font-data)", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--page-text-muted)" }}>Shop</span>
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
  type BreakdownView = "carousel" | "grid";
  const [view, setView] = useState<BreakdownView>("carousel");
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
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeIntent = useRef<"none" | "h" | "v">("none");

  useEffect(() => { if (sheetState === "closed") setView("carousel"); }, [sheetState]);
  useEffect(() => {
    if (sheetState === "closed") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheetState]);



  useEffect(() => {
    if (sheetState === "closed") return;
    const item = outfit.items[activeItemIndex];
    if (item && !itemQuestions[item.id]) {
      fetchItemQuestions(item.id);
    }
  }, [sheetState, activeItemIndex, outfit.items, itemQuestions, fetchItemQuestions]);

  const goToItem = useCallback((i: number) => {
    onItemChange(i);
  }, [onItemChange]);

  const handleSwipeStart = useCallback((e: React.PointerEvent) => {
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeIntent.current = "none";
  }, []);

  const handleSwipeMove = useCallback((e: React.PointerEvent) => {
    if (swipeIntent.current !== "none") return;
    const dx = Math.abs(e.clientX - swipeStartX.current);
    const dy = Math.abs(e.clientY - swipeStartY.current);
    if (dx > 5 || dy > 5) {
      swipeIntent.current = dx > dy ? "h" : "v";
    }
  }, []);

  const handleSwipeEnd = useCallback((e: React.PointerEvent) => {
    const intent = swipeIntent.current;
    swipeIntent.current = "none";
    if (intent !== "h") return;
    const dx = e.clientX - swipeStartX.current;
    if (dx < -40 && activeItemIndex < outfit.items.length - 1) {
      onItemChange(activeItemIndex + 1);
    } else if (dx > 40 && activeItemIndex > 0) {
      onItemChange(activeItemIndex - 1);
    }
  }, [activeItemIndex, outfit.items.length, onItemChange]);

  const items = outfit.items;

  // Don't render until client-side and there are items
  if (!mounted || items.length === 0) return null;

  const isOpen = sheetState !== "closed";

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}>
      {/* Backdrop */}
      <div
        onClick={() => onSheetStateChange("closed")}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", opacity: isOpen ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: isOpen ? "auto" : "none", touchAction: "none" }}
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
          height: SHEET_HEIGHT,
          ["--sheet-scroll-pad" as string]: SCROLL_PAD[sheetState],
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
          overscrollBehavior: "none",
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px 12px", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--page-text-primary)" }}>
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </span>
          <div style={{ display: "flex", gap: 5, alignItems: "center", opacity: view === "grid" ? 0 : 1, pointerEvents: view === "grid" ? "none" : "auto", transition: "opacity 0.2s ease" }}>
            {items.map((_, i) => (
              <button key={i} onClick={() => goToItem(i)} aria-label={`Item ${i + 1}`}
                style={{ width: i === activeItemIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === activeItemIndex ? "var(--page-text-primary)" : "var(--page-border)", transition: "width 0.2s ease, background 0.2s ease", border: "none", padding: 0, cursor: "pointer" }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setView(v => v === "carousel" ? "grid" : "carousel")}
              aria-label={view === "carousel" ? "Switch to grid view" : "Switch to carousel view"}
              style={{ width: 28, height: 28, borderRadius: 8, background: "var(--page-surface)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--page-icon)", flexShrink: 0 }}
            >
              {view === "carousel" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="8" height="8" rx="1" />
                  <rect x="13" y="3" width="8" height="8" rx="1" />
                  <rect x="3" y="13" width="8" height="8" rx="1" />
                  <rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="4" width="14" height="16" rx="2" />
                  <line x1="1" y1="9" x2="1" y2="15" />
                  <line x1="23" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            <button onClick={() => onSheetStateChange("closed")} aria-label="Close"
              style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--page-surface)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--page-icon)" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel / Grid */}
        {view === "carousel" ? (
          <div
            style={{ flex: "1 1 0", minHeight: 0, position: "relative", overflow: "hidden", touchAction: "pan-y" }}
            onPointerDown={handleSwipeStart}
            onPointerMove={handleSwipeMove}
            onPointerUp={handleSwipeEnd}
          >
            {items.map((item, i) => {
              const url = normalizeExternalUrl(item.shopLink ?? "");
              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: i === activeItemIndex ? 1 : 0,
                    transform: i === activeItemIndex
                      ? "translateX(0)"
                      : i < activeItemIndex
                        ? "translateX(-100%)"
                        : "translateX(100%)",
                    transition: "opacity 0.25s ease, transform 0.25s ease",
                    pointerEvents: i === activeItemIndex ? "auto" : "none",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <ItemSlide
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
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: `8px 12px ${OFFSCREEN_PAD}`, display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "max-content", gap: 10, alignContent: "start", overscrollBehavior: "contain", touchAction: "pan-y" } as React.CSSProperties}
          >
            {items.map((item, i) => {
              const url = normalizeExternalUrl(item.shopLink ?? "");
              return (
                <GridItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  isSaved={savedItemIds.includes(item.id)}
                  outfitId={outfit.id}
                  shopUrl={url || null}
                  onSave={() => {
                    if (!isAuthenticated) { openPrompt("save"); return; }
                    onToggleSavedItem(item.id);
                  }}
                  onAsk={() => {
                    if (onAsk) { onAsk(); return; }
                    onSheetStateChange("closed");
                    commentsRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onSelect={() => {
                    setView("carousel");
                    onItemChange(i);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
