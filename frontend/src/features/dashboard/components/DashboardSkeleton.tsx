import { Skeleton } from "@/components/ui/Skeleton";

const cardStyle = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-default)",
  boxShadow: "var(--shadow-card)",
};

// ══════════════════════════════════════════════════════════════════════════════
// DESKTOP SKELETON  (hidden on mobile, shown sm and above)
// ══════════════════════════════════════════════════════════════════════════════

function DesktopInstitutionSkeleton() {
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

function DesktopDonutCardSkeleton() {
  return (
    <div className="rounded-xl p-5" style={cardStyle}>
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

function DesktopOrderSummarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <DesktopDonutCardSkeleton />
      <DesktopDonutCardSkeleton />
      <DesktopDonutCardSkeleton />
    </div>
  );
}

function DesktopDashboardSkeleton() {
  return (
    <div className="hidden sm:flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-40 rounded-lg" />
      </div>
      <section>
        <Skeleton className="mb-3 h-3 w-40" />
        <DesktopInstitutionSkeleton />
      </section>
      <section>
        <Skeleton className="mb-3 h-3 w-28" />
        <DesktopOrderSummarySkeleton />
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE SKELETON  (shown on mobile, hidden sm and above)
// ══════════════════════════════════════════════════════════════════════════════

function MobileDashboardSkeleton() {
  return (
    <div className="flex sm:hidden flex-col gap-5 px-1">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* KPI cards — 2 columns */}
      <section>
        <Skeleton className="mb-3 h-3 w-36" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4" style={cardStyle}>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton rounded="rounded-lg" className="h-7 w-7 flex-shrink-0" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-1.5 h-2.5 w-full" />
              <Skeleton className="mt-1 h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Trend chart — full width */}
      <div className="rounded-xl p-4" style={cardStyle}>
        <Skeleton className="mb-3 h-3.5 w-36" />
        <Skeleton className="rounded-lg w-full" style={{ height: 180 }} />
      </div>

      {/* Program chart — full width */}
      <div className="rounded-xl p-4" style={cardStyle}>
        <Skeleton className="mb-3 h-3.5 w-44" />
        <Skeleton className="rounded-lg w-full" style={{ height: 180 }} />
      </div>

      {/* Order Summary label */}
      <section>
        <Skeleton className="mb-3 h-3 w-28" />
        {/* 3 donut cards stacked */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl p-4 mb-3" style={cardStyle}>
            <Skeleton className="mb-3 h-3.5 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton rounded="rounded-full" style={{ width: 90, height: 90, flexShrink: 0 }} />
              <div className="flex flex-col gap-2.5 flex-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton rounded="rounded-full" className="h-2 w-2 flex-shrink-0" />
                    <Skeleton className="h-2.5 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export function DashboardSkeleton() {
  return (
    <>
      <MobileDashboardSkeleton />
      <DesktopDashboardSkeleton />
    </>
  );
}