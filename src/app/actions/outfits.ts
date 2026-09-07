import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

async function getBlockedCreatorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  return (data ?? []).map((r) => r.blocked_id as string);
}
import { outfits as mockOutfits } from "@/data/outfits";
import type { Outfit, OutfitItem, OutfitMedia } from "@/types";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  );
}

export function dbRowToOutfit(
  row: Record<string, unknown>,
  items: Record<string, unknown>[],
  mediaRows: Record<string, unknown>[] = []
): Outfit {
  const profile = (row.profiles as Record<string, unknown>) ?? {};
  const username = (profile.username as string) ?? "creator";
  const displayName = (profile.display_name as string) || "Creator";
  const avatarUrl = (profile.avatar_url as string | null) || null;

  // Build media array from outfit_media rows; fallback to outfits.image_url
  let media: OutfitMedia[];
  if (mediaRows.length > 0) {
    media = mediaRows
      .sort((a, b) => (a.position as number) - (b.position as number))
      .map((m) => ({
        id: m.id as string,
        media_url: m.media_url as string,
        media_type: (m.media_type as "image" | "video") ?? "image",
        position: m.position as number,
        ...(m.thumbnail_url ? { thumbnail_url: m.thumbnail_url as string } : {}),
      }));
  } else {
    // outfit_media not available (migration 008 not run) — use legacy columns
    const fallbackUrl = (row.image_url as string) ?? "";
    media = fallbackUrl
      ? [{ media_url: fallbackUrl, media_type: (row.media_type as "image" | "video") ?? "image", position: 0 }]
      : [];
  }

  const primary = media[0];

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    image: primary?.media_url ?? (row.image_url as string) ?? "",
    mediaType: primary?.media_type ?? (row.media_type as "image" | "video") ?? "image",
    media,
    tags: (row.tags as string[]) ?? [],
    creatorId: row.creator_id as string | undefined,
    creatorName: displayName,
    creatorHandle: `@${username}`,
    creatorAvatar: avatarUrl,
    likesCount: typeof row.likes_count === "number" ? row.likes_count : 0,
    commentsCount: typeof row.comments_count === "number" ? row.comments_count : 0,
    savesCount: typeof row.saves_count === "number" ? row.saves_count : 0,
    cardStyle: (row.card_style as "editorial" | "statement" | "streetwear" | undefined) ?? "editorial",
    isPerfectBreakdown: (row.is_perfect_breakdown as boolean | null) ?? false,
    styleTag: (row.style_tag as string | null) ?? undefined,
    items: items.map((item) => ({
      id: item.id as string,
      name: item.name as string,
      brand: item.brand as string,
      category: item.category as string,
      price: Number(item.price),
      image: item.image_url as string,
      shopLink: (item.shop_link as string) ?? "#",
      shopType: (item.shop_type as "exact" | "similar") ?? "exact",
      hotspotX: item.hotspot_x != null ? Number(item.hotspot_x) : undefined,
      hotspotY: item.hotspot_y != null ? Number(item.hotspot_y) : undefined,
      note: (item.item_note as string) || undefined,
      savesCount: typeof item.saves_count === "number" ? item.saves_count : 0,
      questionsCount: typeof item.questions_count === "number" ? item.questions_count : 0,
    }) satisfies OutfitItem),
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
      // Expected when migrations haven't been applied yet.
      // Run supabase/migrations/012_multi_photo_complete.sql in Supabase SQL Editor.
      console.warn("[FYTD] outfit_media table not found — multi-photo posts will show only 1 image. Apply 012_multi_photo_complete.sql to fix.");
    } else {
      console.error("[FYTD] outfit_media SELECT failed:", msg);
    }
    return [];
  }

  return (data ?? []) as Record<string, unknown>[];
}

export async function getOutfits(tag?: string, style?: string): Promise<Outfit[]> {
  if (!hasSupabase()) {
    if (!tag && !style) return mockOutfits;
    return mockOutfits.filter((o) =>
      (!tag || o.tags.includes(tag)) &&
      (!style || o.styleTag === style)
    );
  }

  const supabase = await createClient();

  // Filter out blocked users' posts if the current user is authenticated
  const session = await getSession();
  const blockedIds = session ? await getBlockedCreatorIds(supabase, session.id) : [];

  const buildQuery = (withDeletedFilter: boolean) => {
    let q = supabase
      .from("outfits")
      .select("*, profiles(display_name, username, avatar_url)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (withDeletedFilter) q = q.is("deleted_at", null);
    if (tag) q = q.contains("tags", [tag]);
    if (style) q = q.eq("style_tag", style);
    if (blockedIds.length > 0) q = q.not("creator_id", "in", `(${blockedIds.join(",")})`);
    return q;
  };

  let { data, error } = await buildQuery(true);
  if (error?.message?.includes("deleted_at")) {
    console.warn("[getOutfits] deleted_at column missing — apply migration 009");
    ({ data, error } = await buildQuery(false));
  }
  if (error || !data) return mockOutfits;

  const outfitIds = data.map((o) => o.id as string);

  const [{ data: items }, mediaRows] = await Promise.all([
    supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order"),
    fetchMediaForOutfits(supabase, outfitIds),
  ]);

  return data.map((row) =>
    dbRowToOutfit(
      row as Record<string, unknown>,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      mediaRows.filter((m) => m.outfit_id === row.id)
    )
  );
}

export async function getOutfitById(id: string): Promise<Outfit | null> {
  if (!hasSupabase()) {
    return mockOutfits.find((o) => o.id === id) ?? null;
  }

  const supabase = await createClient();

  const runQuery = async (withDeletedFilter: boolean) => {
    const q = supabase
      .from("outfits")
      .select("*, profiles(display_name, username, avatar_url)")
      .eq("id", id)
      .eq("published", true);
    return withDeletedFilter ? q.is("deleted_at", null).single() : q.single();
  };

  let { data: row, error } = await runQuery(true);
  if (error?.message?.includes("deleted_at")) {
    console.warn("[getOutfitById] deleted_at column missing — apply migration 009");
    ({ data: row, error } = await runQuery(false));
  }

  if (error || !row) {
    return mockOutfits.find((o) => o.id === id) ?? null;
  }

  const [{ data: items }, mediaRows] = await Promise.all([
    supabase.from("outfit_items").select("*").eq("outfit_id", id).order("display_order"),
    fetchMediaForOutfits(supabase, [id]),
  ]);

  return dbRowToOutfit(
    row as Record<string, unknown>,
    (items ?? []) as Record<string, unknown>[],
    mediaRows
  );
}

export async function getTodaysFits(limit = 10): Promise<Outfit[]> {
  if (!hasSupabase()) return mockOutfits.slice(0, limit);
  const supabase = await createClient();

  const base = () =>
    supabase
      .from("outfits")
      .select("*, profiles(display_name, username, avatar_url)")
      .eq("published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

  // Try 24 h → 7 days → all posts (cold-start fallback)
  const windows = [
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    null,
  ];

  let rows: Record<string, unknown>[] = [];
  for (const since of windows) {
    const q = since ? base().gte("created_at", since) : base();
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      rows = data as Record<string, unknown>[];
      break;
    }
  }

  if (rows.length === 0) return [];

  const outfitIds = rows.map((o) => o.id as string);
  const [{ data: items }, mediaRows] = await Promise.all([
    supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order"),
    fetchMediaForOutfits(supabase, outfitIds),
  ]);
  return rows.map((row) =>
    dbRowToOutfit(
      row,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      mediaRows.filter((m) => m.outfit_id === row.id)
    )
  );
}

export async function getMostSavedFits(limit = 8): Promise<Outfit[]> {
  if (!hasSupabase()) return mockOutfits.slice(0, limit);
  const supabase = await createClient();

  // No time window — order by saves then likes so something always shows
  const { data, error } = await supabase
    .from("outfits")
    .select("*, profiles(display_name, username, avatar_url)")
    .eq("published", true)
    .is("deleted_at", null)
    .order("saves_count", { ascending: false })
    .order("likes_count", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return [];
  const outfitIds = data.map((o) => o.id as string);
  const [{ data: items }, mediaRows] = await Promise.all([
    supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order"),
    fetchMediaForOutfits(supabase, outfitIds),
  ]);
  return data.map((row) =>
    dbRowToOutfit(
      row as Record<string, unknown>,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      mediaRows.filter((m) => m.outfit_id === row.id)
    )
  );
}

export async function getTrendingOutfits(limit = 8): Promise<Outfit[]> {
  if (!hasSupabase()) return mockOutfits.slice(0, limit);

  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("outfits")
    .select("*, profiles(display_name, username, avatar_url)")
    .eq("published", true)
    .is("deleted_at", null)
    .gte("created_at", since)
    .order("likes_count", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  const outfitIds = data.map((o) => o.id as string);
  const [{ data: items }, mediaRows] = await Promise.all([
    supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order"),
    fetchMediaForOutfits(supabase, outfitIds),
  ]);

  return data.map((row) =>
    dbRowToOutfit(
      row as Record<string, unknown>,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      mediaRows.filter((m) => m.outfit_id === row.id)
    )
  );
}

export async function getCreatorOutfits(): Promise<Outfit[]> {
  const user = await getSession();
  if (!user || !hasSupabase()) return [];

  const supabase = await createClient();

  const runQuery = (withDeletedFilter: boolean) => {
    const q = supabase
      .from("outfits")
      .select("*, profiles(display_name, username, avatar_url)")
      .eq("creator_id", user.id)
      .eq("published", true)
      .order("created_at", { ascending: false });
    return withDeletedFilter ? q.is("deleted_at", null) : q;
  };

  let { data, error } = await runQuery(true);
  if (error?.message?.includes("deleted_at")) {
    console.warn("[getCreatorOutfits] deleted_at column missing — apply migration 009");
    ({ data, error } = await runQuery(false));
  }

  if (error || !data) return [];

  const outfitIds = data.map((o) => o.id as string);

  const [{ data: items }, mediaRows] = await Promise.all([
    supabase.from("outfit_items").select("*").in("outfit_id", outfitIds).order("display_order"),
    fetchMediaForOutfits(supabase, outfitIds),
  ]);

  return data.map((row) =>
    dbRowToOutfit(
      row as Record<string, unknown>,
      (items ?? []).filter((i) => i.outfit_id === row.id) as Record<string, unknown>[],
      mediaRows.filter((m) => m.outfit_id === row.id)
    )
  );
}
