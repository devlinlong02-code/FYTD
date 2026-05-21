import { notFound } from "next/navigation";
import { getOutfitById } from "@/app/actions/outfits";
import MediaCarousel from "@/components/MediaCarousel";
import TakeDownButton from "@/components/TakeDownButton";
import { trackView } from "@/app/actions/views";
import { getSession } from "@/lib/dal";
import Layout from "@/components/Layout";
import TagPill from "@/components/TagPill";
import CreatorBadge from "@/components/CreatorBadge";
import ProductCard from "@/components/ProductCard";
import OutfitSaveButton from "./OutfitSaveButton";

export default async function OutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [outfit, user] = await Promise.all([getOutfitById(id), getSession()]);

  if (!outfit) notFound();

  trackView(id);

  const isOwner = !!user && !!outfit.creatorId && user.id === outfit.creatorId;

  return (
    <Layout>
      {/* Hero media carousel */}
      <div className="relative aspect-[3/4] w-full bg-neutral-100">
        <MediaCarousel
          media={outfit.media}
          title={outfit.title}
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/25 pointer-events-none" />

        {/* Back button */}
        <a
          href="/explore"
          aria-label="Back to explore"
          className="absolute top-14 left-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-neutral-900 shadow-sm"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </a>

        {/* Save + manage buttons */}
        <div className="absolute top-14 right-4 z-20 flex flex-col items-end gap-2">
          <OutfitSaveButton outfitId={outfit.id} />
          {isOwner && <TakeDownButton outfitId={outfit.id} />}
        </div>

        {/* Hero bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 pointer-events-none">
          <h1 className="text-white text-2xl font-bold leading-tight mb-1">
            {outfit.title}
          </h1>
          <p className="text-white/60 text-xs font-medium mb-3">
            {outfit.items.length} pieces
            {outfit.media.length > 1 && ` · ${outfit.media.length} photos`}
          </p>
          <CreatorBadge
            name={outfit.creatorName}
            handle={outfit.creatorHandle}
            avatar={outfit.creatorAvatar}
            colorScheme="light"
          />
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {outfit.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>

        {/* Description */}
        <p className="text-neutral-500 text-sm leading-relaxed mb-8">
          {outfit.description}
        </p>

        {/* Product breakdown */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold text-neutral-900">The Breakdown</h2>
          <span className="text-xs text-neutral-400">{outfit.items.length} items</span>
        </div>

        <div className="flex flex-col gap-3">
          {outfit.items.map((item) => (
            <ProductCard key={item.id} item={item} outfitId={outfit.id} variant="list" />
          ))}
        </div>
      </div>
    </Layout>
  );
}
