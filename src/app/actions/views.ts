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

export async function trackView(outfitId: string) {
  if (!hasSupabase()) return;
  const user = await getSession();
  const supabase = await createClient();
  supabase.from("outfit_views").insert({
    outfit_id: outfitId,
    user_id: user?.id ?? null,
  });
}

export async function getOutfitViews(outfitId: string): Promise<number> {
  if (!hasSupabase()) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("outfit_views")
    .select("*", { count: "exact", head: true })
    .eq("outfit_id", outfitId);
  return count ?? 0;
}
