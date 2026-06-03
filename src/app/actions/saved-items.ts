"use server";

import { createClient } from "@/lib/supabase/server";

export interface SavedItemData {
  savedId: string;
  savedAt: string;
  outfitId: string;
  outfitTitle: string;
  item: {
    id: string;
    name: string;
    brand: string | null;
    category: string;
    price: number;
    imageUrl: string | null;
    shopLink: string | null;
    shopType: "exact" | "similar";
  };
}

export async function toggleSavedItem(
  itemId: string,
  outfitId: string
): Promise<{ saved: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false };

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_items").delete().eq("id", existing.id);
    return { saved: false };
  }

  await supabase.from("saved_items").insert({
    user_id: user.id,
    item_id: itemId,
    outfit_id: outfitId,
  });
  return { saved: true };
}

export async function getSavedItemIds(outfitId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_items")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId);

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      console.warn("[FYTD] saved_items table not found — apply 016_hotspots_saved_items.sql");
    }
    return [];
  }

  return (data ?? []).map((r) => r.item_id as string);
}

export async function getSavedItems(): Promise<SavedItemData[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_items")
    .select(`
      id,
      saved_at,
      outfit_id,
      outfit_items!item_id (
        id, name, brand, category, price, image_url, shop_link, shop_type
      ),
      outfits!outfit_id (
        title
      )
    `)
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      console.warn("[FYTD] saved_items table not found — apply 016_hotspots_saved_items.sql");
    }
    return [];
  }

  return (data ?? []).map((r) => {
    const raw = r as Record<string, unknown>;
    const item = raw.outfit_items as Record<string, unknown>;
    const outfit = raw.outfits as Record<string, unknown>;
    return {
      savedId: raw.id as string,
      savedAt: raw.saved_at as string,
      outfitId: raw.outfit_id as string,
      outfitTitle: (outfit?.title as string) ?? "Outfit",
      item: {
        id: item.id as string,
        name: item.name as string,
        brand: (item.brand as string | null) ?? null,
        category: (item.category as string) ?? "",
        price: Number(item.price ?? 0),
        imageUrl: (item.image_url as string | null) ?? null,
        shopLink: (item.shop_link as string | null) ?? null,
        shopType: (item.shop_type as "exact" | "similar") ?? "exact",
      },
    };
  });
}
