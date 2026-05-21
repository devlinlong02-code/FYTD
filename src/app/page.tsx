import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import OutfitCard from "@/components/OutfitCard";
import FilterBar from "@/components/FilterBar";
import DbSaveButton from "@/components/DbSaveButton";
import CreatorBadge from "@/components/CreatorBadge";
import { getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getSession } from "@/lib/dal";
import type { AestheticTag } from "@/types";

interface HomeProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { tag } = await searchParams;
  const activeTag = (tag as AestheticTag) || null;

  const [allOutfits, savedIds, user] = await Promise.all([
    getOutfits(activeTag ?? undefined),
    getSavedOutfitIds(),
    getSession(),
  ]);

  const [featured, ...rest] = allOutfits;
  const isAuthenticated = !!user;

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

      {/* Filter chips — link-based, no client state needed */}
      <div className="px-4 py-3 border-b border-neutral-50">
        <FilterBar activeTag={activeTag} />
      </div>

      {/* Feed */}
      <div className="px-4 pt-4 pb-4">
        {allOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-neutral-500 text-sm font-medium mb-1">No outfits found.</p>
            <Link href="/" className="mt-3 text-sm font-medium text-neutral-900 underline underline-offset-2">
              Clear filter
            </Link>
          </div>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <div className="mb-4">
                <Link href={`/outfit/${featured.id}`} className="block group relative rounded-2xl overflow-hidden bg-neutral-100">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      priority
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-semibold tracking-widest uppercase bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/20">
                      Featured
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <DbSaveButton
                      outfitId={featured.id}
                      initialSaved={savedIds.includes(featured.id)}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-xl leading-tight mb-2">{featured.title}</p>
                    <CreatorBadge
                      name={featured.creatorName}
                      handle={featured.creatorHandle}
                      avatar={featured.creatorAvatar}
                      size="sm"
                    />
                    <div className="flex items-center justify-between mt-3">
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
