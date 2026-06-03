"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import OutfitCard from "@/components/OutfitCard";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { normalizeExternalUrl } from "@/lib/links";
import type { Outfit } from "@/types";
import type { SavedItemData } from "@/app/actions/saved-items";

interface Props {
  postedOutfits: Outfit[];
  savedOutfits: Outfit[];
  initialSavedItems: SavedItemData[];
  savedIds: string[];
  isAuthenticated: boolean;
}

type Tab = "posts" | "saved" | "pieces";

export default function ProfileTabContent({
  postedOutfits,
  savedOutfits,
  initialSavedItems,
  savedIds,
  isAuthenticated,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [savedItems, setSavedItems] = useState<SavedItemData[]>(initialSavedItems);

  async function handleUnsaveItem(savedId: string, itemId: string, outfitId: string) {
    setSavedItems((prev) => prev.filter((s) => s.savedId !== savedId));
    await toggleSavedItem(itemId, outfitId).catch(() => {});
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "posts", label: "Posts", count: postedOutfits.length },
    { id: "saved", label: "Saved", count: savedOutfits.length },
    { id: "pieces", label: "Pieces", count: savedItems.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex border-b border-neutral-100 mt-4"
        style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id
                ? "text-neutral-900"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 text-xs ${
                  activeTab === tab.id ? "text-neutral-500" : "text-neutral-300"
                }`}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-neutral-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {activeTab === "posts" && (
        <div className="px-4 pt-5 pb-8">
          {postedOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-neutral-500 text-sm font-medium mb-1">No outfits yet</p>
              <p className="text-neutral-400 text-sm mb-4">Start posting fits to build your profile.</p>
              <Link
                href="/admin/upload"
                className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
              >
                Post an outfit
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {postedOutfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  savedIds={savedIds}
                  isAuthenticated={isAuthenticated}
                  isOwner
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved tab */}
      {activeTab === "saved" && (
        <div className="px-4 pt-5 pb-8">
          {savedOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-neutral-500 text-sm font-medium mb-1">Nothing saved yet</p>
              <p className="text-neutral-400 text-sm">Tap the bookmark on any outfit to save it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedOutfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  savedIds={savedIds}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pieces tab */}
      {activeTab === "pieces" && (
        <div className="px-4 pt-5 pb-8">
          {savedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <p className="text-neutral-500 text-sm font-medium mb-1">No pieces saved yet</p>
              <p className="text-neutral-400 text-sm">Bookmark individual items from any outfit breakdown.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedItems.map((saved) => (
                <PieceCard
                  key={saved.savedId}
                  saved={saved}
                  onUnsave={handleUnsaveItem}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PieceCard({
  saved,
  onUnsave,
}: {
  saved: SavedItemData;
  onUnsave: (savedId: string, itemId: string, outfitId: string) => void;
}) {
  const { item, outfitId, outfitTitle } = saved;
  const shopUrl = item.shopLink ? normalizeExternalUrl(item.shopLink) : null;
  const isExact = item.shopType !== "similar";

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden bg-white"
      style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}
    >
      {/* Image */}
      <Link href={`/outfit/${outfitId}`} className="block relative aspect-square bg-neutral-100 shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 50vw, 224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-neutral-300">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </Link>

      {/* Unsave button */}
      <button
        onClick={() => onUnsave(saved.savedId, item.id, outfitId)}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm hover:bg-white transition-all active:scale-95"
        aria-label="Unsave piece"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1">
        <p className="text-[10px] uppercase tracking-[0.08em] text-neutral-400 leading-none">
          {item.category}
        </p>
        {item.brand && (
          <p className="text-[10px] uppercase tracking-[0.06em] text-neutral-500 font-medium leading-none">
            {item.brand}
          </p>
        )}
        <p className="text-[12px] font-semibold text-neutral-900 leading-snug line-clamp-2">
          {item.name}
        </p>
        {item.price > 0 && (
          <p className="text-[12px] text-neutral-700 font-medium">${item.price.toLocaleString()}</p>
        )}

        {/* Shop button */}
        {shopUrl && (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 text-[11px] font-semibold px-3 py-1.5 rounded-full text-center transition-all ${
              isExact
                ? "bg-neutral-900 text-white hover:bg-neutral-700"
                : "border border-neutral-900 text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            {isExact ? "Shop Exact" : "Shop Similar"}
          </a>
        )}

        {/* Outfit source */}
        <Link
          href={`/outfit/${outfitId}`}
          className="mt-1.5 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors leading-none truncate"
        >
          from {outfitTitle}
        </Link>
      </div>
    </div>
  );
}
