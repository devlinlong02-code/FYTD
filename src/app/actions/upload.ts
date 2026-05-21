"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import { normalizeExternalUrl } from "@/lib/links";

interface PieceData {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  imageUrl: string;
  shopLink: string;
  shopType: "exact" | "similar";
}

interface MediaItemData {
  media_url: string;
  media_type: "image" | "video";
  position: number;
}

export type CreateOutfitState =
  | { error: string; outfitId?: never }
  | { outfitId: string; error?: never }
  | null;

export async function createOutfit(
  _prev: CreateOutfitState,
  formData: FormData
): Promise<CreateOutfitState> {
  const user = await getSession();
  if (!user) return { error: "You must be signed in." };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const itemsJson = (formData.get("items_json") as string) || "[]";
  const mediaItemsJson = (formData.get("media_items_json") as string) || "[]";

  if (!title) return { error: "Title is required." };

  // Parse media items (new multi-media format)
  let mediaItems: MediaItemData[] = [];
  try {
    mediaItems = JSON.parse(mediaItemsJson);
  } catch {
    mediaItems = [];
  }

  // Fallback: support legacy single-upload hidden fields
  if (mediaItems.length === 0) {
    const legacyUrl = (formData.get("image_url") as string)?.trim();
    const legacyType = ((formData.get("media_type") as string)?.trim() || "image") as "image" | "video";
    if (legacyUrl) {
      mediaItems = [{ media_url: legacyUrl, media_type: legacyType, position: 0 }];
    }
  }

  if (mediaItems.length === 0) {
    return { error: "Please upload at least one photo or video of your outfit." };
  }

  const primaryMedia = mediaItems[0];

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  let pieces: PieceData[] = [];
  try {
    pieces = JSON.parse(itemsJson);
  } catch {
    pieces = [];
  }

  const supabase = await createClient();

  // Create outfit row (image_url + media_type store the primary media for backward compat)
  let { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .insert({
      creator_id: user.id,
      title,
      description,
      image_url: primaryMedia.media_url,
      media_type: primaryMedia.media_type,
      tags,
      published: true,
    })
    .select("id")
    .single();

  if (outfitError?.message?.includes("media_type")) {
    console.warn("[createOutfit] media_type column missing — apply supabase/migrations/004_media.sql");
    ({ data: outfit, error: outfitError } = await supabase
      .from("outfits")
      .insert({
        creator_id: user.id,
        title,
        description,
        image_url: primaryMedia.media_url,
        tags,
        published: true,
      })
      .select("id")
      .single());
  }

  if (outfitError || !outfit) {
    console.error("[createOutfit] DB insert failed:", outfitError);
    return { error: outfitError?.message ?? "Failed to create outfit." };
  }

  // Insert outfit_media rows (migration 008)
  const outfitMediaRows = mediaItems.map((m) => ({
    outfit_id: outfit.id,
    media_url: m.media_url,
    media_type: m.media_type,
    position: m.position,
  }));

  const { error: mediaError } = await supabase.from("outfit_media").insert(outfitMediaRows);
  if (mediaError) {
    const msg = mediaError.message ?? "";
    if (msg.includes("schema cache") || msg.includes("does not exist")) {
      console.warn("[FYTD] outfit_media INSERT skipped — table not found. Apply 012_multi_photo_complete.sql. Only the first photo will be visible for this post.");
    } else {
      console.error("[FYTD] outfit_media INSERT failed:", msg, "— only the first photo will be visible.");
    }
  }

  // Insert fit breakdown pieces
  const items = pieces
    .filter((p) => p.name?.trim())
    .map((p, i) => ({
      outfit_id: outfit.id,
      name: p.name.trim(),
      brand: p.brand?.trim() ?? "",
      category: p.category?.trim() || "Other",
      price: parseFloat(p.price ?? "0") || 0,
      image_url: p.imageUrl?.trim() || null,
      shop_link: normalizeExternalUrl(p.shopLink) ?? "",
      shop_type: p.shopType === "similar" ? "similar" : "exact",
      display_order: i + 1,
    }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("outfit_items").insert(items);
    if (itemsError) {
      console.error("[createOutfit] Items insert failed:", itemsError);
      // Delete the orphaned outfit row so the user can retry cleanly
      await supabase.from("outfits").delete().eq("id", outfit.id);
      return { error: `Failed to save fit breakdown: ${itemsError.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/profile");
  revalidatePath("/admin/outfits");

  return { outfitId: outfit.id };
}
