"use client";

interface PerfectBreakdownBadgeProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZES = {
  sm: { container: { padding: "2px 7px", gap: 3, borderRadius: 999 }, star: 8, text: 8, letterSpacing: "0.06em" },
  md: { container: { padding: "3px 10px", gap: 4, borderRadius: 999 }, star: 10, text: 10, letterSpacing: "0.08em" },
  lg: { container: { padding: "5px 14px", gap: 6, borderRadius: 999 }, star: 13, text: 12, letterSpacing: "0.08em" },
};

const StarPath = "M6 1L7.545 4.09L11 4.635L8.5 7.07L9.09 10.5L6 8.875L2.91 10.5L3.5 7.07L1 4.635L4.455 4.09L6 1Z";

export default function PerfectBreakdownBadge({ size = "md", showLabel = true }: PerfectBreakdownBadgeProps) {
  const s = SIZES[size];
  return (
    <div
      title="Perfect Breakdown — all pieces documented with name, brand, price, and shop link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.container.gap,
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "0.5px solid rgba(255,255,255,0.35)",
        padding: s.container.padding,
        borderRadius: s.container.borderRadius,
      }}
    >
      <svg width={s.star} height={s.star} viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d={StarPath} fill="#FFD700" stroke="#FFD700" strokeWidth="0.5" strokeLinejoin="round" />
      </svg>
      {showLabel && (
        <span style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: s.text,
          fontWeight: 600,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: s.letterSpacing,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          Perfect Breakdown
        </span>
      )}
    </div>
  );
}

// Light variant for use on white/light backgrounds
export function PerfectBreakdownBadgeLight({ size = "md", showLabel = true }: PerfectBreakdownBadgeProps) {
  const s = SIZES[size];
  return (
    <div
      title="Perfect Breakdown — all pieces documented with name, brand, price, and shop link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.container.gap,
        background: "rgba(0,0,0,0.06)",
        border: "0.5px solid rgba(0,0,0,0.15)",
        borderRadius: s.container.borderRadius,
        padding: s.container.padding,
      }}
    >
      <svg width={s.star} height={s.star} viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d={StarPath} fill="#B8860B" stroke="#B8860B" strokeWidth="0.5" strokeLinejoin="round" />
      </svg>
      {showLabel && (
        <span style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: s.text,
          fontWeight: 600,
          color: "#0a0a0a",
          letterSpacing: s.letterSpacing,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          Perfect Breakdown
        </span>
      )}
    </div>
  );
}
