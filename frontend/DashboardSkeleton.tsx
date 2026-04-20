import { Skeleton } from "@/components/ui/Skeleton";

// ── Institution Overview skeleton ─────────────────────────────────────────────
function InstitutionOverviewSkeleton() {
  const cardStyle = {
    background: "var(--color-bg-surface)",
    border: "1px solid var(--color-border-default)",
    boxShadow: "var(--shadow-card)",
  };
  return (
    <div className="flex flex-col gap-4">
      {/* 6 KPI cards */}
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4" style={cardStyle}>
            <Skeleton rounded="rounded-lg" className="mb-2 h-8 w-8" />
            <Skeleton className="mt-2 h-7 w-20" />
            <Skeleton className="mt-1.5 h-3 w-full" />
            <Skeleton className="mt-1 h-2.5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-12 rounded-full" />
          </div>
        ))}
      </div>

      {/* Trend + Program charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl p-5" style={cardStyle}>
          <Skeleton className="mb-3 h-4 w-36" />
          <Skeleton className="rounded-lg" style={{ height: 248 }} />
        </div>
        <div className="col-span-1 rounded-xl p-5" style={cardStyle}>
          <Skeleton className="mb-3 h-4 w-44" />
          <Skeleton className="rounded-lg" style={{ height: 248 }} />
        </div>
      </div>
    </div>
  );
}

// ── Order Summary skeleton ────────────────────────────────────────────────────
function DonutCardSkeleton() {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton rounded="rounded-full" style={{ width: 150, height: 150, flexShrink: 0 }} />
        <div className="flex flex-col gap-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton rounded="rounded-full" className="h-2.5 w-2.5 flex-shrink-0" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderSummarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <DonutCardSkeleton />
      <DonutCardSkeleton />
      <DonutCardSkeleton />
    </div>
  );
}

// ── Dashboard full skeleton ───────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Section label placeholder */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-40 rounded-lg" />
      </div>

      {/* Institution Overview */}
      <section>
        <Skeleton className="mb-3 h-3 w-40" />
        <InstitutionOverviewSkeleton />
      </section>

      {/* Order Summary */}
      <section>
        <Skeleton className="mb-3 h-3 w-28" />
        <OrderSummarySkeleton />
      </section>
    </div>
  );
}
