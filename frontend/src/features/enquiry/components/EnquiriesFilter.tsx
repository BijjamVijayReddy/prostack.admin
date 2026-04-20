"use client";

interface EnquiriesFiltersProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
}

const MONTHS = [
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

const YEARS = ["2024", "2025", "2026"];

const STATUSES = ["Pending", "Follow-up", "Converted", "Not Interested"];

export function EnquiriesFilters({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedStatus,
  setSelectedStatus,
}: EnquiriesFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Months</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Years</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}