"use client";

import { FeedBreakdownProvider } from "@/context/FeedBreakdownContext";
import FeedBreakdownSheetPortal from "@/components/FeedBreakdownSheetPortal";
import HomeFeedCard from "@/components/HomeFeedCard";
import type { Outfit } from "@/types";

interface Props {
  outfits: Outfit[];
  likedIds: string[];
  savedIds: string[];
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export default function HomeFeedList({
  outfits,
  likedIds,
  savedIds,
  isAuthenticated,
  currentUserId,
}: Props) {
  const likedSet = new Set(likedIds);
  const savedSet = new Set(savedIds);

  return (
    <FeedBreakdownProvider>
      <div>
        {outfits.map((outfit, i) => (
          <HomeFeedCard
            key={outfit.id}
            outfit={outfit}
            initialLiked={likedSet.has(outfit.id)}
            initialSaved={savedSet.has(outfit.id)}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
            priority={i === 0}
          />
        ))}
      </div>
      <FeedBreakdownSheetPortal
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
      />
    </FeedBreakdownProvider>
  );
}
