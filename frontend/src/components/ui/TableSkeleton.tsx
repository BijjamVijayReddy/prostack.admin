import { Skeleton } from "@/components/ui/Skeleton";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 8, cols = 7 }: TableSkeletonProps) {
  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{
        backgroundColor: "#f3f3f3",
        border: "1px solid var(--color-border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--color-divider)" }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${80 + (i % 3) * 20}px`, flexShrink: 0 }} />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-5 py-4"
          style={{ borderBottom: r < rows - 1 ? "1px solid var(--color-divider-light)" : "none" }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4"
              style={{ width: `${70 + ((r + c) % 4) * 18}px`, flexShrink: 0 }}
            />
          ))}
        </div>
      ))}

      {/* Pagination footer */}
      <div
        className="flex items-center justify-end gap-4 px-5 py-3"
        style={{ borderTop: "1px solid var(--color-divider)" }}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-14 rounded-md" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
    </div>
  );
}