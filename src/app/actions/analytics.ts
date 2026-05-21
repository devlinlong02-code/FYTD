"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  );
}

export interface OutfitStat {
  id: string;
  title: string;
  image_url: string;
  views: number;
  saves: number;
  clicks: number;
}

export interface TopItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  clicks: number;
}

export interface AnalyticsData {
  totalViews: number;
  totalSaves: number;
  totalClicks: number;
  outfitStats: OutfitStat[];
  topItems: TopItem[];
}

const empty: AnalyticsData = {
  totalViews: 0,
  totalSaves: 0,
  totalClicks: 0,
  outfitStats: [],
  topItems: [],
};

export async function getAnalytics(): Promise<AnalyticsData> {
  const user = await getSession();
  if (!user) return empty;
  if (!hasSupabase()) return empty;

  const supabase = await createClient();

  const { data: outfits } = await supabase
    .from("outfits")
    .select("id, title, image_url, view_count, save_count")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (!outfits || outfits.length === 0) return empty;

  const outfitIds = outfits.map((o) => o.id as string);

  const { count: totalClicks } = await supabase
    .from("click_events")
    .select("*", { count: "exact", head: true })
    .in("outfit_id", outfitIds);

  const { data: clicksByItem } = await supabase
    .from("click_events")
    .select("outfit_item_id")
    .in("outfit_id", outfitIds);

  const itemClickCounts: Record<string, number> = {};
  for (const row of clicksByItem ?? []) {
    if (row.outfit_item_id) {
      itemClickCounts[row.outfit_item_id] = (itemClickCounts[row.outfit_item_id] ?? 0) + 1;
    }
  }

  const topItemIds = Object.entries(itemClickCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topItems: TopItem[] = [];
  if (topItemIds.length > 0) {
    const { data: items } = await supabase
      .from("outfit_items")
      .select("id, name, brand, category")
      .in("id", topItemIds);

    topItems = (items ?? []).map((item) => ({
      id: item.id as string,
      name: item.name as string,
      brand: item.brand as string,
      category: item.category as string,
      clicks: itemClickCounts[item.id as string] ?? 0,
    })).sort((a, b) => b.clicks - a.clicks);
  }

  const outfitStats: OutfitStat[] = outfits.map((o) => ({
    id: o.id as string,
    title: o.title as string,
    image_url: o.image_url as string,
    views: (o.view_count as number) ?? 0,
    saves: (o.save_count as number) ?? 0,
    clicks: 0,
  }));

  const totalViews = outfitStats.reduce((sum, o) => sum + o.views, 0);
  const totalSaves = outfitStats.reduce((sum, o) => sum + o.saves, 0);

  return {
    totalViews,
    totalSaves,
    totalClicks: totalClicks ?? 0,
    outfitStats,
    topItems,
  };
}
