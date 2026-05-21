import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Layout from "@/components/Layout";
import DeleteButton from "./DeleteButton";
import { getCreatorOutfits } from "@/app/actions/outfits";
import { getSession, isCreator } from "@/lib/dal";

export default async function ManageOutfitsPage() {
  const user = await getSession();
  if (!user) redirect("/auth/login?next=/admin/outfits");

  const creator = await isCreator();
  if (!creator) redirect("/account");

  const outfits = await getCreatorOutfits();

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-xl tracking-tight text-neutral-900">My Outfits</span>
        <Link
          href="/admin/upload"
          className="flex items-center gap-1.5 text-xs font-semibold bg-neutral-900 text-white px-3 py-1.5 rounded-xl hover:bg-neutral-700 transition-colors"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Outfit
        </Link>
      </div>

      <div className="px-4 py-5">
        {outfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm font-medium mb-1">No outfits yet</p>
            <p className="text-neutral-400 text-sm mb-5">Upload your first fit to get started.</p>
            <Link
              href="/admin/upload"
              className="text-sm font-semibold bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Upload Outfit
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="flex gap-3 bg-white rounded-2xl border border-neutral-100 p-3 items-center">
                <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                  <Image src={outfit.image} alt={outfit.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{outfit.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{outfit.items.length} items · {outfit.tags.slice(0, 2).join(", ")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/outfit/${outfit.id}/edit`}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                    aria-label="Edit outfit"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                  <DeleteButton id={outfit.id} title={outfit.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
