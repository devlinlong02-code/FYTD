import { getSavedOutfitIds } from "@/app/actions/saved";
import { getSession } from "@/lib/dal";
import DbSaveButton from "@/components/DbSaveButton";

export default async function OutfitSaveButton({ outfitId }: { outfitId: string }) {
  const [savedIds, user] = await Promise.all([getSavedOutfitIds(), getSession()]);
  return (
    <DbSaveButton
      outfitId={outfitId}
      initialSaved={savedIds.includes(outfitId)}
      isAuthenticated={!!user}
    />
  );
}
