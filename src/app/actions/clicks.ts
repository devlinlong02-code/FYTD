"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export async function trackClick(outfitItemId: string, outfitId: string) {
  const supabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  if (!supabaseEnv) return;

  const user = await getSession();
  const supabase = await createClient();

  await supabase.from("click_events").insert({
    outfit_item_id: outfitItemId,
    outfit_id: outfitId,
    user_id: user?.id ?? null,
  });
}
