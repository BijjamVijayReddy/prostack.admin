"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ── Count-up animation hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 900): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return count;
}
import ReactECharts from "echarts-for-react";
import {
  AcademicCapIcon,
  UserPlusIcon,
  BriefcaseIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { FaJava, FaPython, FaReact, FaNodeJs } from "react-icons/fa";
import { SiMongodb, SiSpringboot } from "react-icons/si";
import type { IconType } from "react-icons";
import { DateRange } from "./DateRangeFilter";
import { fetchOverview } from "../dashboard.api";
import { OverviewData } from "../dashboard.types";
import { Skeleton } from "@/components/ui/Skeleton";

// ── Period label from range ───────────────────────────────────────────────────
function getPeriodLabel(range: DateRange): string {
  const fmt = (d: Date) =>
    d.toLocaleString("default", { month: "short", year: "numeric" });
  switch (range.preset) {
    case "this_week":
    case "last_week":
      return range.label;
    case "this_month":
    case "last_month":
      return fmt(range.start);
    case "this_year":
      return String(range.start.getFullYear());
    default: {
      const s = fmt(range.start);
      const e = fmt(range.end);
      return s === e ? s : `${s} – ${e}`;
    }
  }
}

function getCompareLabel(range: DateRange): string {
  switch (range.preset) {
    case "this_week":  return "Last Week";
    case "last_week":  return "Prev Week";
    case "this_month": return "Last Month";
    case "last_month": return "Prev Month";
    case "this_year":  return "Last Year";
    default:           return "Prev Period";
  }
}

// ── Chart palette ─────────────────────────────────────────────────────────────
const C_ADMISSIONS = typeof window !== "undefined"
  ? getComputedStyle(document.documentElement).getPropertyValue("--color-text-success").trim() || "#0f8a3c"
  : "#0f8a3c";
const C_ENQUIRIES  = "#9c27b0";
const CHART_AXIS   = "#717171";
const CHART_SPLIT  = "#e8e8e8";

const CARD_STYLE = {
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-default)",
  boxShadow: "var(--shadow-card)",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function pctChange(current: number, prev: number): { value: string; up: boolean } {
  if (prev === 0) return { value: "N/A", up: current >= 0 };
  const diff = ((current - prev) / prev) * 100;
  return { value: `${Math.abs(diff).toFixed(1)}%`, up: diff >= 0 };
}

function ptDiff(current: number, prev: number): { value: string; up: boolean } {
  const diff = current - prev;
  return { value: `${Math.abs(diff)}%`, up: diff >= 0 };
}

// ── Course brand icon map ─────────────────────────────────────────────────────
interface CourseStyle { color: string; bg: string; BrandIcon: IconType }
const COURSE_STYLES: Record<string, CourseStyle> = {
  "Java Full Stack":   { color: "#e53935", bg: "#fde8e8", BrandIcon: SiSpringboot },
  "Python Full Stack": { color: "#1976d2", bg: "#e3f0fc", BrandIcon: FaPython     },
  "MERN Stack":        { color: "#43a047", bg: "#e5f5ec", BrandIcon: SiMongodb    },
  "React JS":          { color: "#61dafb", bg: "#e0f7fa", BrandIcon: FaReact      },
  "Java":              { color: "#bf360c", bg: "#fbe9e7", BrandIcon: FaJava       },
  "Python":            { color: "#f9a825", bg: "#fffde7", BrandIcon: FaPython     },
  "Node JS":           { color: "#43a047", bg: "#e5f5ec", BrandIcon: FaNodeJs     },
};
const FALLBACK_COLORS = [
  { color: "#7c3aed", bg: "#ede9fe" },
  { color: "#0284c7", bg: "#e0f2fe" },
  { color: "#d97706", bg: "#fef3c7" },
  { color: "#dc2626", bg: "#fee2e2" },
];
function getCourseStyle(name: string, idx: number): CourseStyle {
  if (COURSE_STYLES[name]) return COURSE_STYLES[name];
  const fb = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  return { ...fb, BrandIcon: FaReact };
}

// ── Inline loading skeleton ───────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4" style={CARD_STYLE}>
            <Skeleton rounded="rounded-lg" className="mb-2 h-8 w-8" />
            <Skeleton className="mt-2 h-7 w-20" />
            <Skeleton className="mt-1.5 h-3 w-full" />
            <Skeleton className="mt-2 h-5 w-40 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl p-5" style={CARD_STYLE}>
          <Skeleton className="mb-3 h-4 w-36" />
          <Skeleton className="rounded-lg" style={{ height: 248 }} />
        </div>
        <div className="col-span-1 rounded-xl p-5" style={CARD_STYLE}>
          <Skeleton className="mb-4 h-4 w-44" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton rounded="rounded-md" className="h-6 w-6 shrink-0" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface InstitutionOverviewProps { range: DateRange }

export function InstitutionOverview({ range }: InstitutionOverviewProps) {
  const [data, setData]           = useState<OverviewData | null>(null);
  const [yearData, setYearData]   = useState<OverviewData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Fetch range-filtered data (for all cards except Total Students)
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOverview(range.start, range.end)
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime()]);

  // Fetch full-year data — Total Students card is always year-scoped, never changes with filter
  useEffect(() => {
    const yr = range.start.getFullYear();
    const yearStart = new Date(yr, 0, 1);
    const yearEnd   = new Date(yr, 11, 31);
    fetchOverview(yearStart, yearEnd).then(setYearData).catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getFullYear()]);

  // ── useMemo MUST be before any conditional returns (Rules of Hooks) ──────────
  const trendOption = useMemo(() => ({
    grid: { left: 48, right: 20, bottom: 48, top: 16 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1a1a2e",
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#e8e8f0", fontSize: 12 },
      axisPointer: { lineStyle: { color: "rgba(255,255,255,0.15)", type: "dashed" } },
      extraCssText: "border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.35);",
    },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12, color: CHART_AXIS },
    },
    xAxis: {
      type: "category",
      data: data?.trendLabels ?? [],
      axisLine: { lineStyle: { color: CHART_SPLIT } },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: CHART_AXIS },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 11, color: CHART_AXIS },
      splitLine: { lineStyle: { color: CHART_SPLIT } },
    },
    series: [
      {
        name: "New Admissions",
        type: "line",
        smooth: true,
        data: data?.trendAdmissions ?? [],
        lineStyle: { color: C_ADMISSIONS, width: 2 },
        itemStyle: { color: C_ADMISSIONS },
        areaStyle: { color: "rgba(15,138,60,0.08)" },
        symbol: "circle",
        symbolSize: 5,
      },
      {
        name: "Enquiries",
        type: "line",
        smooth: true,
        data: data?.trendEnquiries ?? [],
        lineStyle: { color: C_ENQUIRIES, width: 2 },
        itemStyle: { color: C_ENQUIRIES },
        areaStyle: { color: "rgba(156,39,176,0.08)" },
        symbol: "circle",
        symbolSize: 5,
      },
    ],
  }), [data?.trendLabels, data?.trendAdmissions, data?.trendEnquiries]);

  // ── Animated KPI numbers — must be before any conditional returns ──────────
  const animTotalStudents  = useCountUp(data?.totalStudents  ?? 0);
  const animNewAdmissions  = useCountUp(data?.newAdmissions  ?? 0);
  const animStudentsPlaced = useCountUp(data?.studentsPlaced ?? 0);
  const animFeeCollection  = useCountUp(data?.feeCollectionPct ?? 0);

  const period       = getPeriodLabel(range);
  const compareLabel = getCompareLabel(range);

  if (loading) return <OverviewSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error ?? "No data available."}
      </div>
    );
  }

  // ── KPI config ──────────────────────────────────────────────────────────────
  const selectedYear = range.start.getFullYear();
  const kpis = [
    {
      label:        "Total Students",
      value:        animTotalStudents.toLocaleString("en-IN"),
      color:        "#1976d2",
      bg:           "#e3f0fc",
      Icon:         AcademicCapIcon,
      badgeLabel:   `${selectedYear}`,
      compareLabel: "last year",
      showCompare:  false,
      compare:      pctChange(data.totalStudents, data.prevTotalStudents),
    },
    {
      label:        "New Admissions",
      value:        animNewAdmissions.toLocaleString("en-IN"),
      color:        "#0f8a3c",
      bg:           "#e5f5ec",
      Icon:         UserPlusIcon,
      badgeLabel:   period,
      compareLabel: compareLabel,
      showCompare:  true,
      compare:      pctChange(data.newAdmissions, data.prevNewAdmissions),
    },
    {
      label:        "Students Placed",
      value:        animStudentsPlaced.toLocaleString("en-IN"),
      color:        "#ff9800",
      bg:           "#fff4e0",
      Icon:         BriefcaseIcon,
      badgeLabel:   period,
      compareLabel: compareLabel,
      showCompare:  true,
      compare:      pctChange(data.studentsPlaced, data.prevStudentsPlaced),
    },
    {
      label:        "Fee Collection",
      value:        `${animFeeCollection}%`,
      color:        "#0f8a3c",
      bg:           "#e5f5ec",
      Icon:         BanknotesIcon,
      badgeLabel:   period,
      compareLabel: compareLabel,
      showCompare:  true,
      compare:      ptDiff(data.feeCollectionPct, data.prevFeeCollectionPct),
    },
  ];

  // ── Top 6 courses — always show all known courses, fill missing with 0 ──────
  const ALL_COURSES = ["Java Full Stack", "Python Full Stack", "MERN Stack", "React JS", "Java", "Python"];
  const enrollmentMap = Object.fromEntries(data.courseEnrollment.map(({ course, count }) => [course, count]));
  const topCourses = ALL_COURSES.map((course) => ({ course, count: enrollmentMap[course] ?? 0 }));
  const totalEnrolled = topCourses.reduce((s, c) => s + c.count, 0) || 1;

  // ── Highest / Lowest admission month — always from full-year data ───────────
  const yearTrendPairs = (yearData?.trendLabels ?? []).map((label, i) => ({
    label,
    count: yearData?.trendAdmissions?.[i] ?? 0,
  })).filter((p) => p.count > 0);

  const highMonth = yearTrendPairs.length
    ? yearTrendPairs.reduce((a, b) => (b.count > a.count ? b : a))
    : null;
  const lowMonth = yearTrendPairs.length
    ? yearTrendPairs.reduce((a, b) => (b.count < a.count ? b : a))
    : null;

  return (
    <div className="flex flex-col gap-4">

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, bg, Icon, badgeLabel, compareLabel: cardCompareLabel, showCompare, compare }) => (
          <div key={label} className="rounded-xl p-4" style={CARD_STYLE}>
            <div className="mb-2 flex items-center justify-between">
              <div
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: bg, boxShadow: `0 2px 8px 0 ${color}33` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: bg, color, boxShadow: `0 1px 6px 0 ${color}40` }}
              >
                {badgeLabel}
              </span>
            </div>

            <p className="text-2xl font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
              {value}
            </p>
            <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </p>

            {/* Compare badge OR highest/lowest admission month (Total Students card) */}
            {showCompare ? (
            <span
              className="mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: compare.up ? "#e5f5ec" : "#fde8e8",
                color:      compare.up ? "#0f8a3c" : "#d32f2f",
              }}
            >
              {compare.value === "N/A"
                ? "— no previous data"
                : `${compare.up ? "▲" : "▼"} ${compare.value} compared to ${cardCompareLabel}`}
            </span>
            ) : (
              /* Highest & Lowest Admission Month — horizontal with number circles */
              <div className="mt-3 flex items-center justify-between">
                {(() => {
                  const FULL_MONTH: Record<string, string> = {
                    Jan: "January", Feb: "February", Mar: "March", Apr: "April",
                    May: "May",     Jun: "June",      Jul: "July",  Aug: "August",
                    Sep: "September", Oct: "October", Nov: "November", Dec: "December",
                  };
                  const fullName = (label: string) => FULL_MONTH[label] ?? label;
                  return (
                    <>
                      {/* Highest */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "#e5f5ec", boxShadow: "0 2px 6px rgba(15,138,60,0.25)" }}
                        >
                          <ArrowTrendingUpIcon className="h-3 w-3" style={{ color: "#0f8a3c" }} />
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          <span className="font-bold">Highest</span> - <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>{highMonth ? fullName(highMonth.label) : "No data"}</span>
                        </span>
                        {highMonth && (
                          <span
                            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                            style={{ background: "#0f8a3c", boxShadow: "0 2px 6px rgba(15,138,60,0.4)" }}
                          >
                            {highMonth.count}
                          </span>
                        )}
                      </div>
                      {/* divider — removed, justify-between handles spacing */}
                      {/* Lowest */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "#fde8e8", boxShadow: "0 2px 6px rgba(211,47,47,0.25)" }}
                        >
                          <ArrowTrendingDownIcon className="h-3 w-3" style={{ color: "#d32f2f" }} />
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          <span className="font-bold">Least</span> - <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>{lowMonth ? fullName(lowMonth.label) : "No data"}</span>
                        </span>
                        {lowMonth && (
                          <span
                            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                            style={{ background: "#d32f2f", boxShadow: "0 2px 6px rgba(211,47,47,0.4)" }}
                          >
                            {lowMonth.count}
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Admissions Trend + Program Enrollment ────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl p-5" style={CARD_STYLE}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Admissions Trend
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: "#e5f5ec", color: "#0f8a3c", boxShadow: "0 1px 6px 0 #0f8a3c40" }}
            >
              {period}
            </span>
          </div>
          <ReactECharts option={trendOption} style={{ height: 248 }} notMerge />
        </div>

        <div className="col-span-1 rounded-xl p-5" style={CARD_STYLE}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Program-wise Enrollment
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: "#e5f5ec", color: "#0f8a3c", boxShadow: "0 1px 6px 0 #0f8a3c40" }}
            >
              {period}
            </span>
          </div>

          <div className="flex flex-col gap-3">
              {topCourses.map(({ course, count }, idx) => {
                const { color, bg, BrandIcon } = getCourseStyle(course, idx);
                const pct = Math.round((count / totalEnrolled) * 100);
                return (
                  <div key={course}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                          style={{ background: bg, boxShadow: `0 1px 6px 0 ${color}33` }}
                        >
                          <BrandIcon size={15} style={{ color }} />
                        </span>
                        <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {course}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: bg }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

    </div>
  );
}