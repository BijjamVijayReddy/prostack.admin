"use client";

import { useEffect, useRef, useState } from "react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  IdentificationIcon,
  AcademicCapIcon,
  PhoneIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { fetchPendingStudents, PendingStudent } from "../dashboard.api";
import { DateRange } from "./DateRangeFilter";

interface Props {
  open: boolean;
  onClose: () => void;
  range: DateRange;
  totalPending: number;
}

const COURSE_COLORS: Record<string, { color: string; bg: string }> = {
  "Java Full Stack":   { color: "#e53935", bg: "#fde8e8" },
  "Python Full Stack": { color: "#1976d2", bg: "#e3f0fc" },
  "MERN Stack":        { color: "#43a047", bg: "#e5f5ec" },
  "React JS":          { color: "#0288d1", bg: "#e0f7fa" },
  "Java":              { color: "#bf360c", bg: "#fbe9e7" },
  "Python":            { color: "#f9a825", bg: "#fffde7" },
};
function courseColor(c: string) {
  return COURSE_COLORS[c] ?? { color: "#7c3aed", bg: "#ede9fe" };
}

function fmtDate(d?: string) {
  if (!d) return null;
  try {
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    const [y, m, day] = parts;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return d;
  }
}

function paidBar(paid: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

export function PendingFeesModal({ open, onClose, range, totalPending }: Props) {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "active" | "inactive">("all");
  const overlayRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchPendingStudents(range.start, range.end)
      .then(setStudents)
      .catch((e: Error) => { setStudents([]); setError(e.message ?? "Failed to load"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open) load(); }, [open, range.start.getTime(), range.end.getTime()]);

  // Reset search when closed
  useEffect(() => { if (!open) { setSearch(""); setFilter("all"); setError(null); } }, [open]);

  // Close on overlay click
  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      s.course.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "inactive" && s.studentStatus === "Inactive") ||
      (filter === "active" && s.studentStatus !== "Inactive");
    return matchSearch && matchFilter;
  });

  const totalAll      = students.reduce((s, st) => s + st.pendingAmount, 0);
  const totalFiltered = filtered.reduce((s, st) => s + st.pendingAmount, 0);
  const activeCount   = students.filter((s) => s.studentStatus !== "Inactive").length;
  const inactiveCount = students.filter((s) => s.studentStatus === "Inactive").length;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-lg lg:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          maxHeight: "92vh",
          background: "var(--color-bg-surface, #fff)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.12)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="shrink-0 px-3 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4"
          style={{ borderBottom: "1px solid var(--color-border-default)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <CurrencyRupeeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Pending Fees
                </h2>
                <p className="text-[11px] sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <UserGroupIcon className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                  {students.length} {students.length === 1 ? "student" : "students"}&nbsp;·&nbsp;
                  Total ₹{totalAll.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(["all", "active", "inactive"] as const).map((f) => {
              const count = f === "all" ? students.length : f === "active" ? activeCount : inactiveCount;
              const isActive = filter === f;
              const accent =
                f === "inactive"
                  ? { bg: "#fde8e8", color: "#e53935", border: "#e5393540" }
                  : f === "active"
                  ? { bg: "#e5f5ec", color: "#0f8a3c", border: "#0f8a3c40" }
                  : { bg: "#e3f0fc", color: "#1976d2", border: "#1976d240" };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="cursor-pointer rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold transition-all"
                  style={{
                    background: isActive ? accent.bg : "var(--color-bg-muted, #f4f4f5)",
                    color: isActive ? accent.color : "var(--color-text-muted)",
                    border: `1.5px solid ${isActive ? accent.border : "transparent"}`,
                  }}
                >
                  {f === "all" ? `All (${count})` : f === "active" ? `Active (${count})` : `Inactive (${count})`}
                </button>
              );
            })}
            <span className="ml-auto text-xs font-bold self-center" style={{ color: "#e53935" }}>
              ₹{totalFiltered.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Search */}
          <div className="relative mt-2.5">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name, Admission No, Mobile, Course…"
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-all"
              style={{
                borderColor: "var(--color-border-default)",
                background: "var(--color-bg-muted, #f9fafb)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className="flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.15) transparent",
          }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl p-4" style={{ background: "var(--color-bg-muted, #f4f4f5)" }}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-36 rounded bg-gray-200" />
                    <div className="h-2.5 w-52 rounded bg-gray-200" />
                    <div className="h-2.5 w-44 rounded bg-gray-200" />
                    <div className="h-1.5 w-full rounded-full bg-gray-200 mt-2" />
                  </div>
                  <div className="h-5 w-20 rounded bg-gray-200" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-400" />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Failed to load — backend may still be deploying
              </p>
              <p className="text-xs px-6" style={{ color: "var(--color-text-muted)" }}>{error}</p>
              <button
                onClick={load}
                className="mt-1 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <span className="text-4xl">🎉</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>No pending fees</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>All students are fully paid or filtered out.</p>
            </div>
          ) : (
            filtered.map((s, idx) => {
              const { color, bg } = courseColor(s.course);
              const bar        = paidBar(s.totalPaid, s.totalFee);
              const isInactive = s.studentStatus === "Inactive";
              const joined     = fmtDate(s.joinedDate);
              const due        = fmtDate(s.dueDate);
              return (
                <div
                  key={s._id ?? idx}
                  className="rounded-xl p-3 sm:p-3.5 transition-all"
                  style={{
                    border: `1px solid ${isInactive ? "#fca5a540" : "var(--color-border-default)"}`,
                    background: isInactive ? "#fff8f8" : "var(--color-bg-surface)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    {/* Avatar */}
                    <div
                      className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: bg, color, border: `2px solid ${color}30` }}
                    >
                      {s.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      {/* Name + badge + pending (mobile: pending inline) */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                            {s.name}
                          </span>
                          {isInactive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                              <ExclamationTriangleIcon className="h-2.5 w-2.5" />
                              Inactive
                            </span>
                          )}
                        </div>
                        {/* Pending amount — always top-right */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold leading-tight" style={{ color: isInactive ? "#9ca3af" : "#e53935" }}>
                            ₹{s.pendingAmount.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>pending</p>
                        </div>
                      </div>

                      {/* Course + Admission No */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color }}>
                          <AcademicCapIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{s.course}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          <IdentificationIcon className="h-3 w-3 shrink-0" />
                          {s.admissionNo}
                        </span>
                      </div>

                      {/* Mobile + Joined + Due */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1">
                        <a
                          href={`https://wa.me/91${s.mobile.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 hover:underline"
                        >
                          <PhoneIcon className="h-3 w-3 shrink-0" />
                          {s.mobile}
                        </a>
                        {joined && (
                          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                            <CalendarDaysIcon className="h-3 w-3 shrink-0" />
                            <span className="hidden xs:inline">Joined&nbsp;</span>{joined}
                          </span>
                        )}
                        {due && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                            <ClockIcon className="h-3 w-3 shrink-0" />
                            Due&nbsp;{due}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                          <span>Paid <span className="font-semibold text-green-600">₹{s.totalPaid.toLocaleString("en-IN")}</span></span>
                          <span>Total ₹{s.totalFee.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${bar}%`, background: bar >= 80 ? "#22c55e" : bar >= 40 ? "#f97316" : "#ef4444" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="shrink-0 px-3 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--color-border-default)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Showing <span className="font-semibold">{filtered.length}</span> of {students.length} students
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
            style={{ background: "#fde8e8", color: "#e53935" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
