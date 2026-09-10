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
  hotspotX?: number;
  hotspotY?: number;
  note?: string;
}

interface MediaItemData {
  media_url: string;
  media_type: "image" | "video";
  position: number;
  thumbnail_url?: string;
}

export type CreateOutfitState =
  | { error: string; outfitId?: undefined }       // total failure
  | { outfitId: string; error?: undefined }       // full success
  | { outfitId: string; error: string }           // partial: outfit saved, items failed
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
  const cardStyleRaw = (formData.get("card_style") as string)?.trim();
  const cardStyle = ["editorial", "statement", "streetwear"].includes(cardStyleRaw)
    ? (cardStyleRaw as "editorial" | "statement" | "streetwear")
    : "editorial";
  const styleTag = (formData.get("style_tag") as string)?.trim() || null;

  if (!title) return { error: "Title is required." };
  if (description && description.length > 500) return { error: "Caption must be 500 characters or fewer." };

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
      style_tag: styleTag,
      published: true,
      card_style: cardStyle,
    })
    .select("id")
    .single();

  // Fallback: card_style column missing (migration 032 not yet applied)
  if (outfitError?.message?.includes("card_style")) {
    console.warn("[createOutfit] card_style column missing — apply supabase/migrations/032_card_style.sql");
    ({ data: outfit, error: outfitError } = await supabase
      .from("outfits")
      .insert({
        creator_id: user.id,
        title,
        description,
        image_url: primaryMedia.media_url,
        media_type: primaryMedia.media_type,
        tags,
        style_tag: styleTag,
        published: true,
      })
      .select("id")
      .single());
  }

  // Fallback: media_type column missing (migration 004 not yet applied)
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

  // Insert outfit_media rows (migration 008 + 015 for thumbnail_url)
  const outfitMediaRows = mediaItems.map((m) => ({
    outfit_id: outfit.id,
    media_url: m.media_url,
    media_type: m.media_type,
    position: m.position,
    ...(m.thumbnail_url ? { thumbnail_url: m.thumbnail_url } : {}),
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

  // Parse and validate prices — empty string or missing → null (not 0)
  function parsePrice(raw: string | undefined | null): number | null {
    if (raw == null || String(raw).trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  for (const p of pieces.filter((p) => p.name?.trim())) {
    const price = parsePrice(p.price);
    if (price !== null && (price < 0 || price > 99999)) {
      return { error: "Item price must be between $0 and $99,999." };
    }
  }

  // Insert fit breakdown pieces
  const items = pieces
    .filter((p) => p.name?.trim())
    .map((p, i) => ({
      outfit_id: outfit.id,
      name: p.name.trim(),
      brand: p.brand?.trim() || null,
      category: p.category?.trim() || "Other",
      price: parsePrice(p.price),
      image_url: p.imageUrl?.trim() || null,
      shop_link: (p.shopLink?.trim() ? normalizeExternalUrl(p.shopLink) : null) ?? "",
      shop_type: p.shopType === "similar" ? "similar" : "exact",
      display_order: i + 1,
      hotspot_x: typeof p.hotspotX === 'number' ? p.hotspotX : null,
      hotspot_y: typeof p.hotspotY === 'number' ? p.hotspotY : null,
      item_note: p.note?.trim() || null,
    }));

  if (process.env.NODE_ENV !== "production") {
    console.log("[createOutfit] Items to insert:", JSON.stringify(items.map(({ outfit_id: _id, ...rest }) => rest), null, 2));
  }

  if (items.length > 0) {
    const results = await Promise.allSettled(
      items.map((item) => supabase.from("outfit_items").insert(item))
    );

    const failures = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error !== null)
    );

    if (failures.length === results.length) {
      const firstResult = results[0];
      const errDetail =
        firstResult.status === "fulfilled"
          ? {
              message: firstResult.value.error?.message,
              code: (firstResult.value.error as { code?: string })?.code,
              details: (firstResult.value.error as { details?: string })?.details,
              hint: (firstResult.value.error as { hint?: string })?.hint,
              items_sample: items.slice(0, 2),
            }
          : String((firstResult as PromiseRejectedResult).reason);
      console.error("[createOutfit] All items failed to insert:", JSON.stringify(errDetail, null, 2));
      return {
        outfitId: outfit.id,
        error: "Your outfit was posted, but the fit breakdown couldn't be saved. You can add pieces from your post.",
      };
    }

    if (failures.length > 0) {
      console.warn(`[createOutfit] ${failures.length}/${results.length} items failed to insert`);
    }
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/profile");
  revalidatePath("/admin/outfits");

  return { outfitId: outfit.id };
}
