"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "#0a0a0a", margin: "0 0 2px" }}>
          Theme
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(0,0,0,0.4)", margin: 0 }}>
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </p>
      </div>

      {/* Segmented control — iOS style */}
      <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 8, padding: 2, gap: 2 }}>
        <button
          onClick={() => setTheme("dark")}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            background: theme === "dark" ? "#0a0a0a" : "transparent",
            color: theme === "dark" ? "white" : "rgba(0,0,0,0.45)",
            transition: "all 200ms ease",
            whiteSpace: "nowrap",
          }}
        >
          Dark
        </button>
        <button
          onClick={() => setTheme("light")}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            background: theme === "light" ? "#0a0a0a" : "transparent",
            color: theme === "light" ? "white" : "rgba(0,0,0,0.45)",
            transition: "all 200ms ease",
            whiteSpace: "nowrap",
          }}
        >
          Light
        </button>
      </div>
    </div>
  );
}
