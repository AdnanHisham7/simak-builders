import { cn } from "@/lib/cn";

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse rounded-md bg-slate-200/70", className)} />
);

export const SkeletonStatCards: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="rounded-console border border-console-border bg-console-surface p-5 shadow-console"
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-7 w-24" />
        <Skeleton className="mt-3 h-3 w-16" />
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 5,
}) => (
  <div className="overflow-hidden rounded-console border border-console-border bg-console-surface shadow-console">
    <div className="flex gap-4 border-b border-console-border px-5 py-3">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-3 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex items-center gap-4 border-b border-console-border px-5 py-4 last:border-b-0"
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-3.5 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "rounded-console border border-console-border bg-console-surface p-5 shadow-console",
      className,
    )}
  >
    <Skeleton className="h-4 w-32" />
    <Skeleton className="mt-4 h-3 w-full" />
    <Skeleton className="mt-2 h-3 w-5/6" />
    <Skeleton className="mt-2 h-3 w-2/3" />
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "rounded-console border border-console-border bg-console-surface p-5 shadow-console",
      className,
    )}
  >
    <Skeleton className="h-4 w-40" />
    <Skeleton className="mt-6 h-56 w-full" />
  </div>
);

export default Skeleton;
