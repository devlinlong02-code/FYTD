import Layout from "@/components/Layout";

export default function ExploreLoading() {
  return (
    <Layout>
      <div
        className="sticky top-0 z-30 px-4 py-3.5"
        style={{
          background: "rgba(250,250,250,0.98)",
          backdropFilter: "blur(12px)",
          borderBottom: "0.5px solid rgba(10,10,10,0.06)",
        }}
      >
        <div className="skeleton rounded w-16 h-6" />
      </div>
      <div className="px-4 py-4 pb-8 space-y-4">
        {/* Search bar */}
        <div className="skeleton rounded-xl w-full h-10" />
        {/* Section divider */}
        <div className="skeleton rounded w-32 h-3 mx-auto" />
        {/* Creator rows */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="skeleton rounded-full w-11 h-11 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton rounded w-32 h-4" />
              <div className="skeleton rounded w-20 h-3" />
            </div>
            <div className="skeleton rounded-full w-16 h-7" />
          </div>
        ))}
        {/* Section divider */}
        <div className="skeleton rounded w-24 h-3 mx-auto" />
        {/* Horizontal scroll placeholder */}
        <div className="flex gap-2.5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded shrink-0 w-[140px]" style={{ aspectRatio: "3/4" }} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
