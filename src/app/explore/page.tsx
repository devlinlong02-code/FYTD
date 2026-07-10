import Layout from "@/components/Layout";
import ExploreClient from "./ExploreClient";
import { getTodaysFits, getMostSavedFits } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getSession } from "@/lib/dal";
import { getRisingCreators } from "@/app/actions/follows";

export default async function ExplorePage() {
  const user = await getSession();

  const [todaysFits, mostSavedFits, savedIds, risingCreators] = await Promise.all([
    getTodaysFits(12),
    getMostSavedFits(8),
    getSavedOutfitIds(),
    getRisingCreators(user?.id ?? null, 5),
  ]);

  return (
    <Layout>
      <ExploreClient
        risingCreators={risingCreators}
        todaysFits={todaysFits}
        mostSavedFits={mostSavedFits}
        savedIds={savedIds}
        isAuthenticated={!!user}
        currentUserId={user?.id ?? null}
      />
    </Layout>
  );
}
