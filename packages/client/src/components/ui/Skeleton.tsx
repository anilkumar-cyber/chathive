import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-gray-200 dark:bg-white/10", className)} />;
}

export function ConversationSkeletonList() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-2">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageSkeletonList() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={clsx("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
          <Skeleton className={clsx("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-40")} />
        </div>
      ))}
    </div>
  );
}
