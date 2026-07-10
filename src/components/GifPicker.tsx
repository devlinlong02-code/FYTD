"use client";

import { useState, useEffect, useRef } from "react";

interface GifResult {
  id: string;
  url: string;
  preview: string;
  width: number;
  height: number;
  title: string;
}

interface GifPickerProps {
  onSelect: (gif: { url: string; preview: string; width: number; height: number }) => void;
  onClose: () => void;
}

const CATEGORIES = ["Outfit", "Fashion", "Fire", "Vibes", "Drip", "Streetwear", "Flex", "Clean"];

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGifs("");
    inputRef.current?.focus();
  }, []);

  async function fetchGifs(q: string, offset = 0) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20", offset: String(offset) });
      if (q) params.set("q", q);
      const res = await fetch(`/api/gifs?${params}`);
      const data = await res.json();

      console.log("[GifPicker] status:", res.status, "| results:", data.data?.length ?? 0, "| error:", data.error);

      if (data.error || !Array.isArray(data.data)) {
        console.error("[GifPicker] API error:", data.error ?? "unexpected response shape");
        setLoading(false);
        return;
      }

      const results: GifResult[] = data.data
        .map((gif: Record<string, unknown>) => {
          const images = gif.images as Record<string, Record<string, string>>;
          const original = images?.original ?? {};
          const fixed = images?.fixed_width ?? images?.fixed_width_downsampled ?? original;
          return {
            id: gif.id as string,
            url: original.url ?? "",
            preview: fixed.url ?? original.url ?? "",
            width: parseInt(fixed.width ?? "200", 10),
            height: parseInt(fixed.height ?? "200", 10),
            title: (gif.title as string) ?? "",
          };
        })
        .filter((g: GifResult) => g.url && g.preview);

      console.log("[GifPicker] parsed:", results.length);
      setGifs(offset > 0 ? (prev) => [...prev, ...results] : results);
    } catch (err) {
      console.error("[GifPicker] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchGifs(value), 400);
  }

  const left = gifs.filter((_, i) => i % 2 === 0);
  const right = gifs.filter((_, i) => i % 2 === 1);

  return (
    <div className="gif-picker">
      {/* Header */}
      <div className="gif-picker-header">
        <div className="gif-search-bar">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-black/40 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search GIFs…"
            className="gif-search-input"
          />
          {query && (
            <button onClick={() => { setQuery(""); fetchGifs(""); }} className="text-black/40">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-black/40 flex-shrink-0 p-1">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Category chips */}
      {!query && (
        <div className="gif-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setQuery(cat); fetchGifs(cat); }}
              className="gif-category-pill"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px", display: "flex", gap: "4px" }}>
        {loading && gifs.length === 0 ? (
          <div className="gif-loading">
            <div className="gif-loading-spinner" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="gif-empty">No GIFs found</div>
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              {left.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => onSelect({ url: gif.url, preview: gif.preview, width: gif.width, height: gif.height })}
                  style={{ width: "100%", aspectRatio: "1 / 1", position: "relative", overflow: "hidden", borderRadius: "6px", border: "none", padding: 0, cursor: "pointer", background: "rgba(0,0,0,0.06)", display: "block" }}
                >
                  <img src={gif.preview} alt={gif.title} loading="lazy" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              {right.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => onSelect({ url: gif.url, preview: gif.preview, width: gif.width, height: gif.height })}
                  style={{ width: "100%", aspectRatio: "1 / 1", position: "relative", overflow: "hidden", borderRadius: "6px", border: "none", padding: 0, cursor: "pointer", background: "rgba(0,0,0,0.06)", display: "block" }}
                >
                  <img src={gif.preview} alt={gif.title} loading="lazy" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="gif-attribution">Powered by GIPHY</div>
    </div>
  );
}
