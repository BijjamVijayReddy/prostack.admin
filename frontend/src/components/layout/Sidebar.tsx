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
              <div
                key={item.key}
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
                <Icon className="h-6 w-6 shrink-0" />
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
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
