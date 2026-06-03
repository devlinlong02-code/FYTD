import { notFound } from "next/navigation";
import { getOutfitById } from "@/app/actions/outfits";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getSavedItemIds } from "@/app/actions/saved-items";
import { trackView } from "@/app/actions/views";
import { getIsLiked } from "@/app/actions/likes";
import { isFollowing } from "@/app/actions/follows";
import { getSession } from "@/lib/dal";
import { getProfile } from "@/lib/dal";
import Layout from "@/components/Layout";
import OutfitDetailClient from "./OutfitDetailClient";

export default async function OutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [outfit, user, savedOutfitIds, savedItemIds] = await Promise.all([
    getOutfitById(id),
    getSession(),
    getSavedOutfitIds(),
    getSavedItemIds(id),
  ]);

  if (!outfit) notFound();

  await trackView(id);

  const isOwner = !!user && !!outfit.creatorId && user.id === outfit.creatorId;

  const [initialLiked, isFollowingCreator, profile] = await Promise.all([
    outfit.creatorId ? getIsLiked(id) : Promise.resolve(false),
    outfit.creatorId ? isFollowing(outfit.creatorId) : Promise.resolve(false),
    user ? getProfile() : Promise.resolve(null),
  ]);

  return (
    <Layout>
      <OutfitDetailClient
        outfit={outfit}
        isOwner={isOwner}
        initialSaved={savedOutfitIds.includes(outfit.id)}
        isAuthenticated={!!user}
        initialSavedItemIds={savedItemIds}
        initialLiked={initialLiked}
        isFollowingCreator={isFollowingCreator}
        currentUserId={user?.id ?? null}
        currentUserUsername={profile?.username ?? undefined}
        currentUserAvatar={profile?.avatar_url ?? null}
      />
    </Layout>
  );
}
