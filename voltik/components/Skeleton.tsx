/* Reusable skeleton primitives + composed shapes for common UI surfaces. */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-elev/60 rounded-xl ${className}`}
      aria-hidden
    >
      <span
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgb(var(--ink) / 0.06) 50%, transparent)'
        }}
      />
    </div>
  );
}

/** Skeleton sized to a ProductCard. */
export function ProductCardSkeleton() {
  return (
    <div className="card p-3 sm:p-4 flex flex-col" aria-busy>
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-3 w-1/3 mt-4" />
      <Skeleton className="h-4 w-4/5 mt-2" />
      <Skeleton className="h-3 w-1/2 mt-2" />
      <div className="flex items-end justify-between mt-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-16 !rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton sized to an order / table row in dashboards. */
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3" aria-busy>
      <Skeleton className="h-10 w-10 !rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 !rounded-full" />
    </div>
  );
}

/** Skeleton for a KPI tile (admin / account). */
export function KpiSkeleton() {
  return (
    <div className="card p-5" aria-busy>
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-7 w-24 mt-4" />
      <Skeleton className="h-3 w-16 mt-2" />
    </div>
  );
}
