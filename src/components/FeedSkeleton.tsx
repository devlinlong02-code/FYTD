export default function FeedSkeleton() {
  return (
    <div className="pb-24">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          {/* Full-bleed card */}
          <div className="skeleton w-full" style={{ aspectRatio: "4/5" }} />
          {/* Social bar */}
          <div className="flex items-center gap-5 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(10,10,10,0.06)" }}>
            <div className="skeleton rounded w-14 h-4" />
            <div className="skeleton rounded w-10 h-4" />
            <div className="skeleton rounded w-4 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
