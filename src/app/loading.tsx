import Layout from "@/components/Layout";
import FeedSkeleton from "@/components/FeedSkeleton";

export default function HomeLoading() {
  return (
    <Layout>
      {/* Header placeholder */}
      <div
        className="sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between"
        style={{
          background: "rgba(250,250,250,0.98)",
          backdropFilter: "blur(12px)",
          borderBottom: "0.5px solid rgba(10,10,10,0.06)",
        }}
      >
        <div className="skeleton rounded w-12 h-6" />
        <div className="flex items-center gap-2">
          <div className="skeleton rounded-full w-8 h-8" />
          <div className="skeleton rounded-full w-8 h-8" />
        </div>
      </div>
      {/* Tab bar placeholder */}
      <div className="flex gap-6 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(10,10,10,0.06)" }}>
        <div className="skeleton rounded w-14 h-4" />
        <div className="skeleton rounded w-20 h-4" />
      </div>
      <FeedSkeleton />
    </Layout>
  );
}
