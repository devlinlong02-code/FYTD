export default function OutfitLoading() {
  return (
    <div className="max-w-md mx-auto">
      {/* Hero image */}
      <div className="skeleton w-full" style={{ aspectRatio: "3/4" }} />
      {/* Social bar */}
      <div className="flex items-center gap-5 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(10,10,10,0.08)" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded w-10 h-5" />
        ))}
      </div>
      {/* Details */}
      <div className="px-4 pt-4 space-y-3">
        <div className="skeleton rounded w-3/4 h-5" />
        <div className="skeleton rounded w-1/2 h-4" />
        <div className="flex gap-3">
          <div className="skeleton rounded w-16 h-3" />
          <div className="skeleton rounded w-16 h-3" />
        </div>
      </div>
      {/* Section divider */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex-1 h-px" style={{ background: "rgba(10,10,10,0.08)" }} />
        <div className="skeleton rounded w-24 h-3" />
        <div className="flex-1 h-px" style={{ background: "rgba(10,10,10,0.08)" }} />
      </div>
      {/* Breakdown items */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-4" style={{ borderBottom: "0.5px solid rgba(10,10,10,0.08)" }}>
          <div className="skeleton rounded shrink-0" style={{ width: 80, height: 80, borderRadius: 4 }} />
          <div className="flex-1 space-y-2">
            <div className="skeleton rounded w-16 h-3" />
            <div className="skeleton rounded w-36 h-4" />
            <div className="skeleton rounded w-14 h-4" />
            <div className="skeleton rounded w-20 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
