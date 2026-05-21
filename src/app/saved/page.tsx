import Layout from "@/components/Layout";
import OutfitCard from "@/components/OutfitCard";
import Link from "next/link";
import { getSavedOutfitIds } from "@/app/actions/saved";
import { getOutfits } from "@/app/actions/outfits";
import { getSession } from "@/lib/dal";

export default async function SavedPage() {
  const [savedIds, allOutfits, user] = await Promise.all([
    getSavedOutfitIds(),
    getOutfits(),
    getSession(),
  ]);

  if (!user) {
    return (
      <Layout>
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
          <span className="font-bold text-xl tracking-tight text-neutral-900">Saved</span>
        </div>
        <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="text-neutral-400">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Build your fit collection</h2>
          <p className="text-sm text-neutral-400 mb-8">Create an account to save outfits and come back to them anytime.</p>
          <Link
            href="/auth/signup"
            className="w-full max-w-xs py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold text-center hover:bg-neutral-700 transition-colors"
          >
            Create account
          </Link>
          <Link href="/auth/login" className="mt-3 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Log in
          </Link>
        </div>
      </Layout>
    );
  }

  const savedOutfits = allOutfits.filter((o) => savedIds.includes(o.id));

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Saved</span>
      </div>
      <div className="px-4 pt-5 pb-4">
        <p className="text-neutral-400 text-sm mb-5">
          {savedOutfits.length === 0
            ? "Your saved outfits will appear here."
            : `${savedOutfits.length} outfit${savedOutfits.length !== 1 ? "s" : ""} saved`}
        </p>

        {savedOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm font-medium mb-1">Nothing saved yet</p>
            <p className="text-neutral-400 text-sm mb-6">Tap the bookmark on any outfit to save it.</p>
            <Link
              href="/explore"
              className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Explore outfits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                savedIds={savedIds}
                isAuthenticated={true}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
