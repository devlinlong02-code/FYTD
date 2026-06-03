import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Layout from "@/components/Layout";
import { getAnalytics } from "@/app/actions/analytics";
import { getSession } from "@/lib/dal";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-neutral-900">{value.toLocaleString()}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/auth/login?next=/analytics");

  const data = await getAnalytics();

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <span className="font-bold text-xl tracking-tight text-neutral-900">Analytics</span>
      </div>

      <div className="px-4 py-5 flex flex-col gap-6">

        {/* Overview stats */}
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Overview</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Views" value={data.totalViews} />
            <StatCard label="Saves" value={data.totalSaves} />
            <StatCard label="Clicks" value={data.totalClicks} />
          </div>
        </div>

        {/* Outfit performance */}
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Outfit Performance</p>
          {data.outfitStats.length === 0 ? (
            <div className="bg-neutral-50 rounded-2xl px-4 py-8 text-center">
              <p className="text-neutral-400 text-sm">No outfits yet.</p>
              <Link href="/admin/upload" className="mt-2 inline-block text-sm font-semibold text-neutral-900 underline underline-offset-2">
                Upload your first outfit
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.outfitStats.map((outfit) => (
                <Link key={outfit.id} href={`/outfit/${outfit.id}`} className="flex gap-3 bg-white rounded-2xl border border-neutral-100 p-3 items-center">
                  <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                    {outfit.image_url ? (
                      <Image src={outfit.image_url} alt={outfit.title} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full bg-neutral-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{outfit.title}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[10px] text-neutral-400">{outfit.views} views</span>
                      <span className="text-[10px] text-neutral-400">{outfit.saves} saves</span>
                    </div>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-neutral-300 shrink-0">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top clicked items */}
        {data.topItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Top Clicked Items</p>
            <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
              {data.topItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-bold text-neutral-300 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-400">{item.brand} · {item.category}</p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 shrink-0">{item.clicks} clicks</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.outfitStats.length === 0 && data.topItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-neutral-400 text-sm">Analytics data will appear here once you have published outfits and visitors start engaging.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
