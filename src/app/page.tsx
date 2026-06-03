import Link from "next/link";
import Layout from "@/components/Layout";
import OutfitCard from "@/components/OutfitCard";
import { getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getFollowingFeed } from "@/app/actions/follows";
import { getSession } from "@/lib/dal";
import type { AestheticTag } from "@/types";

interface HomeProps {
  searchParams: Promise<{ tag?: string; mode?: string }>;
}

const FEED_CHIPS: { label: string; tag: string | null }[] = [
  { label: "All", tag: null },
  { label: "Streetwear", tag: "streetwear" },
  { label: "Clean", tag: "clean fit" },
  { label: "Minimal", tag: "minimal" },
  { label: "Going Out", tag: "night out" },
  { label: "Campus", tag: "campus" },
];

export default async function HomePage({ searchParams }: HomeProps) {
  const { tag, mode } = await searchParams;
  const isFollowing = mode === "following";
  const activeTag = (!isFollowing && tag) ? (tag as AestheticTag) : null;

  const [user, savedIds] = await Promise.all([
    getSession(),
    getSavedOutfitIds(),
  ]);

  const allOutfits = isFollowing
    ? user ? await getFollowingFeed(user.id) : []
    : await getOutfits(activeTag ?? undefined);

  const [featured, ...rest] = allOutfits;
  const isAuthenticated = !!user;

  // Chip href helpers
  function chipHref(chipTag: string | null) {
    if (isFollowing) return chipTag ? `/?tag=${encodeURIComponent(chipTag)}` : "/";
    if (!chipTag) return "/";
    return activeTag === chipTag ? "/" : `/?tag=${encodeURIComponent(chipTag)}`;
  }

  return (
    <Layout>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/98 backdrop-blur-md border-b border-neutral-100/80 px-4 py-3.5 flex items-center justify-between">
        <span className="font-black text-xl tracking-[0.15em] uppercase text-neutral-900">FYTD</span>
        <Link
          href="/explore"
          aria-label="Search outfits"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </Link>
      </header>

      {/* Feed tabs */}
      <div className="flex gap-6 px-4 pt-3 pb-2">
        <Link
          href={activeTag ? `/?tag=${encodeURIComponent(activeTag)}` : "/"}
          className={`text-sm font-bold pb-1 transition-colors border-b-2 ${
            !isFollowing
              ? "text-neutral-900 border-neutral-900 tracking-tight"
              : "text-neutral-300 border-transparent hover:text-neutral-500"
          }`}
        >
          For You
        </Link>
        <Link
          href="/?mode=following"
          className={`text-sm font-bold pb-1 transition-colors border-b-2 ${
            isFollowing
              ? "text-neutral-900 border-neutral-900 tracking-tight"
              : "text-neutral-300 border-transparent hover:text-neutral-500"
          }`}
        >
          Following
        </Link>
      </div>

      {/* Aesthetic chips — only on For You */}
      {!isFollowing && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {FEED_CHIPS.map(({ label, tag: chipTag }) => {
            const isActive = chipTag === null ? activeTag === null : activeTag === chipTag;
            return (
              <Link
                key={label}
                href={chipHref(chipTag)}
                className={`shrink-0 whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "text-xs font-semibold px-4 py-1.5 rounded-full bg-neutral-900 text-white tracking-wide shadow-sm"
                    : "text-xs font-medium px-4 py-1.5 rounded-full bg-transparent text-neutral-400 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-700"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Feed */}
      <div className="px-4 pb-8">

        {isFollowing && allOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-neutral-900 text-sm font-bold mb-1.5 tracking-tight">Follow creators to see their fits here</p>
            <p className="text-neutral-400 text-xs mb-6 leading-relaxed max-w-[200px] text-center">
              Discover creators and follow them to build your feed.
            </p>
            <Link
              href="/"
              className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-full tracking-wide shadow-sm hover:bg-neutral-800 transition-all duration-200"
            >
              Discover
            </Link>
          </div>
        ) : !isFollowing && allOutfits.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-5">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            {activeTag ? (
              <>
                <p className="text-neutral-900 text-sm font-bold mb-1.5 tracking-tight">No fits for this style yet</p>
                <p className="text-neutral-400 text-xs mb-6 leading-relaxed max-w-[200px] text-center">Be the first to post a {activeTag} fit.</p>
                <div className="flex gap-2">
                  <Link href="/" className="text-sm font-medium border border-neutral-200 text-neutral-600 px-5 py-2.5 rounded-full hover:border-neutral-400 hover:text-neutral-900 transition-all duration-200">
                    All fits
                  </Link>
                  <Link href="/admin/upload" className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-full tracking-wide shadow-sm hover:bg-neutral-800 transition-all duration-200">
                    Post a fit
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-neutral-900 text-sm font-bold mb-1.5 tracking-tight">No fits yet</p>
                <p className="text-neutral-400 text-xs mb-6 leading-relaxed max-w-[200px] text-center">
                  Post the first outfit or explore styles.
                </p>
                <div className="flex gap-2">
                  <Link href="/explore" className="text-sm font-medium border border-neutral-200 text-neutral-600 px-5 py-2.5 rounded-full hover:border-neutral-400 hover:text-neutral-900 transition-all duration-200">
                    Explore
                  </Link>
                  <Link href="/admin/upload" className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-full tracking-wide shadow-sm hover:bg-neutral-800 transition-all duration-200">
                    Post a fit
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <div className="mb-3">
                <OutfitCard
                  outfit={featured}
                  savedIds={savedIds}
                  isAuthenticated={isAuthenticated}
                  variant="hero"
                  priority
                />
              </div>
            )}

            {/* 2-col grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {rest.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    savedIds={savedIds}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
