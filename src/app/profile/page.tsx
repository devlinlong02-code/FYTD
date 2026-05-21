import Layout from "@/components/Layout";
import ProfileHeader from "@/components/ProfileHeader";
import OutfitCard from "@/components/OutfitCard";
import { getProfile, getSession } from "@/lib/dal";
import { getCreatorOutfits, getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
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
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
          <span className="font-bold text-xl tracking-tight text-neutral-900">Profile</span>
        </div>
        <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Sign in to see your profile</h2>
          <p className="text-sm text-neutral-400 mb-8">Your outfits, saves, and stats live here.</p>
          <Link
            href="/auth/login?next=/profile"
            className="w-full max-w-xs py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold text-center hover:bg-neutral-700 transition-colors"
          >
            Sign In
          </Link>
          <Link href="/auth/signup" className="mt-3 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Create an account
          </Link>
        </div>
      </Layout>
    );
  }

  const allOutfits = await getOutfits();
  const savedOutfits = allOutfits.filter((o) => savedIds.includes(o.id));

  const displayName = profile?.display_name ?? user.email ?? "User";
  const username = profile?.username ?? user.email?.split("@")[0] ?? "user";
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
    saves: savedOutfits.length,
    followers: 0,
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Profile</span>
        <Link
          href="/account"
          aria-label="Account settings"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        socialLinks={socialLinks}
      />

      {/* Edit Profile button */}
      <div className="px-4 pt-4">
        <Link
          href="/account/edit"
          className="block w-full text-center py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      {/* Posted outfits */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold text-neutral-900">My Outfits</h2>
          <span className="text-xs text-neutral-400">{postedOutfits.length} posted</span>
        </div>

        {postedOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm font-medium mb-1">No outfits yet</p>
            <p className="text-neutral-400 text-sm mb-4">Start posting fits to build your profile.</p>
            <Link
              href="/admin/upload"
              className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Post an outfit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {postedOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                savedIds={savedIds}
                isAuthenticated={!!user}
                isOwner
              />
            ))}
          </div>
        )}
      </div>

      {/* Saved outfits */}
      <div className="px-4 pt-2 pb-8 border-t border-neutral-100">
        <div className="flex items-baseline justify-between mb-4 pt-5">
          <h2 className="text-base font-bold text-neutral-900">Saved</h2>
          <span className="text-xs text-neutral-400">{savedOutfits.length} saved</span>
        </div>

        {savedOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm font-medium mb-1">Nothing saved yet</p>
            <p className="text-neutral-400 text-sm">Tap the bookmark on any outfit to save it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                savedIds={savedIds}
                isAuthenticated={!!user}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
