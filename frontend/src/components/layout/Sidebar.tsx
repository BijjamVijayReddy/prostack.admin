"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SIDEBAR_ITEMS } from "./sidebar.config";
import type { SidebarKey } from "./sidebar.types";

const ROUTE_MAP: Record<SidebarKey, string> = {
  dashboard: "/",
  students: "/students",
  enquiry: "/enquiry",
  placements: "/placements",
  messages: "/message-center",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";
const LIMIT = 3000;

interface EmailQuota { total: number; remaining: number; otpCount: number; receiptCount: number; }

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [quota, setQuota] = useState<EmailQuota | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("prostack_token") ?? "" : "";
    if (!token) return;
    fetch(`${API_BASE}/api/dashboard/email-quota`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setQuota(d))
      .catch(() => {});
  }, []);

  const activeKey: SidebarKey =
    pathname === "/" ? "dashboard"
    : pathname.startsWith("/students") ? "students"
    : pathname.startsWith("/enquiry") ? "enquiry"
    : pathname.startsWith("/placements") ? "placements"
    : pathname.startsWith("/message-center") ? "messages"
    : "dashboard";

  return (
    <>
      {/* ── Desktop / Tablet sidebar (hidden on mobile) ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`
          hidden md:flex flex-col
          fixed left-0 top-0 z-50 h-screen
          border-r border-white/10 bg-[#0B1220]
          transition-all duration-300 ease-in-out
          ${expanded ? "w-60" : "w-20"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4">
          <Image
            src="/proStacklogo.png"
            alt="Prostack logo"
            width={250}
            height={250}
          />
        </div>

        {/* Menu */}
        <nav className="mt-6 flex flex-col gap-2 px-2">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <div key={item.key}>
                {/* Section divider before Communication */}
                {item.key === "messages" && (
                  <div className="mb-2 mt-3 px-3">
                    <div className={`flex items-center gap-2 transition-all duration-300 ${expanded ? "opacity-100" : "opacity-0"}`}>
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                        Communication
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    {!expanded && <div className="h-px w-full bg-white/10" />}
                  </div>
                )}
              <div
                onClick={() => router.push(ROUTE_MAP[item.key])}
                className={`
                  group relative flex cursor-pointer items-center gap-4
                  rounded-xl px-3 py-3 transition
                  ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {item.key === "messages" ? (
                  <div className="relative">
                    <svg viewBox="0 0 24 24" className={`h-6 w-6 shrink-0 fill-current ${isActive ? "text-[#25D366]" : "text-gray-400 group-hover:text-[#25D366]"} transition`}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                ) : (
                  <Icon className="h-6 w-6 shrink-0" />
                )}
                <span
                  className={`
                    whitespace-nowrap text-sm font-medium
                    transition-all duration-300
                    ${expanded ? "opacity-100" : "opacity-0"}
                  `}
                >
                  {item.label}
                </span>
                {!expanded && (
                  <span
                    className="
                      pointer-events-none absolute left-14 z-50
                      whitespace-nowrap rounded-md bg-black
                      px-2 py-1 text-xs text-white shadow
                      opacity-0 transition-opacity duration-200
                      group-hover:opacity-100
                    "
                  >
                    {item.label}
                  </span>
                )}
              </div>
              </div>
            );
          })}
        </nav>

        {/* ── Email Usage Widget ── */}
        <div className="mt-auto mb-5 mx-2">
          <div className="rounded-xl bg-white/8 border border-white/10 px-4 py-3 overflow-hidden">
            {!expanded ? (
              /* Collapsed: thin bar only */
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                {quota && (
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round((quota.total / LIMIT) * 100))}%`,
                      background: quota.total / LIMIT > 0.8 ? "#ef4444" : quota.total / LIMIT > 0.5 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                )}
              </div>
            ) : quota === null ? (
              /* Expanded + loading */
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-24 rounded bg-white/10 animate-pulse" />
                <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
                <div className="h-1.5 w-full rounded-full bg-white/10 animate-pulse mt-1" />
              </div>
            ) : (
              /* Expanded + data */
              <>
                <p className="text-xs font-semibold text-white/80 whitespace-nowrap">Email Usage</p>
                <p className="mt-0.5 text-lg font-bold text-white whitespace-nowrap leading-tight">
                  {quota.total < 10 ? `0${quota.total}` : quota.total.toLocaleString("en-IN")}
                  <span className="text-sm font-medium text-white/40"> / {LIMIT.toLocaleString("en-IN")}</span>
                </p>
                <div className="flex items-center justify-between mt-0.5 mb-2">
                  <span className="text-[11px] text-white/40">Emails Used</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: quota.total / LIMIT > 0.8 ? "#f87171" : "#4ade80" }}
                  >
                    {quota.total < 10 ? `0${quota.total}` : quota.total} Used
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round((quota.total / LIMIT) * 100))}%`,
                      background: quota.total / LIMIT > 0.8 ? "#ef4444" : quota.total / LIMIT > 0.5 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-[#0B1220] border-white/10 px-2 py-2">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => router.push(ROUTE_MAP[item.key])}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? "text-white bg-white/15" : "text-gray-400"
              }`}
            >
              {item.key === "messages" ? (
                <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 fill-current ${isActive ? "text-[#25D366]" : ""}`}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              ) : (
                <Icon className="h-5 w-5 shrink-0" />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
