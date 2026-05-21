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
      <div className="px-4 pt-14 pb-4">
        <ExploreClient
          outfits={allOutfits}
          savedIds={savedIds}
          isAuthenticated={!!user}
        />
      </div>
    </Layout>
  );
}
