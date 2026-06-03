"use server";

import { createClient } from "@/lib/supabase/server";

export async function getLikedOutfitIds(outfitIds: string[]): Promise<string[]> {
  if (outfitIds.length === 0) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("likes")
    .select("outfit_id")
    .eq("user_id", user.id)
    .in("outfit_id", outfitIds);
  return (data ?? []).map((r) => r.outfit_id as string);
}

export async function getIsLiked(outfitId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("likes")
    .select("outfit_id")
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId)
    .maybeSingle();
  return !!data;
}
