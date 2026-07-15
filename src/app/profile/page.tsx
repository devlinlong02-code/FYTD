import Layout from "@/components/Layout";
import ProfileHeader from "@/components/ProfileHeader";
import ProfileTabContent from "./ProfileTabContent";
import { getProfile, getSession } from "@/lib/dal";
import { getCreatorOutfits, getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getSavedItems } from "@/app/actions/saved-items";
import { getFollowCounts } from "@/app/actions/follows";
import { getLikedOutfitIds } from "@/app/actions/likes";
import Link from "next/link";

export default async function ProfilePage() {
  const [profile, user, savedIds, postedOutfits] = await Promise.all([
    getProfile(),
    getSession(),
    getSavedOutfitIds(),
    getCreatorOutfits(),
  ]);

  if (!user) {
    return (
      <Layout>
        <div className="profile-page-header sticky top-0 z-30 px-4 py-3">
          <span className="profile-page-header-title">Profile</span>
        </div>
        <div className="profile-page flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full profile-empty-icon flex items-center justify-center mb-5">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" style={{ color: "var(--page-icon)" }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--page-text-primary)" }}>Sign in to see your profile</h2>
          <p className="text-sm mb-8" style={{ color: "var(--page-text-muted)" }}>Your outfits, saves, and stats live here.</p>
          <Link
            href="/auth/login?next=/profile"
            className="w-full max-w-xs py-3 rounded-2xl text-sm font-semibold text-center"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            Sign In
          </Link>
          <Link href="/auth/signup" className="mt-3 text-sm font-medium" style={{ color: "var(--page-text-muted)" }}>
            Create an account
          </Link>
        </div>
      </Layout>
    );
  }

  const [allOutfits, savedItems, followCounts] = await Promise.all([
    getOutfits(),
    getSavedItems(),
    getFollowCounts(user.id),
  ]);
  const savedOutfits = allOutfits.filter((o) => savedIds.includes(o.id));
  const allOutfitIds = [...postedOutfits, ...savedOutfits].map((o) => o.id);
  const likedIds = allOutfitIds.length > 0 ? await getLikedOutfitIds(allOutfitIds) : [];

  const displayName = profile?.display_name ?? "User";
  const username = profile?.username ?? "user";
  const avatar = profile?.avatar_url ?? null;
  const bio = profile?.bio ?? "";
  const location = profile?.location ?? undefined;
  const styleTags: string[] = (profile?.style_tags as string[] | undefined) ?? [];

  // Read from individual columns (migration 005) or JSONB fallback (migration 002).
  // Use `in` to detect whether the column exists at all — `??` alone would fall through
  // when the column exists but is null, incorrectly restoring a stale JSONB value.
  const profileAny = profile as Record<string, unknown> | null;
  const profileObj = profileAny ?? {};
  const socialLinksJson = profileAny?.social_links as Record<string, string | null> | null;
  function readSocialLink(col: string): string | null {
    if (col in profileObj) return (profileObj[col] as string | null) ?? null;
    return (socialLinksJson?.[col] as string | null) ?? null;
  }
  const socialLinks = {
    instagram_url: readSocialLink("instagram_url"),
    tiktok_url:    readSocialLink("tiktok_url"),
    website_url:   readSocialLink("website_url"),
  };

  const stats = {
    outfits: postedOutfits.length,
    followers: followCounts.followers,
    following: followCounts.following,
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="profile-page-header sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <span className="profile-page-header-title">Profile</span>
        <Link
          href="/settings"
          aria-label="Settings"
          className="profile-page-icon flex items-center justify-center w-9 h-9 rounded-full transition-colors"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Profile header */}
      <ProfileHeader
        avatar={avatar}
        displayName={displayName}
        username={username}
        bio={bio}
        location={location}
        styleTags={styleTags}
        stats={stats}
        userId={user.id}
        isOwnProfile={true}
        currentUserId={user.id}
        socialLinks={socialLinks}
      />

      {/* Edit Profile button */}
      <div className="px-4 pt-4">
        <Link href="/account/edit" className="profile-edit-btn">
          Edit Profile
        </Link>
      </div>

      {/* Tabs: Posts / Saved / Pieces */}
      <ProfileTabContent
        postedOutfits={postedOutfits}
        savedOutfits={savedOutfits}
        initialSavedItems={savedItems}
        savedIds={savedIds}
        isAuthenticated={!!user}
        currentUserId={user.id}
        likedIds={likedIds}
      />
    </Layout>
  );
}
