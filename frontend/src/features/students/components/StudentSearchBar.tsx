"use client";

import { useEffect, useRef, useState } from "react";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  IdentificationIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Student } from "../students.types";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d.replace(/-/g, "/")).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Student Detail Modal ──────────────────────────────────────────────────────
function StudentDetailModal({ student, onClose, onEdit }: { student: Student; onClose: () => void; onEdit: () => void }) {
  // close on backdrop click
  const paid    = student.totalPaid ?? 0;
  const total   = student.totalFee  ?? 0;
  const pending = student.pendingAmount ?? 0;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: "var(--color-bg-surface)",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header banner ── */}
        <div className="relative h-24 rounded-t-2xl" style={{ background: "linear-gradient(135deg, #023430 0%, #0f8a3c 100%)" }}>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          {/* avatar */}
          <div className="absolute -bottom-10 left-6">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-lg"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl ring-4 ring-white shadow-lg text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1976d2, #0f8a3c)" }}
              >
                {initials(student.name)}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="relative pt-14 px-6 pb-6">
          {/* Edit button — top-right of body */}
          <button
            onClick={onEdit}
            title="Edit Student"
            className="absolute top-4 right-6 flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ background: "#e3f0fc", border: "1.5px solid #1976d240", boxShadow: "0 2px 8px rgba(25,118,210,0.25)" }}
          >
            <PencilSquareIcon className="h-4 w-4" style={{ color: "#1976d2" }} />
          </button>

          {/* Name + badges */}
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                {student.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {student.admissionNo}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-8">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#e5f5ec", color: "#0f8a3c" }}
              >
                {student.course}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  student.placementStatus === "Placed"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {student.placementStatus ?? "Not Placed"}
              </span>
            </div>
          </div>

          {/* ── Info grid ── */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <InfoRow icon={<PhoneIcon className="h-4 w-4" />} label="Mobile" value={student.mobile} color="#1976d2" />
            <InfoRow icon={<EnvelopeIcon className="h-4 w-4" />} label="Email" value={student.email} color="#9c27b0" />
            <InfoRow icon={<MapPinIcon className="h-4 w-4" />} label="City" value={student.city} color="#ff9800" />
            <InfoRow icon={<UserCircleIcon className="h-4 w-4" />} label="Gender" value={student.gender} color="#0f8a3c" />
            <InfoRow icon={<AcademicCapIcon className="h-4 w-4" />} label="Stream" value={student.stream} color="#0288d1" />
            <InfoRow icon={<IdentificationIcon className="h-4 w-4" />} label="Passout Year" value={String(student.passoutYear)} color="#6d28d9" />
            <InfoRow icon={<CalendarDaysIcon className="h-4 w-4" />} label="Joined Date" value={fmtDate(student.joinedDate)} color="#0f8a3c" />
            <InfoRow icon={<CalendarDaysIcon className="h-4 w-4" />} label="Due Date" value={fmtDate(student.dueDate)} color="#d32f2f" />
          </div>

          {/* ── Fee section ── */}
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: "var(--color-bg-muted, #f8f9fa)", border: "1px solid var(--color-border-default)" }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              Fee Summary
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FeeBox label="Total Fee" value={fmt(total)} color="#1976d2" />
              <FeeBox label="Paid" value={fmt(paid)} color="#0f8a3c" />
              <FeeBox label="Pending" value={fmt(pending)} color={pending > 0 ? "#d32f2f" : "#0f8a3c"} />
            </div>
            {/* progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#0f8a3c" : "#1976d2" }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {paidPct}% paid · {student.paymentMode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg p-2.5" style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
      <span className="mt-0.5 flex-shrink-0" style={{ color }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function FeeBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

// ── Main Search Bar ───────────────────────────────────────────────────────────
interface StudentSearchBarProps {
  students: Student[];
}

export function StudentSearchBar({ students }: StudentSearchBarProps) {
  const [query, setQuery]             = useState("");
  const [focused, setFocused]         = useState(false);
  const [selected, setSelected]       = useState<Student | null>(null);
  const containerRef                  = useRef<HTMLDivElement>(null);
  const router                        = useRouter();

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q.length >= 2
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.mobile.includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.admissionNo ?? "").toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  const showDropdown = focused && q.length >= 2;
  const isMobile = useIsMobile();

  return (
    <>
      <div ref={containerRef} className="relative w-full sm:w-[480px]">
        {/* Input */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all"
          style={{
            background: "var(--color-bg-surface)",
            border: `1.5px solid ${focused ? "#0f8a3c" : "var(--color-border-default)"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
            outline: "none",
          }}
        >
          {/* Icon in circle */}
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)",
              boxShadow: "0 2px 6px rgba(15,138,60,0.25)",
            }}
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5" style={{ color: "#0f8a3c" }} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={isMobile ? "Search by Name, Mobile..." : "Search by Name, Mobile, Email or Admission No"}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none focus:outline-none focus:ring-0 focus:shadow-none placeholder:text-gray-400 truncate"
            style={{ color: "var(--color-text-primary)", outline: "none", boxShadow: "none" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setFocused(false); }} className="cursor-pointer">
              <XMarkIcon className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 z-[200] overflow-hidden rounded-xl shadow-2xl"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center">
                <MagnifyingGlassIcon className="h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No student found</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Try name, mobile or email</p>
              </div>
            ) : (
              <ul>
                {results.map((s, i) => (
                  <li key={s._id ?? i}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-green-50 cursor-pointer"
                      onClick={() => { setSelected(s); setFocused(false); setQuery(""); }}
                    >
                      {/* avatar */}
                      {s.photo ? (
                        <img src={s.photo} alt={s.name} className="h-9 w-9 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#1976d2,#0f8a3c)" }}
                        >
                          {initials(s.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{s.mobile} · {s.admissionNo ?? s.email}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#e5f5ec", color: "#0f8a3c" }}>
                        {s.admissionNo}
                      </span>
                    </button>
                    {i < results.length - 1 && <hr style={{ borderColor: "var(--color-border-default)" }} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <StudentDetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setSelected(null);
            router.push(`/students?edit=${selected._id}`);
          }}
        />
      )}
    </>
  );
}
