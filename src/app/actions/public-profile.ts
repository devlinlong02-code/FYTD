"use server";

import { createClient } from "@/lib/supabase/server";
import { dbRowToOutfit } from "@/app/actions/outfits";
import type { Outfit } from "@/types";

export interface PublicProfileData {
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    style_tags: string[];
  };
  outfits: Outfit[];
  followCounts: { followers: number; following: number };
  socialLinks: {
    instagram_url: string | null;
    tiktok_url: string | null;
    website_url: string | null;
  };
}

async function fetchMediaForOutfits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  outfitIds: string[]
): Promise<Record<string, unknown>[]> {
  if (outfitIds.length === 0) return [];
  const { data, error } = await supabase
    .from("outfit_media")
    .select("id, outfit_id, media_url, media_type, position, storage_path, thumbnail_url")
    .in("outfit_id", outfitIds)
    .order("position");

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("schema cache") || msg.includes("does not exist")) {
      console.warn("[public-profile] outfit_media table not found — apply migration 008");
    } else {
      console.error("[public-profile] outfit_media SELECT failed:", msg);
    }
    return [];
  }

  return (data ?? []) as Record<string, unknown>[];
}

export async function getPublicProfile(username: string): Promise<PublicProfileData | null> {
  const supabase = await createClient();

  // Fetch profile by username — select * to stay resilient to schema migrations
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    console.error("[getPublicProfile] profile fetch error:", profileError.message, profileError.code);
    return null;
  }
  if (!profileRow) return null;

  const profileAny = profileRow as Record<string, unknown>;

  // Resolve social links — individual columns (migration 005) → JSONB (002) → null
  const socialLinksJson = profileAny.social_links as Record<string, string | null> | null;
  function readSocialLink(col: string): string | null {
    if (col in profileAny) return (profileAny[col] as string | null) ?? null;
    return (socialLinksJson?.[col] as string | null) ?? null;
  }

  // Fetch published outfits for this profile
  const runOutfitsQuery = async (withDeletedFilter: boolean) => {
    const q = supabase
      .from("outfits")
      .select("*, profiles(display_name, username, avatar_url)")
      .eq("creator_id", profileRow.id)
      .eq("published", true)
      .order("created_at", { ascending: false });
    return withDeletedFilter ? q.is("deleted_at", null) : q;
  };

  let { data: outfitRows, error: outfitsError } = await runOutfitsQuery(true);
  if (outfitsError?.message?.includes("deleted_at")) {
    console.warn("[getPublicProfile] deleted_at column missing — apply migration 009");
    ({ data: outfitRows, error: outfitsError } = await runOutfitsQuery(false));
  }

  const outfitIds = (outfitRows ?? []).map((o) => o.id as string);

  const [{ data: items }, mediaRows, followersResult, followingResult] = await Promise.all([
    outfitIds.length > 0
      ? supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order")
      : Promise.resolve({ data: [] }),
    fetchMediaForOutfits(supabase, outfitIds),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileRow.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileRow.id),
  ]);

  const outfits: Outfit[] = (outfitRows ?? []).map((row) =>
    dbRowToOutfit(
      row as Record<string, unknown>,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      mediaRows.filter((m) => m.outfit_id === row.id)
    )
  );

  return {
    profile: {
      id: profileRow.id as string,
      username: profileRow.username as string,
      display_name: (profileRow.display_name as string) || (profileRow.username as string),
      avatar_url: (profileRow.avatar_url as string | null) ?? null,
      bio: (profileRow.bio as string | null) ?? null,
      location: (profileRow.location as string | null) ?? null,
      style_tags: (profileRow.style_tags as string[] | null) ?? [],
    },
    outfits,
    followCounts: {
      followers: followersResult.count ?? 0,
      following: followingResult.count ?? 0,
    },
    socialLinks: {
      instagram_url: readSocialLink("instagram_url"),
      tiktok_url: readSocialLink("tiktok_url"),
      website_url: readSocialLink("website_url"),
    },
  };
}
