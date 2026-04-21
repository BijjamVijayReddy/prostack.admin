"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDaysIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

interface StudentsFiltersProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
}

const MONTHS = [
  { label: "All Months", value: "" },
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const YEARS = [
  { label: "All Years", value: "" },
  { label: "2024", value: "2024" },
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
];

function CustomSelect({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200 cursor-pointer hover:scale-[1.04] hover:shadow-md active:scale-[0.97]"
        style={{
          background: "var(--color-bg-surface)",
          border: `1.5px solid ${open ? "#023430" : "var(--color-border-default)"}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
          minWidth: "148px",
        }}
      >
        {/* icon circle */}
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg,#e0f2f1,#b2dfdb)",
            boxShadow: "0 2px 6px rgba(2,52,48,0.22)",
          }}
        >
          <CalendarDaysIcon className="h-3.5 w-3.5" style={{ color: "#023430" }} />
        </div>
        <span className="flex-1 text-left text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {selected.label}
        </span>
        <ChevronDownIcon
          className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200"
          style={{ color: "#023430", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 top-full z-[300] mt-1.5 w-full overflow-hidden rounded-xl py-1"
          style={{
            background: "var(--color-bg-surface)",
            border: "1.5px solid #02343025",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors duration-100 cursor-pointer"
                style={{
                  background: isActive ? "#e0f2f1" : "transparent",
                  color: isActive ? "#023430" : "var(--color-text-primary)",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-muted, #f5f5f5)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {opt.label}
                {isActive && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#023430" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StudentsFilters({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}: StudentsFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <CustomSelect options={MONTHS} value={selectedMonth} onChange={setSelectedMonth} />
      <CustomSelect options={YEARS} value={selectedYear} onChange={setSelectedYear} />
    </div>
  );
}
