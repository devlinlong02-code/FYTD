import { redirect } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import ProfileHeader from "@/components/ProfileHeader";
import OutfitCard from "@/components/OutfitCard";
import ProfileThreeDotMenu from "@/components/ProfileThreeDotMenu";
import MessageButton from "@/components/MessageButton";
import FollowButton from "@/components/FollowButton";
import { getPublicProfile } from "@/app/actions/public-profile";
import { getSession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getLikedOutfitIds } from "@/app/actions/likes";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getIsFollowing(currentUserId: string, profileId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", profileId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;

  const [profileData, user] = await Promise.all([
    getPublicProfile(username),
    getSession(),
  ]);

  // Profile not found
  if (!profileData) {
    return (
      <Layout>
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
            aria-label="Back"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="font-bold text-xl tracking-tight text-neutral-900 flex-1">Profile</span>
        </div>
        <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">User not found</h2>
          <p className="text-sm text-neutral-400 mb-8">@{username} doesn&apos;t exist or has been removed.</p>
          <Link
            href="/"
            className="py-3 px-6 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </Layout>
    );
  }

  const { profile, outfits, followCounts, socialLinks } = profileData;

  // If viewing own profile, redirect to /profile
  if (user && user.id === profile.id) {
    redirect("/profile");
  }

  // Check if the profile owner has blocked the current viewer
  const isBlockedViewer = user
    ? await (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from("blocks")
          .select("id")
          .eq("blocker_id", profile.id)
          .eq("blocked_id", user.id)
          .maybeSingle();
        return !!data;
      })()
    : false;

  if (isBlockedViewer) {
    return (
      <Layout>
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600" aria-label="Back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="font-bold text-xl tracking-tight text-neutral-900">Profile</span>
        </div>
        <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">This account is unavailable</h2>
          <p className="text-sm text-neutral-400">You can&apos;t view this profile.</p>
        </div>
      </Layout>
    );
  }

  const outfitIds = outfits.map((o) => o.id);
  const [savedIds, initialIsFollowing, likedIds] = await Promise.all([
    user ? getSavedOutfitIds() : Promise.resolve([] as string[]),
    user ? getIsFollowing(user.id, profile.id) : Promise.resolve(false),
    user && outfitIds.length > 0 ? getLikedOutfitIds(outfitIds) : Promise.resolve([] as string[]),
  ]);

  const stats = {
    outfits: outfits.length,
    followers: followCounts.followers,
    following: followCounts.following,
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
          aria-label="Back"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="font-bold text-xl tracking-tight text-neutral-900 flex-1">
          {profile.username}
        </span>
        <ProfileThreeDotMenu
          profileId={profile.id}
          username={profile.username}
          displayName={profile.display_name}
          currentUserId={user?.id ?? null}
        />
      </div>

      {/* Profile header */}
      <ProfileHeader
        avatar={profile.avatar_url}
        displayName={profile.display_name}
        username={profile.username}
        bio={profile.bio ?? ""}
        location={profile.location ?? undefined}
        styleTags={profile.style_tags}
        stats={stats}
        userId={profile.id}
        isOwnProfile={false}
        currentUserId={user?.id}
        isFollowing={initialIsFollowing}
        socialLinks={socialLinks}
      />

      {/* Follow (primary) + Message (secondary) action row */}
      {user && (
        <div className="px-4 pt-4 pb-1 flex items-center gap-2.5">
          <FollowButton
            targetUserId={profile.id}
            currentUserId={user.id}
            initialIsFollowing={initialIsFollowing}
            size="md"
            className="w-full justify-center"
          />
          <MessageButton profileId={profile.id} variant="secondary" />
        </div>
      )}

      {/* Posts grid */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-sm font-bold text-neutral-900 mb-4 tracking-tight">
          Posts
          <span className="text-neutral-400 font-normal ml-2">{outfits.length}</span>
        </h2>

        {outfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-sm text-neutral-400">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                savedIds={savedIds}
                isAuthenticated={!!user}
                currentUserId={user?.id ?? null}
                likedIds={likedIds}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
