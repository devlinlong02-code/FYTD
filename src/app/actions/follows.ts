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
  const supabase = await createClient();

  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = (followRows ?? []).map((r) => r.following_id as string);
  if (followingIds.length === 0) return [];

  const { data: rows } = await supabase
    .from("outfits")
    .select(`
      id, title, description, tags, image_url, media_type, published,
      creator_id, likes_count, comments_count,
      profiles!outfits_creator_id_fkey(
        id, display_name, username, avatar_url
      ),
      outfit_media(id, media_url, media_type, position, thumbnail_url)
    `)
    .in("creator_id", followingIds)
    .eq("published", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows) return [];

  return rows.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const mediaRows: import("@/types").OutfitMedia[] = Array.isArray(row.outfit_media)
      ? row.outfit_media
          .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          .map((m: { id?: string; media_url: string; media_type: string; position: number; thumbnail_url?: string }) => ({
            id: m.id,
            media_url: m.media_url,
            media_type: (m.media_type ?? "image") as "image" | "video",
            position: m.position,
            thumbnail_url: m.thumbnail_url,
          }))
      : [];
    const primaryMedia = mediaRows[0] ?? {
      media_url: row.image_url ?? "",
      media_type: (row.media_type ?? "image") as "image" | "video",
      position: 0,
    };
    return {
      id: row.id,
      title: row.title ?? "",
      description: row.description ?? "",
      tags: (row.tags ?? []) as string[],
      image: primaryMedia.media_url,
      mediaType: primaryMedia.media_type,
      media: mediaRows.length > 0 ? mediaRows : [primaryMedia],
      items: [],
      creatorId: row.creator_id,
      creatorName: (profile?.display_name ?? profile?.username ?? "Creator") as string,
      creatorHandle: `@${(profile?.username ?? "unknown") as string}`,
      creatorAvatar: (profile?.avatar_url ?? null) as string | null,
    };
  });
}
