"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { DateRange } from "./DateRangeFilter";

// ── Static sales card data (replace with API later) ───────────────────────────
const SALES_TOTAL = "104,251.00 CAD";
const SALES_PCT   = 96;
const STATS = [
  { label: "AVG. VOLUME OF ORDERS", value: "245" },
  { label: "AVG. ORDER VALUE",       value: "85 CAD" },
  { label: "AVG. PIECE PER ORDER",   value: "2.5" },
];

// ── Chart palette ─────────────────────────────────────────────────────────────
const C1          = "#9c27b0";
const C2          = "#ff9800";
const CHART_AXIS  = "#717171";
const CHART_SPLIT = "#e8e8e8";
const DONUT_TRACK = "#f0f0f0";
const DONUT_FILL  = "#0f8a3c";

// ── Mock data helpers ─────────────────────────────────────────────────────────
function seed(n: number) {
  const x = Math.sin(n + 1.5) * 99999;
  return x - Math.floor(x);
}
function mockSales(d: Date)  { return Math.round(5000  + seed(d.getTime() / 86400000)       * 15000); }
function mockOrders(d: Date) { return Math.round(80    + seed(d.getTime() / 86400000 + 100) * 320); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function diffDays(a: Date, b: Date)  { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function fmtDDMM(d: Date) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}
function fmtMonth(d: Date) { return d.toLocaleString("default", { month: "short" }); }

// ── Chart data generator ──────────────────────────────────────────────────────
interface ChartData { labels: string[]; sales: number[]; orders: number[] }

function generateChartData(range: DateRange): ChartData {
  const { preset, start, end } = range;
  const diff = diffDays(start, end);
  const labels: string[] = [];
  const sales:  number[] = [];
  const orders: number[] = [];

  if (preset === "this_week" || preset === "last_week" || (preset === "custom" && diff <= 14)) {
    let cur = new Date(start);
    while (cur <= end) {
      labels.push(fmtDDMM(cur));
      sales.push(mockSales(cur));
      orders.push(mockOrders(cur));
      cur = addDays(cur, 1);
    }
    return { labels, sales, orders };
  }

  if (preset === "this_month" || preset === "last_month" || (preset === "custom" && diff <= 93)) {
    let cur = new Date(start);
    while (cur <= end) {
      const we = addDays(cur, 6) > end ? end : addDays(cur, 6);
      labels.push(`${fmtDDMM(cur)}-${fmtDDMM(we)}`);
      sales.push(mockSales(cur));
      orders.push(mockOrders(cur));
      cur = addDays(cur, 7);
    }
    return { labels, sales, orders };
  }

  if (preset === "this_year" || (preset === "custom" && diff <= 365)) {
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMo = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cur <= endMo) {
      labels.push(`${fmtMonth(cur)} ${cur.getFullYear()}`);
      sales.push(mockSales(cur));
      orders.push(mockOrders(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return { labels, sales, orders };
  }

  // Quarterly
  let y = start.getFullYear();
  let q = Math.floor(start.getMonth() / 3);
  const endY = end.getFullYear();
  const endQ = Math.floor(end.getMonth() / 3);
  while (y < endY || (y === endY && q <= endQ)) {
    const d = new Date(y, q * 3, 1);
    labels.push(`Q${q + 1} ${y}`);
    sales.push(mockSales(d)  * 13);
    orders.push(mockOrders(d) * 13);
    if (++q > 3) { q = 0; y++; }
  }
  return { labels, sales, orders };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface SalesOverviewProps { range: DateRange }

export function SalesOverview({ range }: SalesOverviewProps) {

  const { labels, sales: SALES_DATA, orders: ORDER_DATA } = useMemo(
    () => generateChartData(range),
    [range],
  );

  const gaugeOption = {
    tooltip: { show: false },
    graphic: {
      type: "text",
      left: "center",
      top: "middle",
      style: {
        text: `${SALES_PCT}%`,
        fill: DONUT_FILL,
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
      },
    },
    series: [
      {
        type: "pie",
        radius: ["60%", "80%"],
        startAngle: 90,
        label: { show: false },
        emphasis: { scale: false },
        data: [
          { value: SALES_PCT,       itemStyle: { color: DONUT_FILL } },
          { value: 100 - SALES_PCT, itemStyle: { color: DONUT_TRACK } },
        ],
      },
    ],
  };

  const trendOption = {
    grid: { left: 56, right: 56, bottom: 48, top: 16 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1a1a2e",
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#e8e8f0", fontSize: 12, fontFamily: "'Roboto', sans-serif" },
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
      data: labels,
      axisLine: { lineStyle: { color: CHART_SPLIT } },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 10,
        color: CHART_AXIS,
        rotate: labels.length > 10 ? 30 : 0,
        interval: 0,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "Sales",
        nameGap: 8,
        nameTextStyle: { color: CHART_AXIS, fontSize: 11 },
        axisLabel: {
          fontSize: 11,
          color: CHART_AXIS,
          formatter: (v: number) => (v >= 1000 ? `${v / 1000}K` : String(v)),
        },
        splitLine: { lineStyle: { color: CHART_SPLIT } },
      },
      {
        type: "value",
        name: "Order Volume",
        nameRotate: -90,
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: { color: CHART_AXIS, fontSize: 11 },
        axisLabel: { fontSize: 11, color: CHART_AXIS },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Sales",
        type: "line",
        smooth: true,
        yAxisIndex: 0,
        data: SALES_DATA,
        lineStyle: { color: C1, width: 2 },
        itemStyle: { color: C1 },
        symbol: "circle",
        symbolSize: 5,
      },
      {
        name: "Order Volume",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: ORDER_DATA,
        lineStyle: { color: C2, width: 2 },
        itemStyle: { color: C2 },
        symbol: "circle",
        symbolSize: 5,
      },
    ],
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div
        className="col-span-1 rounded-xl p-5"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p className="type-h2" style={{ color: "var(--color-text-secondary)" }}>Sales</p>
        <p className="mt-3 type-kpi" style={{ color: "var(--color-text-primary)" }}>
          {SALES_TOTAL}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex flex-col items-center">
            <ReactECharts option={gaugeOption} style={{ width: 200, height: 200 }} />
            <p className="mt-1 type-caption" style={{ color: "var(--color-text-muted)" }}>
              % of Total Sales
            </p>
          </div>
          <div className="flex flex-col gap-4 pl-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <p
                  className="type-label font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {s.label}
                </p>
                <p className="type-kpi-sec" style={{ color: "var(--color-text-primary)" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="col-span-2 rounded-xl p-5"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-2">
          <p className="type-h2" style={{ color: "var(--color-text-secondary)" }}>
            BOPIS Sales &amp; Order Trend
          </p>
        </div>
        <ReactECharts option={trendOption} style={{ height: 270 }} />
      </div>
    </div>
  );
}
