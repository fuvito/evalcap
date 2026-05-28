export function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-slate-700 rounded animate-pulse ${className}`}></div>
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <SkeletonText className="h-5 w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonText key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export function SkeletonButton() {
  return <div className="bg-gray-200 dark:bg-slate-700 rounded-lg h-10 w-full animate-pulse"></div>
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <SkeletonText className="h-8 w-1/3" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
