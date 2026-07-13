"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggleRow() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
      }}
    >
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>
          {isDark ? "Dark mode" : "Light mode"}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          {isDark ? "Switch to light theme" : "Switch to dark theme"}
        </p>
      </div>

      <button
        onClick={toggleTheme}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: isDark ? "var(--text-primary)" : "var(--bg-surface)",
          border: "0.5px solid var(--border-secondary)",
          position: "relative",
          cursor: "pointer",
          transition: "background 200ms ease",
          flexShrink: 0,
        }}
        aria-label="Toggle theme"
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: isDark ? "calc(100% - 23px)" : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: isDark ? "var(--bg-primary)" : "var(--text-primary)",
            transition: "left 200ms ease",
          }}
        />
      </button>
    </div>
  );
}
