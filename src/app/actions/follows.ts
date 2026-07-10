"use server";

import { createClient } from "@/lib/supabase/server";

export type FollowUser = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const supabase = await createClient();
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function getFollowers(userId: string): Promise<FollowUser[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);
  const ids = rows?.map((r) => r.follower_id) ?? [];
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", ids);
  return (profiles ?? []) as FollowUser[];
}

export async function getFollowing(userId: string): Promise<FollowUser[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  const ids = rows?.map((r) => r.following_id) ?? [];
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", ids);
  return (profiles ?? []) as FollowUser[];
}

export async function toggleFollow(targetUserId: string): Promise<{ following: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
    return { following: false };
  }
  await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
  return { following: true };
}

export async function isFollowing(targetUserId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();
  return !!data;
}

export async function getFollowingFeed(userId: string): Promise<import("@/types").Outfit[]> {
  const { dbRowToOutfit } = await import("@/app/actions/outfits");

  const supabase = await createClient();

  // Step 1: get who this user follows
  const { data: followRows, error: followError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followError) {
    console.error("[getFollowingFeed] follows query failed:", followError.message);
    return [];
  }

  // Filter out blocked users
  const { data: blockRows } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  const blockedSet = new Set((blockRows ?? []).map((r) => r.blocked_id as string));

  const followingIds = (followRows ?? [])
    .map((r) => r.following_id as string)
    .filter((id) => !blockedSet.has(id));
  if (followingIds.length === 0) return [];

  // Step 2: fetch outfits from those users — same pattern as getOutfits()
  const runQuery = async (withDeletedFilter: boolean) => {
    const q = supabase
      .from("outfits")
      .select("*, profiles(display_name, username, avatar_url)")
      .in("creator_id", followingIds)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50);
    return withDeletedFilter ? q.is("deleted_at", null) : q;
  };

  let { data, error } = await runQuery(true);
  if (error?.message?.includes("deleted_at")) {
    console.warn("[getFollowingFeed] deleted_at column missing — apply migration 009");
    ({ data, error } = await runQuery(false));
  }
  if (error) {
    console.error("[getFollowingFeed] outfits query failed:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Step 3: fetch outfit_items and media in parallel
  const outfitIds = data.map((o) => o.id as string);
  const [{ data: items }, { data: mediaRows }] = await Promise.all([
    supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order"),
    supabase.from("outfit_media").select("id, outfit_id, media_url, media_type, position, storage_path, thumbnail_url").in("outfit_id", outfitIds).order("position"),
  ]);

  return data.map((row) =>
    dbRowToOutfit(
      row as Record<string, unknown>,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      (mediaRows ?? []).filter((m) => m.outfit_id === row.id) as Record<string, unknown>[]
    )
  );
}


export interface RisingCreator {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  bio: string | null;
}

export async function getRisingCreators(
  currentUserId: string | null,
  limit = 5
): Promise<RisingCreator[]> {
  const supabase = await createClient();

  let excludeIds: string[] = [];
  if (currentUserId) {
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);
    excludeIds = [
      ...(following ?? []).map((f) => f.following_id as string),
      currentUserId,
    ];
  }

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, followers_count, bio")
    .order("followers_count", { ascending: false })
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data } = await query;
  return (data ?? []) as RisingCreator[];
}
