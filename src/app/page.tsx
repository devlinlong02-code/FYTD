import Link from "next/link";
import Layout from "@/components/Layout";
import HomeFeedCard from "@/components/HomeFeedCard";
import CreatorStoriesRow from "@/components/CreatorStoriesRow";
import MessagesHeaderButton from "@/components/MessagesHeaderButton";
import { getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getFollowingFeed } from "@/app/actions/follows";
import { getLikedOutfitIds } from "@/app/actions/likes";
import { getSession } from "@/lib/dal";

interface HomeProps {
  searchParams: Promise<{ tag?: string; mode?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { mode } = await searchParams;
  const isFollowing = mode === "following";

  const [user, savedIds] = await Promise.all([
    getSession(),
    getSavedOutfitIds(),
  ]);

  const allOutfits = isFollowing
    ? user ? await getFollowingFeed(user.id) : []
    : await getOutfits();

  const outfitIds = allOutfits.map((o) => o.id);
  const likedIds = outfitIds.length > 0 ? await getLikedOutfitIds(outfitIds) : [];
  const likedSet = new Set(likedIds);
  const savedSet = new Set(savedIds);
  const isAuthenticated = !!user;

  return (
    <Layout background="bg-[#0a0a0a]">
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header className="home-header">
        <span className="home-wordmark">FYTD</span>
        <div className="home-header-icons">
          <Link
            href="/explore"
            aria-label="Search"
            className="home-icon-btn"
          >
            <svg width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <MessagesHeaderButton />
        </div>
      </header>

      {/* ── Creator stories row ────────────────────────────────────────────── */}
      <CreatorStoriesRow currentUserId={user?.id ?? null} />

      {/* ── Feed tabs ──────────────────────────────────────────────────────── */}
      <div className="feed-tabs">
        <Link
          href="/"
          className={`feed-tab ${!isFollowing ? "active" : ""}`}
        >
          For You
        </Link>
        <Link
          href="/?mode=following"
          className={`feed-tab ${isFollowing ? "active" : ""}`}
        >
          Following
        </Link>
      </div>

      {/* ── Feed ───────────────────────────────────────────────────────────── */}
      <div className="pb-24" style={{ background: "#0a0a0a" }}>
        {allOutfits.length === 0 ? (
          isFollowing ? (
            <div className="feed-empty">
              <div className="feed-empty-icon">
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "rgba(0,0,0,0.2)" }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <p className="feed-empty-title">No fits yet</p>
              <p className="feed-empty-subtitle">Follow creators to see their fits here</p>
              <Link href="/explore" className="feed-empty-cta">Discover creators →</Link>
            </div>
          ) : (
            <div className="feed-empty">
              <div className="feed-empty-icon">
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "rgba(0,0,0,0.2)" }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <p className="feed-empty-title">Be the first to post</p>
              <p className="feed-empty-subtitle">FYTD is just getting started. Post your first fit.</p>
              <Link href="/admin/upload" className="feed-empty-cta">Post a fit →</Link>
            </div>
          )
        ) : (
          <div>
            {allOutfits.map((outfit, i) => (
              <HomeFeedCard
                key={outfit.id}
                outfit={outfit}
                initialLiked={likedSet.has(outfit.id)}
                initialSaved={savedSet.has(outfit.id)}
                isAuthenticated={isAuthenticated}
                currentUserId={user?.id ?? null}
                priority={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
