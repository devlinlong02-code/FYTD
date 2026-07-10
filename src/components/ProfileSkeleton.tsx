export default function ProfileSkeleton() {
  return (
    <div className="px-4 pb-8">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-8 pb-6 gap-3">
        <div className="skeleton rounded-full w-20 h-20" />
        <div className="skeleton rounded-lg w-32 h-5" />
        <div className="skeleton rounded-lg w-20 h-3.5" />
        <div className="skeleton rounded-xl w-48 h-3.5" />
      </div>
      {/* Stats row */}
      <div className="flex justify-center gap-8 pb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="skeleton rounded w-8 h-5" />
            <div className="skeleton rounded w-10 h-3" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex border-b border-neutral-100 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex justify-center py-3">
            <div className="skeleton rounded w-12 h-3.5" />
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton rounded-2xl aspect-[3/4]" />
        ))}
      </div>
    </div>
  );
}
