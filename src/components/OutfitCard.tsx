"use client";

import Link from "next/link";
import { Outfit } from "@/types";
import CreatorBadge from "./CreatorBadge";
import DbSaveButton from "./DbSaveButton";
import MediaCarousel from "./MediaCarousel";
import TakeDownButton from "./TakeDownButton";

interface OutfitCardProps {
  outfit: Outfit;
  savedIds?: string[];
  isAuthenticated?: boolean;
  isOwner?: boolean;
}

export default function OutfitCard({ outfit, savedIds = [], isAuthenticated = false, isOwner = false }: OutfitCardProps) {
  const saved = savedIds.includes(outfit.id);

  return (
    <Link href={`/outfit/${outfit.id}`} className="block group">
      <div className="relative rounded-2xl overflow-hidden bg-neutral-100">
        <div className="relative aspect-[3/4]">
          <MediaCarousel
            media={outfit.media}
            title={outfit.title}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            showCounter={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Piece count — top left */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="text-[9px] font-semibold tracking-wide bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
            {outfit.items.length} pieces
          </span>
        </div>

        {/* Save + manage buttons — top right */}
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1.5">
          <DbSaveButton outfitId={outfit.id} initialSaved={saved} isAuthenticated={isAuthenticated} />
          {isOwner && <TakeDownButton outfitId={outfit.id} />}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 pointer-events-none">
          <p className="text-white font-semibold text-sm leading-tight mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
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
              {outfit.tags.slice(0, 1).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-medium bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-[10px] font-semibold text-white/80 shrink-0">
              View Fit →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
