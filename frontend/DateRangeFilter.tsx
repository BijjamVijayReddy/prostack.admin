"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDaysIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────
export type RangePreset =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export interface DateRange {
  preset: RangePreset;
  start: Date;
  end: Date;
  /** Human-readable label shown in the button */
  label: string;
}

// ── Preset list ───────────────────────────────────────────────────────────────
const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "this_week",  label: "This Week"  },
  { key: "last_week",  label: "Last Week"  },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year",  label: "This Year"  },
  { key: "custom",     label: "Custom range..." },
];

const PRESET_NAMES: Record<RangePreset, string> = {
  this_week:  "This Week",
  last_week:  "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_year:  "This Year",
  custom:     "Custom",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function today0() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDD(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

function toInputVal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Build range ───────────────────────────────────────────────────────────────
export function buildRange(preset: RangePreset, customStart?: Date, customEnd?: Date): DateRange {
  const t = today0();

  if (preset === "this_week") {
    // Sunday → today
    const start = addDays(t, -t.getDay());
    return { preset, start, end: t, label: `This Week: ${fmtDD(start)} – ${fmtDD(t)}` };
  }

  if (preset === "last_week") {
    // Previous Sunday → previous Saturday
    const thisSun = addDays(t, -t.getDay());
    const start   = addDays(thisSun, -7);
    const end     = addDays(thisSun, -1);
    return { preset, start, end, label: `Last Week: ${fmtDD(start)} – ${fmtDD(end)}` };
  }

  if (preset === "this_month") {
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const mon = t.toLocaleString("default", { month: "short" });
    return { preset, start, end: t, label: `This Month: ${mon} ${t.getFullYear()}` };
  }

  if (preset === "last_month") {
    const start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const end   = new Date(t.getFullYear(), t.getMonth(), 0);
    const mon   = start.toLocaleString("default", { month: "short" });
    return { preset, start, end, label: `Last Month: ${mon} ${start.getFullYear()}` };
  }

  if (preset === "this_year") {
    const start = new Date(t.getFullYear(), 0, 1);
    return { preset, start, end: t, label: `This Year: ${t.getFullYear()}` };
  }

  // custom
  const s = customStart ?? t;
  const e = customEnd   ?? t;
  return { preset: "custom", start: s, end: e, label: `${fmtDD(s)} – ${fmtDD(e)}` };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen]             = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(toInputVal(value.start));
  const [customEnd,   setCustomEnd  ] = useState(toInputVal(value.end));
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function selectPreset(key: RangePreset) {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    onChange(buildRange(key));
    setOpen(false);
  }

  function applyCustom() {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e) {
      onChange(buildRange("custom", s, e));
      setOpen(false);
      setShowCustom(false);
    }
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* ── Trigger button ────────────────────────────────── */}
      <button
        onClick={() => { setOpen(v => !v); setShowCustom(false); }}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
        style={{
          backgroundColor: "#1a1a2e",
          color: "#e8e8f0",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "inherit" }} />
        <span>{value.preset !== "custom" ? PRESET_NAMES[value.preset] : value.label}</span>
        {value.preset !== "custom" && (
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
            {value.preset === "this_year"
              ? new Date().getFullYear()
              : (() => {
                  const s = value.start;
                  const e = value.end;
                  return `${String(s.getDate()).padStart(2,"0")}/${String(s.getMonth()+1).padStart(2,"0")} – ${String(e.getDate()).padStart(2,"0")}/${String(e.getMonth()+1).padStart(2,"0")}`;
                })()}
          </span>
        )}
        <ChevronDownIcon
          className={`h-3 w-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "inherit" }}
        />
      </button>

      {/* ── Dropdown ──────────────────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl overflow-hidden"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-medium)",
            boxShadow: "var(--shadow-dropdown)",
          }}
        >
          {!showCustom ? (
            /* ── Preset list ── */
            <ul className="py-1">
              {PRESETS.map((p) => {
                const isActive = value.preset === p.key;
                return (
                  <li key={p.key}>
                    <button
                      onClick={() => selectPreset(p.key)}
                      className="w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer"
                      style={{
                        color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                        fontWeight: isActive ? 600 : 400,
                        backgroundColor: isActive ? "var(--color-bg-selected)" : "transparent",
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = isActive ? "var(--color-bg-selected)" : "transparent";
                      }}
                    >
                      {p.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* ── Custom date inputs ── */
            <div className="p-4 flex flex-col gap-3">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                Custom Range
              </p>

              <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Start date
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={e => setCustomStart(e.target.value)}
                  className="rounded-md px-2 py-1.5 text-xs"
                  style={{
                    border: "1px solid var(--color-border-input)",
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-bg-surface)",
                  }}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                End date
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="rounded-md px-2 py-1.5 text-xs"
                  style={{
                    border: "1px solid var(--color-border-input)",
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-bg-surface)",
                  }}
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 rounded-md py-1.5 text-xs transition cursor-pointer"
                  style={{
                    border: "1px solid var(--color-border-input)",
                    color: "var(--color-text-muted)",
                    backgroundColor: "var(--color-bg-cancel)",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={applyCustom}
                  className="flex-1 rounded-md py-1.5 text-xs font-semibold transition cursor-pointer"
                  style={{ backgroundColor: "#1a1a2e", color: "#e8e8f0" }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
