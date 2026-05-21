"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type ProfileState =
  | { error: string; success?: false }
  | { error: null; success: true }
  | null;

function normalizeInstagram(val: string | null | undefined): string | null {
  const v = val?.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}
function normalizeTikTok(val: string | null | undefined): string | null {
  const v = val?.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://tiktok.com/@${v.replace(/^@/, "")}`;
}
function normalizeWebsite(val: string | null | undefined): string | null {
  const v = val?.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

// Columns added by migration 005 — may not exist in the live DB yet
const MIGRATION_005_COLS = ["instagram_url", "tiktok_url", "website_url", "profile_completed"];

function isSchemaCacheError(msg: string) {
  return MIGRATION_005_COLS.some((col) => msg.includes(col));
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await getSession();
  if (!user) return { error: "You must be signed in." };

  const display_name = (formData.get("display_name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const bio = (formData.get("bio") as string)?.trim() ?? "";
  const location = (formData.get("location") as string)?.trim() ?? "";
  const avatar_url = (formData.get("avatar_url") as string)?.trim() || null;
  const instagram_url = normalizeInstagram(formData.get("instagram_url") as string);
  const tiktok_url    = normalizeTikTok(formData.get("tiktok_url") as string);
  const website_url   = normalizeWebsite(formData.get("website_url") as string);
  const style_tags_raw = (formData.get("style_tags") as string) || "[]";
  const action_type = (formData.get("action_type") as string) || "save";
  const is_setup = formData.get("is_setup") === "true";

  const supabase = await createClient();

  if (action_type === "skip") {
    // profile_completed may not exist yet — ignore error if column is missing
    const { error: skipError } = await supabase
      .from("profiles")
      .update({ profile_completed: true })
      .eq("id", user.id);
    if (skipError && !isSchemaCacheError(skipError.message)) {
      console.error("[updateProfile/skip] Error:", skipError);
    }
    redirect("/");
  }

  let style_tags: string[] = [];
  try {
    style_tags = JSON.parse(style_tags_raw);
  } catch {
    style_tags = [];
  }

  if (!display_name) return { error: "Display name is required." };
  if (username && !/^[a-z0-9_.]+$/.test(username)) {
    return { error: "Username can only contain letters, numbers, underscores, and periods." };
  }

  // Full update — includes columns from migration 005 (social links + profile_completed)
  const fullUpdates: Record<string, unknown> = {
    display_name,
    bio,
    location,
    style_tags,
    avatar_url,
    instagram_url,
    tiktok_url,
    website_url,
    updated_at: new Date().toISOString(),
  };
  if (username) fullUpdates.username = username;
  if (is_setup) fullUpdates.profile_completed = true;

  let { error } = await supabase
    .from("profiles")
    .update(fullUpdates)
    .eq("id", user.id);

  // If migration 005 columns are missing, fall back to saving social links in the
  // migration-002 JSONB column, then drop that too if it doesn't exist either.
  if (error && isSchemaCacheError(error.message)) {
    console.warn("[updateProfile] Social link columns missing — apply supabase/migrations/005_profile_enhancements.sql");
    const baseUpdates: Record<string, unknown> = {
      display_name, bio, location, style_tags, avatar_url,
      updated_at: new Date().toISOString(),
      // Store social links in the migration-002 JSONB column as fallback
      social_links: { instagram_url, tiktok_url, website_url },
    };
    if (username) baseUpdates.username = username;
    ({ error } = await supabase.from("profiles").update(baseUpdates).eq("id", user.id));
    // If social_links column also missing, drop it and try bare minimum
    if (error) {
      const { social_links: _dropped, ...minUpdates } = baseUpdates;
      ({ error } = await supabase.from("profiles").update(minUpdates).eq("id", user.id));
    }
  }

  if (error) {
    console.error("[updateProfile] DB update failed:", error);
    if (error.code === "23505") return { error: "Username is already taken. Try another." };
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/account");
  revalidatePath("/account/edit");

  if (is_setup) redirect("/profile");

  return { error: null, success: true };
}
