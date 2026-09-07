"use client";

import { useState, useRef, useEffect } from "react";

// ─── Tag catalogue ────────────────────────────────────────────────────────────

export interface StyleTagOption {
  value: string;
  label: string;
  emoji: string;
}

export const STYLE_TAG_GROUPS: { category: string; tags: StyleTagOption[] }[] = [
  {
    category: "Everyday",
    tags: [
      { value: "casual",      label: "Casual",      emoji: "👕" },
      { value: "streetwear",  label: "Streetwear",  emoji: "🏙️" },
      { value: "athleisure",  label: "Athleisure",  emoji: "🏃" },
      { value: "campus",      label: "Campus",      emoji: "🎒" },
      { value: "vintage",     label: "Vintage",     emoji: "🕰️" },
    ],
  },
  {
    category: "Elevated",
    tags: [
      { value: "minimal",          label: "Minimal",          emoji: "◻️" },
      { value: "clean fit",        label: "Clean Fit",        emoji: "✨" },
      { value: "old money",        label: "Old Money",        emoji: "💰" },
      { value: "business casual",  label: "Business Casual",  emoji: "💼" },
      { value: "formal",           label: "Formal",           emoji: "👔" },
    ],
  },
  {
    category: "Aesthetic",
    tags: [
      { value: "y2k",           label: "Y2K",           emoji: "💿" },
      { value: "grunge",        label: "Grunge",        emoji: "🎸" },
      { value: "preppy",        label: "Preppy",        emoji: "🏛️" },
      { value: "dark academia", label: "Dark Academia", emoji: "📚" },
      { value: "coastal",       label: "Coastal",       emoji: "🌊" },
    ],
  },
  {
    category: "Occasion",
    tags: [
      { value: "night out",  label: "Night Out",  emoji: "🌙" },
      { value: "going out",  label: "Going Out",  emoji: "🪩" },
      { value: "festival",   label: "Festival",   emoji: "🎪" },
      { value: "date night", label: "Date Night", emoji: "🌹" },
      { value: "summer",     label: "Summer",     emoji: "☀️" },
    ],
  },
  {
    category: "Active",
    tags: [
      { value: "gym fit",   label: "Gym Fit",   emoji: "💪" },
      { value: "gorpcore",  label: "Gorpcore",  emoji: "🏔️" },
      { value: "workwear",  label: "Workwear",  emoji: "👜" },
      { value: "luxury",    label: "Luxury",    emoji: "💎" },
      { value: "resort",    label: "Resort",    emoji: "🏝️" },
    ],
  },
];

// Flat lookup: value → option
export const STYLE_TAG_MAP: Record<string, StyleTagOption> = Object.fromEntries(
  STYLE_TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.value, t]))
);

// ─── Component ────────────────────────────────────────────────────────────────

interface StyleTagPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StyleTagPicker({ value, onChange }: StyleTagPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? STYLE_TAG_MAP[value] : null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectTag(tagValue: string) {
    onChange(tagValue);
    setOpen(false);
  }

  function clearTag(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 12,
          border: "0.5px solid var(--page-border)",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {selected ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--page-text-primary)", fontFamily: "var(--font-body)" }}>
            <span style={{ fontSize: 16 }}>{selected.emoji}</span>
            {selected.label}
          </span>
        ) : (
          <span style={{ fontSize: 14, color: "var(--page-text-muted)", fontFamily: "var(--font-body)" }}>
            Choose a style…
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {selected && (
            <span
              role="button"
              onClick={clearTag}
              style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--page-surface)", cursor: "pointer" }}
              aria-label="Clear style tag"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--page-text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--page-bg)",
            border: "0.5px solid var(--page-border)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            maxHeight: 360,
            overflowY: "auto",
            paddingBottom: 6,
          }}
        >
          {STYLE_TAG_GROUPS.map((group) => (
            <div key={group.category}>
              {/* Category header */}
              <div style={{ padding: "10px 14px 4px", fontFamily: "var(--font-mono, monospace)", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--page-text-muted)" }}>
                {group.category}
              </div>

              {/* Tags */}
              {group.tags.map((tag) => {
                const isSelected = value === tag.value;
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => selectTag(tag.value)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      background: isSelected ? "var(--page-surface)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 100ms ease",
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{tag.emoji}</span>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-body)", color: "var(--page-text-primary)", flex: 1 }}>
                      {tag.label}
                    </span>
                    {isSelected && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--page-text-primary)" }} />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
