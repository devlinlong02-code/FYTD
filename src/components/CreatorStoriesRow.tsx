"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface StoryCreator {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export default function CreatorStoriesRow({ currentUserId }: { currentUserId: string | null }) {
  const [creators, setCreators] = useState<StoryCreator[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    (async () => {
      // Get who this user follows
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .limit(30);

      if (!follows || follows.length === 0) return;
      const followingIds = follows.map((f) => f.following_id as string);

      // Get their recent outfits (last 7 days)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentOutfits } = await supabase
        .from("outfits")
        .select("creator_id")
        .in("creator_id", followingIds)
        .gte("created_at", since)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!recentOutfits || recentOutfits.length === 0) return;

      // Dedupe creator IDs preserving recency order
      const seen = new Set<string>();
      const activeIds: string[] = [];
      for (const row of recentOutfits) {
        const id = row.creator_id as string;
        if (!seen.has(id)) { seen.add(id); activeIds.push(id); }
        if (activeIds.length >= 12) break;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", activeIds);

      if (!profiles) return;

      // Sort by the active order
      const profileMap = new Map(profiles.map((p) => [p.id as string, p]));
      const ordered = activeIds
        .map((id) => profileMap.get(id))
        .filter((p): p is NonNullable<typeof p> => !!p);

      setCreators(ordered as StoryCreator[]);
    })();
  }, [currentUserId]);

  if (creators.length === 0) return null;

  return (
    <div className="stories-row">
      <div className="stories-scroll no-scrollbar">
        {creators.map((creator) => {
          const name = creator.display_name || creator.username || "?";
          const initial = name[0].toUpperCase();
          const handle = creator.username ?? "";
          return (
            <button
              key={creator.id}
              className="story-item"
              onClick={() => handle && router.push(`/profile/${handle}`)}
              aria-label={`${name}'s profile`}
            >
              <div className="story-ring">
                <div className="story-avatar">
                  {creator.avatar_url ? (
                    <Image
                      src={creator.avatar_url}
                      alt={name}
                      width={52}
                      height={52}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="story-avatar-fallback">{initial}</span>
                  )}
                </div>
              </div>
              <p className="story-username">
                {handle.length > 9 ? handle.slice(0, 8) + "…" : handle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
