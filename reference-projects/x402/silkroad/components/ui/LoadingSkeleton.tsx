'use client';

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-800" />
      
      {/* Content skeleton */}
      <div className="p-4">
        <div className="mb-2">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
        </div>
        
        <div className="mb-4 space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
        </div>
        
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12" />
          </div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListingListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900 animate-pulse"
        >
          <div className="flex items-center gap-1 flex-shrink-0 w-8" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
          </div>
          <div className="hidden sm:block">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
          </div>
          <div className="hidden md:block">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </div>
          <div className="hidden lg:block">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-3" />
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-950">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
      </div>
    </div>
  );
}

