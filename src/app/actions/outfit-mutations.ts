"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")
  );
}

export async function updateOutfit(
  id: string,
  data: {
    title: string;
    description?: string;
    image_url: string;
    tags: string[];
    published: boolean;
  },
  items: Array<{
    name: string;
    brand: string;
    category: string;
    price: number;
    image_url?: string;
    shop_link?: string;
    shop_type: "exact" | "similar";
    display_order: number;
  }>
): Promise<{ error?: string }> {
  if (!hasSupabase()) return { error: "Database not configured." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again to edit this post." };

  const { error: outfitError } = await supabase
    .from("outfits")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (outfitError) {
    console.error("[updateOutfit]", outfitError);
    return { error: "Could not update this post. Please try again." };
  }

  await supabase.from("outfit_items").delete().eq("outfit_id", id);

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("outfit_items")
      .insert(items.map((item) => ({ ...item, outfit_id: id })));
    if (itemsError) {
      console.error("[updateOutfit] items", itemsError);
      return { error: "Could not update outfit items. Please try again." };
    }
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/profile");
  revalidatePath("/admin/outfits");
  revalidatePath(`/outfit/${id}`);
  return {};
}

export async function takeDownOutfit(id: string): Promise<{ error?: string }> {
  if (!hasSupabase()) return { error: "Database not configured." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again to take down this post." };

  // Try with deleted_at (migration 009); fall back without it if column missing
  let { error } = await supabase
    .from("outfits")
    .update({ published: false, deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error?.message?.includes("deleted_at")) {
    console.warn("[takeDownOutfit] deleted_at column missing — apply migration 009");
    ({ error } = await supabase
      .from("outfits")
      .update({ published: false })
      .eq("id", id)
      .eq("creator_id", user.id));
  }

  if (error) {
    console.error("[takeDownOutfit]", error);
    return { error: "Could not take down this post. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/profile");
  revalidatePath("/admin/outfits");
  revalidatePath(`/outfit/${id}`);
  return {};
}

export async function deleteOutfit(id: string): Promise<{ error?: string }> {
  if (!hasSupabase()) return { error: "Database not configured." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again to delete this post." };

  const { error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    console.error("[deleteOutfit]", error);
    return { error: "Could not delete this post. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/profile");
  revalidatePath("/admin/outfits");
  return {};
}
