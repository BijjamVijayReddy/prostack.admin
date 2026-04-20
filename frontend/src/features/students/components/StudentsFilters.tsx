"use client";

interface StudentsFiltersProps {
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
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
  { label: "December", value: "12" }
];

const YEARS = ["2024", "2025", "2026"];

export function StudentsFilters({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}: StudentsFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Month Filter */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Months</option>
        {MONTHS.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>

      {/* Year Filter */}
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Years</option>
        {YEARS.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}