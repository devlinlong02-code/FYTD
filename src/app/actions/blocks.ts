"use server";

import { createClient } from "@/lib/supabase/server";

export async function blockUser(blockedId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to block a user." };
  }

  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });

  if (error) {
    // Ignore unique constraint violations (already blocked)
    if (error.code === "23505") return { success: true };
    console.error("[blockUser] insert error:", error.message);
    return { success: false, error: "Failed to block user. Please try again." };
  }

  return { success: true };
}

export async function unblockUser(blockedId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to unblock a user." };
  }

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  if (error) {
    console.error("[unblockUser] delete error:", error.message);
    return { success: false, error: "Failed to unblock user. Please try again." };
  }

  return { success: true };
}

export async function getBlockedUsers(): Promise<{ id: string; display_name: string | null; username: string | null; avatar_url: string | null }[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data: blockRows, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);

  if (error) {
    console.error("[getBlockedUsers] query error:", error.message);
    return [];
  }

  const ids = (blockRows ?? []).map((r) => r.blocked_id as string);
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", ids);

  return (profiles ?? []) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null }[];
}
