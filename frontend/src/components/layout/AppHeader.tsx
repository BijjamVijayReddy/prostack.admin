"use client";

import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { useLayout } from "./LayoutContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  BellAlertIcon,
  ClipboardDocumentListIcon,
  CurrencyRupeeIcon,
  ExclamationCircleIcon,
  IdentificationIcon,
  DevicePhoneMobileIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { ProfileModal } from "./ProfileModal";
import { fetchStudents } from "@/features/students/students.api";
import { Student } from "@/features/students/students.types";
import { fetchEnquiries } from "@/features/enquiry/enquiry.api";
import { FaJava, FaPython, FaReact, FaCloud, FaCode } from "react-icons/fa";
import { SiMongodb, SiDatadog } from "react-icons/si";

function getCourseIcon(course: string): { icon: React.ReactNode; color: string } {
  const c = course.toLowerCase();
  if (c.includes("java"))         return { icon: <FaJava />,    color: "#e76f00" };
  if (c.includes("python"))       return { icon: <FaPython />,  color: "#3572a5" };
  if (c.includes("react"))        return { icon: <FaReact />,   color: "#61dafb" };
  if (c.includes("mern"))         return { icon: <SiMongodb />, color: "#4db33d" };
  if (c.includes("data"))         return { icon: <SiDatadog />, color: "#632ca6" };
  if (c.includes("cloud"))        return { icon: <FaCloud />,   color: "#4a90e2" };
  return { icon: <FaCode />, color: "#64748b" };
}
import { Enquiry } from "@/features/enquiry/enquiry.types";

function SavedToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-2xl max-w-sm animate-slide-in-toast">
        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Changes saved successfully</p>
          <p className="mt-0.5 text-xs opacity-85 leading-snug">{message}</p>
        </div>
        <button onClick={onClose} className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <style jsx global>{`
        @keyframes slide-in-toast {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in-toast { animation: slide-in-toast 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
    </>
  );
}

interface AppHeaderProps {
  rightSlot?: ReactNode;
}

export function AppHeader({ rightSlot }: AppHeaderProps) {
  const { active } = useLayout();
  const { logout, user } = useAuth();
  const router = useRouter();

  const toTitleCase = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
  const userName = user ? `${toTitleCase(user.firstName)} ${toTitleCase(user.lastName)}`.trim() || "—" : "—";
  const rawRole = user?.role ?? "admin";
  const role = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
  const isOwner = rawRole.toLowerCase() === "owner";
  // Soft indigo pill
  const avatarBg       = "#1E3A8A";
  const pillBg         = "#EEF2FF";
  const pillText       = "#3730a3";
  const roleBadgeBg    = isOwner ? "#fef3c7" : "#ede9fe";   // soft badge inside dropdown
  const roleBadgeColor = isOwner ? "#92400e" : "#4338ca";
  const firstLetter = userName.charAt(0).toUpperCase();
  const lastLoginFormatted = user?.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      }).replace(/\bam\b/i, "AM").replace(/\bpm\b/i, "PM")
    : null;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Notification icons ──────────────────────────────────────────────
  const [bellOpen, setBellOpen] = useState(false);
  const [enquiryBellOpen, setEnquiryBellOpen] = useState(false);
  const [dueStudents, setDueStudents] = useState<Student[]>([]);
  const [dueEnquiries, setDueEnquiries] = useState<Enquiry[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);
  const enquiryBellRef = useRef<HTMLDivElement>(null);

  const loadDueToday = useCallback(async () => {
    try {
      const now = new Date();
      const toStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const todayStr = toStr(now);
      const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = toStr(tomorrow);

      const [allStudents, allEnquiries] = await Promise.all([
        fetchStudents(),
        fetchEnquiries(),
      ]);

      setDueStudents(allStudents
        .filter((s) => {
          if (!s.dueDate || Number(s.pendingAmount) <= 0) return false;
          const d = s.dueDate.slice(0, 10);
          return d === todayStr || d === tomorrowStr;
        })
        .map((s) => ({ ...s, _dayLabel: s.dueDate!.slice(0, 10) === todayStr ? "today" : "tomorrow" }))
      );

      setDueEnquiries(allEnquiries
        .filter((e) => {
          if (!e.expectedJoinDate) return false;
          const d = e.expectedJoinDate.slice(0, 10);
          return d === todayStr || d === tomorrowStr;
        })
        .map((e) => ({ ...e, _dayLabel: e.expectedJoinDate!.slice(0, 10) === todayStr ? "today" : "tomorrow" }))
      );
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    loadDueToday();
    const id = setInterval(loadDueToday, 5 * 60 * 1000);
    // Also refresh whenever the tab regains focus
    const onFocus = () => loadDueToday();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadDueToday();
    });
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadDueToday]);

  // Close payment bell panel when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (enquiryBellRef.current && !enquiryBellRef.current.contains(e.target as Node)) setEnquiryBellOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const [time, setTime] = useState({
    date: "",
    clock: "",
    period: "",
  });

  const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const formatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const formatted = formatter.format(now);
      const [datePart, timePart] = formatted.split(", ");
      const [clock, period] = timePart.split(" ");

      setTime({
        date: datePart,
        clock,
        period: period.toUpperCase(),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Dynamic document title with notification count ──────────────────
  useEffect(() => {
    const pageLabels: Record<string, string> = {
      dashboard: "Dashboard",
      students: "Students",
      enquiry: "Enquiry",
      placements: "Placements",
    };
    const label = pageLabels[active] ?? capitalize(active);
    const totalNotif = dueStudents.length + dueEnquiries.length;
    document.title = totalNotif > 0
      ? `(${totalNotif}) ProStack - ${label}`
      : `ProStack - ${label}`;
  }, [active, dueStudents.length, dueEnquiries.length]);

  return (
    <header className="flex items-center justify-between border-b px-3 py-3 md:px-6 md:py-4" style={{ backgroundColor: "#f3f3f3", borderColor: "#e8e8e8" }}>
      <div>
        <h1 className="text-lg md:text-2xl font-semibold">
          {capitalize(active === "dashboard" ? "dashboard" : active)}
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {rightSlot}

        {/* ── Payment Due Bell ── */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setEnquiryBellOpen(false); }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 shadow-md shadow-red-200/70 hover:bg-red-100 hover:shadow-red-300/70 active:scale-95 transition-all duration-150 cursor-pointer"
            title="Payment Due (Today & Tomorrow)"
          >
            <BellAlertIcon className="h-5 w-5" />
            {dueStudents.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {dueStudents.length > 9 ? "9+" : dueStudents.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[min(320px,calc(100vw-1rem))] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-red-50">
                <div className="flex items-center gap-2">
                  <CurrencyRupeeIcon className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-semibold text-red-700">Payment Due — Today & Tomorrow</p>
                </div>
                <button onClick={() => setBellOpen(false)} className="cursor-pointer">
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {dueStudents.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <CurrencyRupeeIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No payments due today or tomorrow</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {(dueStudents as (Student & { _dayLabel: string })[]).map((s) => (
                      <li
                        key={s._id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-red-50 transition cursor-pointer"
                        onClick={() => {
                          setBellOpen(false);
                          router.push(`/students?edit=${s._id}`);
                        }}
                      >
                        <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              s._dayLabel === "today" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            }`}>{s._dayLabel === "today" ? "Today" : "Tomorrow"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <IdentificationIcon className="h-3 w-3 shrink-0" />
                            <span>{s.admissionNo}</span>
                            <span className="mx-0.5">·</span>
                            <DevicePhoneMobileIcon className="h-3 w-3 shrink-0" />
                            <span>{s.mobile}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {(() => { const { icon, color } = getCourseIcon(s.course ?? ""); return <span style={{ color }} className="text-xs shrink-0">{icon}</span>; })()}
                            <span className="text-xs text-gray-500 truncate">{s.course}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CurrencyRupeeIcon className="h-3 w-3 shrink-0 text-red-500" />
                            <span className="text-xs font-medium text-red-600">{s.pendingAmount.toLocaleString("en-IN")}/- pending</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Enquiry Join Bell ── */}
        <div ref={enquiryBellRef} className="relative">
          <button
            onClick={() => { setEnquiryBellOpen((v) => !v); setBellOpen(false); }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shadow-md shadow-rose-200/70 hover:bg-rose-100 hover:shadow-rose-300/70 active:scale-95 transition-all duration-150 cursor-pointer"
            title="Enquiries Expected to Join (Today & Tomorrow)"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            {dueEnquiries.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {dueEnquiries.length > 9 ? "9+" : dueEnquiries.length}
              </span>
            )}
          </button>

          {enquiryBellOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[min(320px,calc(100vw-1rem))] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 bg-rose-50">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-rose-500" />
                  <p className="text-sm font-semibold text-rose-700">Expected to Join — Today & Tomorrow</p>
                </div>
                <button onClick={() => setEnquiryBellOpen(false)} className="cursor-pointer">
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {dueEnquiries.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <ClipboardDocumentListIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No enquiries expected today or tomorrow</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {(dueEnquiries as (Enquiry & { _dayLabel: string })[]).map((e) => (
                      <li
                        key={e._id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-rose-50 transition cursor-pointer"
                        onClick={() => {
                          setEnquiryBellOpen(false);
                          router.push(`/enquiry?edit=${e._id}`);
                        }}
                      >
                        <ClipboardDocumentListIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{e.name}</p>
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              e._dayLabel === "today" ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"
                            }`}>{e._dayLabel === "today" ? "Today" : "Tomorrow"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <IdentificationIcon className="h-3 w-3 shrink-0" />
                            <span>{e.enquiryNo}</span>
                            <span className="mx-0.5">·</span>
                            <DevicePhoneMobileIcon className="h-3 w-3 shrink-0" />
                            <span>{e.mobile}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                            {(() => { const { icon, color } = getCourseIcon(e.course); return <span style={{ color }} className="text-xs shrink-0">{icon}</span>; })()}
                            <span className="truncate">{e.course}</span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-rose-600">
                            Expected to join {e._dayLabel} — follow up!
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          ref={dropdownRef}
          className="relative flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer select-none shadow-md shadow-indigo-200/60 hover:shadow-indigo-300/70 active:scale-[0.98] transition-all duration-150"
          style={{ background: pillBg }}
          onClick={() => setDropdownOpen((v) => !v)}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold shadow"
            style={{ background: avatarBg, color: "#ffffff" }}
          >
            {firstLetter}
          </div>

          <div className="hidden sm:block text-sm leading-tight">
            <p className="font-medium" style={{ color: "#1E3A8A" }}>{userName}</p>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: "rgba(255,255,255,0.45)", color: "#3B82F6" }}
            >
              {role}
            </span>

            <div className="mt-0.5 flex items-center gap-1 text-xs">
              <span className="font-medium" style={{ color: "#6B7280" }}>
                {time.clock}
              </span>
              <span className="font-semibold" style={{ color: "#6B7280" }}>
                {time.period}
              </span>
              <span style={{ color: "#6B7280" }}>·</span>
              <span style={{ color: "#6B7280" }}>
                {time.date}
              </span>
            </div>
          </div>

          <ChevronDownIcon
            className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            style={{ color: pillText, opacity: 0.6 }}
          />

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
              {/* Profile row */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                    style={{ background: avatarBg }}
                  >
                    {firstLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold mt-0.5"
                      style={{ background: roleBadgeBg, color: roleBadgeColor }}
                    >
                      {role}
                    </span>
                  </div>
                </div>
                {lastLoginFormatted && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 shadow-sm">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <p className="text-[11px] text-indigo-700 whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="font-semibold text-indigo-800">Last Login:</span> {lastLoginFormatted}
                    </p>
                  </div>
                )}
              </div>

              {/* Profile option */}
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); setProfileOpen(true); }}
              >
                <UserCircleIcon className="h-4 w-4 text-gray-400" />
                My Profile
              </button>

              {/* Logout */}
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile edit modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={(msg) => { setProfileOpen(false); setSavedMsg(msg); }}
      />

      {/* Success toast — lives outside modal so it survives after close */}
      {savedMsg && (
        <SavedToast message={savedMsg} onClose={() => setSavedMsg(null)} />
      )}
    </header>
  );
}