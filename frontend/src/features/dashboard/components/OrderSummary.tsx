"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  BanknotesIcon,
  FunnelIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { DateRange } from "./DateRangeFilter";
import { fetchOverview } from "../dashboard.api";
import { OverviewData } from "../dashboard.types";
import { Skeleton } from "@/components/ui/Skeleton";

// â”€â”€ Period label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getPeriodLabel(range: DateRange): string {
  const fmt = (d: Date) => d.toLocaleString("default", { month: "short", year: "numeric" });
  switch (range.preset) {
    case "this_week":
    case "last_week":  return range.label;
    case "this_month":
    case "last_month": return fmt(range.start);
    case "this_year":  return String(range.start.getFullYear());
    default: {
      const s = fmt(range.start);
      const e = fmt(range.end);
      return s === e ? s : `${s} â€“ ${e}`;
    }
  }
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100 * 10) / 10;
}
function fmtAmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const CARD_STYLE = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-default)",
  boxShadow: "var(--shadow-card)",
} as const;

// â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrderSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl p-5" style={CARD_STYLE}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton rounded="rounded-lg" className="h-8 w-8" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Skeleton rounded="rounded-full" style={{ width: 150, height: 150, flexShrink: 0 }} />
            <div className="flex flex-col gap-3 flex-1">
              {[0, 1, 2].map((j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ Donut chart builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeDonutOption(center: string, segments: { label: string; value: number; color: string }[]) {
  return {
    tooltip: {
      trigger: "item",
      backgroundColor: "#1a1a2e",
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#e8e8f0", fontSize: 12 },
      formatter: (p: any) => `${p.marker} ${p.name}: <strong>${p.value}%</strong>`,
      extraCssText: "border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.35);",
    },
    graphic: {
      type: "text", left: "center", top: "middle",
      style: { text: center, fill: "#1a1a1a", fontSize: 18, fontWeight: "bold", textAlign: "center" },
    },
    series: [{
      type: "pie",
      radius: ["52%", "75%"],
      label: { show: false },
      emphasis: { scale: false },
      data: segments.map((s) => ({ value: s.value, name: s.label, itemStyle: { color: s.color } })),
    }],
  };
}

const GREEN  = "#0f8a3c";
const AMBER  = "#9e6c00";
const RED    = "#d32f2f";

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface OrderSummaryProps { range: DateRange }

export function OrderSummary({ range }: OrderSummaryProps) {
  const [data, setData]       = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOverview(range.start, range.end)
      .then(setData)
      .catch(() => setError("Failed to load summary"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime()]);

  const period = getPeriodLabel(range);

  if (loading) return <OrderSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        {error ?? "No data available."}
      </div>
    );
  }

  const fs = data.feeStatus     ?? { total: 0, fullyPaid: 0, partialPaid: 0, notPaid: 0, fullyPaidAmt: 0, partialPaidAmt: 0, notPaidAmt: 0 };
  const es = data.enquiryStatus  ?? { total: 0, converted: 0, inProgress: 0, notConverted: 0 };

  const activeBc = data.batchCategories ?? { freshers: 0, recent: 0, senior: 0 };
  const currentYear = new Date().getFullYear();

  // â”€â”€ Fee card segments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const feeSegs = [
    { label: "Fully Paid",   value: pct(fs.fullyPaid,   fs.total), count: fs.fullyPaid,   amt: fs.fullyPaidAmt,   color: GREEN },
    { label: "Partial Paid", value: pct(fs.partialPaid, fs.total), count: fs.partialPaid, amt: fs.partialPaidAmt, color: AMBER },
    { label: "Not Paid",     value: pct(fs.notPaid,     fs.total), count: fs.notPaid,     amt: fs.notPaidAmt,     color: RED   },
  ];

  // â”€â”€ Enquiry card segments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const enqSegs = [
    { label: "Converted (Enquiry → Admission)", value: pct(es.converted,     es.total), color: GREEN },
    { label: "In Progress (Follow-ups ongoing)", value: pct(es.inProgress,   es.total), color: AMBER },
    { label: "Not Converted / Lost",             value: pct(es.notConverted, es.total), color: RED   },
  ];

  const batchCats = [
    { label: String(currentYear),              sublabel: "(Freshers)",                       count: activeBc.freshers, color: "#1976d2" },
    { label: `${currentYear - 1} – 2022`, sublabel: "(Experienced / Recent Graduates)", count: activeBc.recent,   color: AMBER     },
    { label: "< 2022",                         sublabel: "(Senior / Alumni)",                count: activeBc.senior,   color: "#6d28d9" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* â”€â”€ Monthly Fee Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-xl p-5" style={CARD_STYLE}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#e3f0fc", boxShadow: "0 2px 8px 0 #1976d233" }}>
              <BanknotesIcon className="h-4 w-4" style={{ color: "#1976d2" }} />
            </div>
            <p className="type-h2" style={{ color: "var(--color-text-secondary)" }}>Monthly Fee Status</p>
          </div>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "#e3f0fc", color: "#1976d2", boxShadow: "0 1px 6px 0 #1976d240" }}>{period}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ReactECharts
              option={makeDonutOption(String(fs.total), feeSegs)}
              style={{ width: 150, height: 150 }}
              notMerge
            />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {feeSegs.map(({ label, count, amt, color, value }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color }}>
                    {count} <span className="font-normal text-[11px]" style={{ color: "var(--color-text-muted)" }}>students</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-1 flex-1 mr-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                  </div>
                  <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{fmtAmt(amt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Enquiry Conversion Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-xl p-5" style={CARD_STYLE}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#f5e6fb", boxShadow: "0 2px 8px 0 #9c27b033" }}>
              <FunnelIcon className="h-4 w-4" style={{ color: "#9c27b0" }} />
            </div>
            <p className="type-h2" style={{ color: "var(--color-text-secondary)" }}>Enquiry Conversion Status</p>
          </div>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "#f5e6fb", color: "#9c27b0", boxShadow: "0 1px 6px 0 #9c27b040" }}>{period}</span>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-shrink-0">
            <ReactECharts
              option={makeDonutOption(String(es.total), enqSegs)}
              style={{ width: 150, height: 150 }}
              notMerge
            />
          </div>
          <div className="flex flex-col gap-2">
            {enqSegs.map((s) => (
              <div key={s.label} className="flex items-start gap-2">
                <span className="mt-[3px] h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="type-label leading-snug" style={{ color: "var(--color-text-tertiary)" }}>
                  <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>{s.value}%</span> {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Placement Progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-xl p-5" style={CARD_STYLE}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#fff4e0", boxShadow: "0 2px 8px 0 #ff980033" }}>
              <BriefcaseIcon className="h-4 w-4" style={{ color: "#ff9800" }} />
            </div>
            <p className="type-h2" style={{ color: "var(--color-text-secondary)" }}>Batch Categories</p>
          </div>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "#fff4e0", color: "#ff9800", boxShadow: "0 1px 6px 0 #ff980040" }}>{period}</span>
        </div>
        <div className="flex flex-col gap-3">
          {batchCats.map(({ label, sublabel, count, color }) => (
            <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {label}
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sublabel}</span>
              </div>
              <span
                className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                style={{ background: color, boxShadow: `0 2px 6px ${color}66` }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
