"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import OutfitCard from "@/components/OutfitCard";
import type { Outfit } from "@/types";

type PriceFilter = "under50" | "under100" | "under200" | null;
type ShopTypeFilter = "exact" | "similar" | null;

interface ExploreClientProps {
  outfits: Outfit[];
  savedIds: string[];
  isAuthenticated: boolean;
}

const LENSES: { label: string; tag: string | null }[] = [
  { label: "For You", tag: null },
  { label: "Streetwear", tag: "streetwear" },
  { label: "Clean", tag: "clean fit" },
  { label: "Going Out", tag: "night out" },
  { label: "Minimal", tag: "minimal" },
];

const PRICE_OPTIONS: { label: string; value: PriceFilter }[] = [
  { label: "Under $50", value: "under50" },
  { label: "Under $100", value: "under100" },
  { label: "Under $200", value: "under200" },
];

const SHOP_OPTIONS: { label: string; value: ShopTypeFilter }[] = [
  { label: "Shop Exact", value: "exact" },
  { label: "Shop Similar", value: "similar" },
];

const STYLE_TAGS = [
  "streetwear", "clean fit", "minimal", "old money", "casual",
  "formal", "summer", "gym fit", "campus", "night out", "business casual",
];

const ITEM_TYPES = ["Tops", "Bottoms", "Shoes", "Accessories"];

const ITEM_TYPE_KEYWORDS: Record<string, string[]> = {
  Tops: ["top", "shirt", "tee", "hoodie", "jacket", "sweater", "blouse", "coat", "vest", "knit"],
  Bottoms: ["bottom", "pant", "jean", "short", "skirt", "trouser", "cargo", "denim"],
  Shoes: ["shoe", "sneaker", "boot", "sandal", "heel", "loafer", "trainer", "mule"],
  Accessories: ["accessory", "hat", "bag", "watch", "belt", "scarf", "jewel", "cap", "sunglasses", "bag"],
};

// Lens tags: tag is shown as active in the lens row, not as a removable chip
const LENS_TAGS = new Set(LENSES.map((l) => l.tag).filter(Boolean));

export default function ExploreClient({ outfits, savedIds, isAuthenticated }: ExploreClientProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(null);
  const [shopTypeFilter, setShopTypeFilter] = useState<ShopTypeFilter>(null);
  const [itemTypeFilter, setItemTypeFilter] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Count only drawer-sourced filters for the badge (lens tags are visible in the row)
  const drawerFilterCount = [
    priceFilter,
    shopTypeFilter,
    itemTypeFilter,
    activeTag && !LENS_TAGS.has(activeTag) ? activeTag : null,
  ].filter(Boolean).length;

  const hasAnyFilter = !!(query.trim() || activeTag || priceFilter || shopTypeFilter || itemTypeFilter);

  // Removable chips: drawer-only filters + drawer-set style tags (not lens tags)
  const activeChips: { label: string; clear: () => void }[] = [];
  if (priceFilter) {
    const opt = PRICE_OPTIONS.find((p) => p.value === priceFilter);
    activeChips.push({ label: opt?.label ?? priceFilter, clear: () => setPriceFilter(null) });
  }
  if (shopTypeFilter) {
    const opt = SHOP_OPTIONS.find((s) => s.value === shopTypeFilter);
    activeChips.push({ label: opt?.label ?? shopTypeFilter, clear: () => setShopTypeFilter(null) });
  }
  if (activeTag && !LENS_TAGS.has(activeTag)) {
    activeChips.push({ label: activeTag, clear: () => setActiveTag(null) });
  }
  if (itemTypeFilter) {
    activeChips.push({ label: itemTypeFilter, clear: () => setItemTypeFilter(null) });
  }

  const filtered = useMemo(() => {
    return outfits.filter((outfit) => {
      const q = query.trim().toLowerCase();
      const matchesSearch =
        !q ||
        outfit.title.toLowerCase().includes(q) ||
        outfit.creatorName.toLowerCase().includes(q) ||
        outfit.creatorHandle.toLowerCase().includes(q) ||
        outfit.tags.some((t) => t.toLowerCase().includes(q)) ||
        outfit.items.some(
          (i) => i.brand.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
        );

      const matchesTag = !activeTag || outfit.tags.includes(activeTag);

      const matchesPrice =
        !priceFilter ||
        (priceFilter === "under50" && outfit.items.some((i) => i.price < 50)) ||
        (priceFilter === "under100" && outfit.items.some((i) => i.price < 100)) ||
        (priceFilter === "under200" && outfit.items.some((i) => i.price < 200));

      const matchesShopType =
        !shopTypeFilter ||
        outfit.items.some((i) => (i.shopType ?? "exact") === shopTypeFilter);

      const matchesItemType =
        !itemTypeFilter ||
        outfit.items.some((i) =>
          ITEM_TYPE_KEYWORDS[itemTypeFilter]?.some((kw) =>
            i.category.toLowerCase().includes(kw)
          )
        );

      return matchesSearch && matchesTag && matchesPrice && matchesShopType && matchesItemType;
    });
  }, [query, activeTag, priceFilter, shopTypeFilter, itemTypeFilter, outfits]);

  function clearAll() {
    setQuery("");
    setActiveTag(null);
    setPriceFilter(null);
    setShopTypeFilter(null);
    setItemTypeFilter(null);
  }

  function clearDrawerFilters() {
    setPriceFilter(null);
    setShopTypeFilter(null);
    setItemTypeFilter(null);
    // Only clear tag if it came from the drawer (not a lens)
    if (activeTag && !LENS_TAGS.has(activeTag)) setActiveTag(null);
  }

  const hasDrawerFilters = drawerFilterCount > 0;

  const drawer = (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={() => setDrawerOpen(false)}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl max-h-[82vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-neutral-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <span className="text-base font-bold text-neutral-900">Tune Fit</span>
          <div className="flex items-center gap-3">
            {hasDrawerFilters && (
              <button
                onClick={clearDrawerFilters}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          <div className="flex flex-col gap-6">

            {/* Price */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Price</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setPriceFilter(priceFilter === value ? null : value)}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                      priceFilter === value
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shopping */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Shopping</p>
              <div className="flex flex-wrap gap-2">
                {SHOP_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setShopTypeFilter(shopTypeFilter === value ? null : value)}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                      shopTypeFilter === value
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors capitalize ${
                      activeTag === tag
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Type */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Item Type</p>
              <div className="flex flex-wrap gap-2">
                {ITEM_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setItemTypeFilter(itemTypeFilter === type ? null : type)}
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                      itemTypeFilter === type
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Apply button */}
        <div className="px-5 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))] shrink-0 border-t border-neutral-100">
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors"
          >
            Show {filtered.length} fit{filtered.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <svg
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search outfits, brands, aesthetics…"
          className="w-full pl-9 pr-4 py-2.5 bg-neutral-100 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900/10 transition"
        />
      </div>

      {/* Lens row + Tune Fit */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-0.5">
          {LENSES.map(({ label, tag }) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={label}
                onClick={() => setActiveTag(isActive ? null : tag)}
                className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
            drawerFilterCount > 0
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Tune Fit
          {drawerFilterCount > 0 && (
            <span className="bg-white text-neutral-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
              {drawerFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-0.5">
          {activeChips.map(({ label, clear }) => (
            <button
              key={label}
              onClick={clear}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-900 text-white capitalize"
            >
              {label}
              <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ))}
          <button
            onClick={clearAll}
            className="shrink-0 text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-neutral-700 text-sm font-semibold mb-1.5">No fits found</p>
          <p className="text-neutral-400 text-xs mb-5 leading-relaxed max-w-[220px]">
            Try removing a filter or searching a different vibe.
          </p>
          {hasAnyFilter && (
            <button
              onClick={clearAll}
              className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-neutral-400 mb-3">
            {filtered.length} fit{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                savedIds={savedIds}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </>
      )}

      {drawerOpen && mounted && createPortal(drawer, document.body)}
    </>
  );
}
