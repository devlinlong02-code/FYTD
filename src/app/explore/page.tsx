import Layout from "@/components/Layout";
import ExploreClient from "./ExploreClient";
import { getOutfits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getSession } from "@/lib/dal";

export default async function ExplorePage() {
  const [allOutfits, savedIds, user] = await Promise.all([
    getOutfits(),
    getSavedOutfitIds(),
    getSession(),
  ]);

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Explore</span>
      </div>
      <div className="px-4 py-4 pb-8">
        <ExploreClient
          outfits={allOutfits}
          savedIds={savedIds}
          isAuthenticated={!!user}
        />
      </div>
    </Layout>
  );
}
