"use client";

import { useTheme } from "@/context/ThemeContext";

export default function AppearanceRow() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--page-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--settings-row-icon)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--settings-row-icon)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--settings-row-text)" }}>
          Appearance
        </span>
      </div>

      <div style={{ display: "flex", background: "var(--page-surface)", borderRadius: 8, padding: 2, gap: 2 }}>
        <button
          onClick={() => setTheme("dark")}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 200ms ease",
            background: theme === "dark" ? "var(--btn-primary-bg)" : "transparent",
            color: theme === "dark" ? "var(--btn-primary-text)" : "var(--page-text-muted)",
          }}
        >
          Dark
        </button>
        <button
          onClick={() => setTheme("light")}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 200ms ease",
            background: theme === "light" ? "var(--btn-primary-bg)" : "transparent",
            color: theme === "light" ? "var(--btn-primary-text)" : "var(--page-text-muted)",
          }}
        >
          Light
        </button>
      </div>
    </div>
  );
}
