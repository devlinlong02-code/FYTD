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
