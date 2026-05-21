"use client";

import { useState, useMemo } from "react";
import OutfitCard from "@/components/OutfitCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import type { Outfit, AestheticTag } from "@/types";

type PriceFilter = "under50" | "under100" | "under200" | null;
type ShopTypeFilter = "exact" | "similar" | null;

interface ExploreClientProps {
  outfits: Outfit[];
  savedIds: string[];
  isAuthenticated: boolean;
}

const UTILITY_CHIPS: { label: string; price?: PriceFilter; shop?: ShopTypeFilter }[] = [
  { label: "Under $50", price: "under50" },
  { label: "Under $100", price: "under100" },
  { label: "Under $200", price: "under200" },
  { label: "Shop Exact", shop: "exact" },
  { label: "Shop Similar", shop: "similar" },
];

export default function ExploreClient({ outfits, savedIds, isAuthenticated }: ExploreClientProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<AestheticTag | null>(null);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(null);
  const [shopTypeFilter, setShopTypeFilter] = useState<ShopTypeFilter>(null);

  const activeFilterCount = [activeTag, priceFilter, shopTypeFilter, query.trim()].filter(Boolean).length;

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

      return matchesSearch && matchesTag && matchesPrice && matchesShopType;
    });
  }, [query, activeTag, priceFilter, shopTypeFilter, outfits]);

  function clearAll() {
    setQuery("");
    setActiveTag(null);
    setPriceFilter(null);
    setShopTypeFilter(null);
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-2xl font-bold text-neutral-900">Explore</h1>
        {activeFilterCount > 0 && (
          <span className="text-[10px] font-semibold bg-neutral-900 text-white px-2 py-0.5 rounded-full">
            {activeFilterCount} active
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-5">
        <SearchBar value={query} onChange={setQuery} />
        <FilterBar activeTag={activeTag} onSelect={setActiveTag} />

        {/* Utility filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {UTILITY_CHIPS.map(({ label, price, shop }) => {
            const isActive =
              (price && priceFilter === price) || (shop && shopTypeFilter === shop);
            return (
              <button
                key={label}
                onClick={() => {
                  if (price) setPriceFilter(isActive ? null : price);
                  if (shop) setShopTypeFilter(isActive ? null : shop);
                }}
                className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-neutral-500 text-sm font-medium mb-1">No outfits match your filters.</p>
          <p className="text-neutral-400 text-xs mb-4">Try adjusting your search or clearing filters.</p>
          <button
            onClick={clearAll}
            className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-neutral-400 mb-3">
            {filtered.length} outfit{filtered.length !== 1 ? "s" : ""}
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
    </>
  );
}
