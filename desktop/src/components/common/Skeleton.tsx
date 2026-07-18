/** Reusable shimmer loading skeleton placeholder. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-hover/50 ${className}`}
      style={{ background: "linear-gradient(90deg, #1e2a4a 25%, #2a3a5a 50%, #1e2a4a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }}
    />
  );
}

/** Chat message skeleton — mimics a message bubble while loading. */
export function ChatSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-1 max-w-[70%]">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
        <Skeleton className="h-3 w-5/6 rounded-lg" />
      </div>
    </div>
  );
}

/** Card grid skeleton for project/template lists. */
export function CardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface-alt">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="h-5 w-2/3 rounded mb-2" />
      <Skeleton className="h-3 w-full rounded mb-1" />
      <Skeleton className="h-3 w-4/5 rounded" />
    </div>
  );
}
