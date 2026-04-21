"use client";

import { useState, useEffect } from "react";
import { InstitutionOverview } from "./components/InstitutionOverview";
import { OrderSummary } from "./components/OrderSummary";
import { DateRangeFilter, DateRange, buildRange } from "./components/DateRangeFilter";
import { DashboardSkeleton } from "./components/DashboardSkeleton";

export function DashboardClient() {
  const [range, setRange] = useState<DateRange>(() => buildRange("this_month"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col gap-4">

      {/* INSTITUTION OVERVIEW */}
      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="type-h3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Institution Overview
          </h2>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <InstitutionOverview range={range} />
      </section>

      {/* ORDER SUMMARY */}
      <section style={{marginBottom:"35px"}}>
        {/* <h2 className="mb-3 type-h3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Order Summary
        </h2> */}
        <OrderSummary range={range} />
      </section>
    </div>
  );
}