import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import OutfitCard from "@/components/OutfitCard";
import DbSaveButton from "@/components/DbSaveButton";
import CreatorBadge from "@/components/CreatorBadge";
import { getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
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

  const [allOutfits, savedIds, user] = await Promise.all([
    isFollowing ? Promise.resolve([]) : getOutfits(activeTag ?? undefined),
    getSavedOutfitIds(),
    getSession(),
  ]);

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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-xl tracking-tight text-neutral-900">FYTD</span>
        <Link
          href="/explore"
          aria-label="Search outfits"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </Link>
      </header>

      {/* Feed tabs */}
      <div className="flex gap-5 px-4 pt-3 pb-2">
        <Link
          href={activeTag ? `/?tag=${encodeURIComponent(activeTag)}` : "/"}
          className={`text-sm font-bold pb-1 transition-colors border-b-2 ${
            !isFollowing
              ? "text-neutral-900 border-neutral-900"
              : "text-neutral-400 border-transparent hover:text-neutral-600"
          }`}
        >
          For You
        </Link>
        <Link
          href="/?mode=following"
          className={`text-sm font-bold pb-1 transition-colors border-b-2 ${
            isFollowing
              ? "text-neutral-900 border-neutral-900"
              : "text-neutral-400 border-transparent hover:text-neutral-600"
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
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
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

        {/* Following — not yet available */}
        {isFollowing ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-neutral-700 text-sm font-semibold mb-1.5">Following is coming soon</p>
            <p className="text-neutral-400 text-xs mb-5 leading-relaxed max-w-[220px]">
              Follow creators and their fits will appear here.
            </p>
            <Link
              href="/"
              className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Back to For You
            </Link>
          </div>
        ) : allOutfits.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            {activeTag ? (
              <>
                <p className="text-neutral-700 text-sm font-semibold mb-1.5">No fits for this style yet</p>
                <p className="text-neutral-400 text-xs mb-5">Be the first to post a {activeTag} fit.</p>
                <div className="flex gap-2">
                  <Link href="/" className="text-sm font-semibold border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors">
                    All fits
                  </Link>
                  <Link href="/admin/upload" className="text-sm font-semibold bg-neutral-900 text-white px-4 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors">
                    Post a fit
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-neutral-700 text-sm font-semibold mb-1.5">No fits yet</p>
                <p className="text-neutral-400 text-xs mb-5 leading-relaxed max-w-[220px]">
                  Post the first outfit or explore styles.
                </p>
                <div className="flex gap-2">
                  <Link href="/explore" className="text-sm font-semibold border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors">
                    Explore
                  </Link>
                  <Link href="/admin/upload" className="text-sm font-semibold bg-neutral-900 text-white px-4 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors">
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
                <Link href={`/outfit/${featured.id}`} className="block group relative rounded-2xl overflow-hidden bg-neutral-100">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      priority
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 448px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  </div>

                  <div className="absolute top-3 right-3">
                    <DbSaveButton
                      outfitId={featured.id}
                      initialSaved={savedIds.includes(featured.id)}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-lg leading-tight mb-2">{featured.title}</p>
                    <CreatorBadge
                      name={featured.creatorName}
                      handle={featured.creatorHandle}
                      avatar={featured.creatorAvatar}
                      size="sm"
                    />
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {featured.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] font-medium bg-white/15 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">{t}</span>
                        ))}
                        <span className="text-[10px] font-medium bg-white/15 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">
                          {featured.items.length} pieces
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white/90 shrink-0">View Fit →</span>
                    </div>
                  </div>
                </Link>
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
