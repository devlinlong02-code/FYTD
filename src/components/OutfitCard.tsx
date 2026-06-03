"use client";

import Link from "next/link";
import { Outfit, OutfitItem } from "@/types";
import CreatorBadge from "./CreatorBadge";
import DbSaveButton from "./DbSaveButton";
import MediaCarousel from "./MediaCarousel";
import TakeDownButton from "./TakeDownButton";

interface OutfitCardProps {
  outfit: Outfit;
  savedIds?: string[];
  isAuthenticated?: boolean;
  isOwner?: boolean;
  variant?: "hero" | "grid";
  priority?: boolean;
}

function calcCompleteness(items: OutfitItem[]): number {
  if (!items.length) return 0;
  const totalPossible = items.length * 5;
  const earned = items.reduce((acc, item) => {
    let pts = 1;
    if (item.brand) pts++;
    if (item.price > 0) pts++;
    if (item.shopLink && item.shopLink !== "#") pts++;
    if (item.image) pts++;
    return acc + pts;
  }, 0);
  return Math.round((earned / totalPossible) * 100);
}

function getFitValue(items: OutfitItem[]): string | null {
  const priced = items.filter((i) => i.price > 0);
  if (priced.length < 1) return null;
  const total = priced.reduce((a, i) => a + i.price, 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);
}


export default function OutfitCard({
  outfit,
  savedIds = [],
  isAuthenticated = false,
  isOwner = false,
  variant = "grid",
  priority = false,
}: OutfitCardProps) {
  const saved = savedIds.includes(outfit.id);
  const score = calcCompleteness(outfit.items);
  const fitValue = getFitValue(outfit.items);
  const isHero = variant === "hero";

  return (
    <Link href={`/outfit/${outfit.id}`} className="block group">
      <div className={`relative overflow-hidden bg-neutral-100 ${isHero ? "rounded-3xl" : "rounded-2xl"}`}>
        <div className={`relative ${isHero ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
          <MediaCarousel
            media={outfit.media}
            title={outfit.title}
            priority={priority}
            sizes={isHero ? "(max-width: 640px) 100vw, 448px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            showCounter={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent pointer-events-none" />
        </div>

        {/* Piece count + fit value — top left */}
        <div className={`absolute z-20 flex items-center gap-1.5 flex-wrap ${isHero ? "top-3 left-3" : "top-2.5 left-2.5"}`}>
          <span className="text-[9px] font-semibold tracking-widest uppercase bg-black/50 backdrop-blur-sm text-white/90 px-2.5 py-0.5 rounded-full">
            {outfit.items.length} pieces
          </span>
          {fitValue && (
            <span className="text-[9px] font-semibold tracking-widest uppercase bg-black/50 backdrop-blur-sm text-white/90 px-2.5 py-0.5 rounded-full">
              {fitValue}
            </span>
          )}
          {score === 100 && (
            <span className="text-[8px] font-semibold tracking-widest uppercase bg-black text-white px-2.5 py-0.5 rounded-full">
              Complete Fit ✦
            </span>
          )}
        </div>

        {/* Save + manage — top right */}
        <div className={`absolute z-20 flex flex-col items-end gap-1.5 ${isHero ? "top-3 right-3" : "top-2 right-2"}`}>
          <DbSaveButton outfitId={outfit.id} initialSaved={saved} isAuthenticated={isAuthenticated} />
          {isOwner && <TakeDownButton outfitId={outfit.id} />}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className={isHero ? "p-4" : "p-3"}>
            <p
              className={`text-white leading-tight mb-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
                isHero ? "font-black text-xl tracking-tight" : "font-bold text-sm"
              }`}
            >
              {outfit.title}
            </p>
            <CreatorBadge
              name={outfit.creatorName}
              handle={outfit.creatorHandle}
              avatar={outfit.creatorAvatar}
              size="sm"
              colorScheme="light"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-wrap gap-1">
                {outfit.tags.slice(0, isHero ? 2 : 1).map((tag) => (
                  <span
                    key={tag}
                    className={`font-medium bg-white/20 backdrop-blur-sm text-white rounded-full ${
                      isHero ? "text-[10px] px-2 py-0.5 border border-white/20" : "text-[9px] px-1.5 py-0.5"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* Social counts */}
              <div className="flex items-center gap-2.5 shrink-0">
                {(outfit.likesCount ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/60">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {outfit.likesCount}
                  </span>
                )}
                {(outfit.commentsCount ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/60">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {outfit.commentsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
