import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:span-8 lg:span-7">
          <CardSkeleton className="h-64" />
        </div>
        <div className="md:span-4 lg:span-3">
          <CardSkeleton className="h-48" />
        </div>
        <div className="md:span-4 lg:span-5">
          <CardSkeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={["rounded-xl border border-border bg-white shadow-sm", className].join(' ')}>
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </div>
  );
}
