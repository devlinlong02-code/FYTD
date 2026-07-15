"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import FollowListSheet from "@/components/FollowListSheet";

interface FollowStatsRowProps {
  outfits: number;
  initialFollowers: number;
  initialFollowing: number;
  userId: string;
  isOwnProfile: boolean;
  currentUserId?: string;
  followerCountOverride?: number;
}

export default function FollowStatsRow({
  outfits,
  initialFollowers,
  initialFollowing,
  userId,
  isOwnProfile,
  currentUserId,
  followerCountOverride,
}: FollowStatsRowProps) {
  const [followers, setFollowers] = useState(initialFollowers);
  const [following, setFollowing] = useState(initialFollowing);

  // Sync when parent updates the count via follow/unfollow action
  useEffect(() => {
    if (followerCountOverride !== undefined) {
      setFollowers(followerCountOverride);
    }
  }, [followerCountOverride]);
  const [sheet, setSheet] = useState<"followers" | "following" | null>(null);

  // Subscribe to follows table changes for this user so counts update live
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`follows-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `following_id=eq.${userId}` },
        async () => {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", userId);
          setFollowers(count ?? 0);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${userId}` },
        async () => {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", userId);
          setFollowing(count ?? 0);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <>
      <div className="flex gap-5">
        <div className="flex items-baseline gap-1.5">
          <span className="profile-stat-number">{outfits}</span>
          <span className="profile-stat-label">Outfits</span>
        </div>
        <button
          type="button"
          onClick={() => setSheet("followers")}
          className="flex items-baseline gap-1.5 hover:opacity-70 transition-opacity"
        >
          <span className="profile-stat-number">{followers}</span>
          <span className="profile-stat-label">Followers</span>
        </button>
        <button
          type="button"
          onClick={() => setSheet("following")}
          className="flex items-baseline gap-1.5 hover:opacity-70 transition-opacity"
        >
          <span className="profile-stat-number">{following}</span>
          <span className="profile-stat-label">Following</span>
        </button>
      </div>

      {sheet && (
        <FollowListSheet
          type={sheet}
          userId={userId}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
