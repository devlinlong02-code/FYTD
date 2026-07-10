"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export async function toggleSave(outfitId: string): Promise<{ saved: boolean; error?: string }> {
  const user = await getSession();
  if (!user) return { saved: false, error: "not_authenticated" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("saved_outfits")
    .select("id")
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("saved_outfits")
      .delete()
      .eq("user_id", user.id)
      .eq("outfit_id", outfitId);
    revalidatePath("/saved");
    revalidatePath("/account");
    return { saved: false };
  }

  await supabase
    .from("saved_outfits")
    .insert({ user_id: user.id, outfit_id: outfitId });

  // Notify outfit owner
  const { data: outfitRow } = await supabase
    .from("outfits")
    .select("creator_id")
    .eq("id", outfitId)
    .maybeSingle();
  const ownerId = outfitRow?.creator_id as string | undefined;
  if (ownerId && ownerId !== user.id) {
    await supabase.from("notifications").insert({
      recipient_id: ownerId,
      actor_id: user.id,
      type: "save",
      outfit_id: outfitId,
    });
  }

  revalidatePath("/saved");
  revalidatePath("/account");
  return { saved: true };
}

export async function getSavedOutfitIds(): Promise<string[]> {
  const user = await getSession();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_outfits")
    .select("outfit_id")
    .eq("user_id", user.id);

  return (data ?? []).map((r) => r.outfit_id as string);
}
