export default function SkeletonCard() {
  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-[2/3] w-full bg-charcoal-800/60" />
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="h-4 bg-charcoal-800 rounded w-4/5" />
        <div className="flex gap-2">
          <div className="h-3 bg-charcoal-800 rounded w-1/4" />
          <div className="h-3 bg-charcoal-800 rounded w-1/4" />
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="h-3 bg-charcoal-800 rounded w-12" />
          <div className="h-3 bg-charcoal-800 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
