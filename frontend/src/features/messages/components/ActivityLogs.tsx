 "use client";

import { useState, useEffect } from "react";
import type { MessageLog, DeliveryStatus, MessageType } from "../whatapp.types";
import { fetchLogs } from "../whatapp.api";

const statusStyles: Record<DeliveryStatus, string> = {
  pending:   "bg-gray-500/15 text-gray-400 border-gray-500/30",
  sent:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  delivered: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  read:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed:    "bg-red-500/15 text-red-400 border-red-500/30",
};

const typeIcons: Record<MessageType, string> = {
  text:       "💬",
  receipt:    "🧾",
  reminder:   "⏰",
  attendance: "📋",
  pdf:        "📄",
  image:      "🖼️",
  doc:        "📝",
  bulk:       "📢",
};

const STATUS_OPTIONS = ["all", "pending", "sent", "delivered", "read", "failed"];
const TYPE_OPTIONS   = ["all", "text", "receipt", "reminder", "attendance", "pdf", "bulk"];

interface Props {
  refreshKey?: number;
}

export function ActivityLogs({ refreshKey }: Props) {
  const [logs, setLogs]           = useState<MessageLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [typeFilter, setType]     = useState("all");
  const [manualRefresh, setManualRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchLogs({
          page,
          limit: 10,
          status: statusFilter,
          type: typeFilter,
          search: search || undefined,
        });
        if (!cancelled) {
          setLogs(data.logs);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [page, statusFilter, typeFilter, search, refreshKey, manualRefresh]);

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)   return "Just now";
    if (diffMin < 60)  return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)    return `${diffH}h ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  return (
    <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          <p className="text-xs text-gray-500 mt-0.5">Latest WhatsApp messages · {total} total</p>
        </div>
        <button
          onClick={() => setManualRefresh((k) => k + 1)}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-white/10 hover:text-white"
        >
          <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-white/[0.02] border-b border-white/8">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or phone…"
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-gray-500 w-44 focus:outline-none focus:border-orange-500/50"
        />
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-orange-500/50 cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-[#1E293B]">
              {o === "all" ? "All Status" : o.charAt(0).toUpperCase() + o.slice(1)}
            </option>
          ))}
        </select>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-orange-500/50 cursor-pointer"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-[#1E293B]">
              {o === "all" ? "All Types" : o.charAt(0).toUpperCase() + o.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Message</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3.5 rounded bg-white/5 animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <svg className="h-10 w-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No messages found</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="transition hover:bg-white/[0.02]">
                  {/* Student */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-400">
                        {log.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white text-xs">{log.studentName}</p>
                        <p className="text-[11px] text-gray-500">{log.phone}</p>
                      </div>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-base" title={log.messageType}>
                      {typeIcons[log.messageType] ?? "💬"}
                    </span>
                    <span className="ml-1.5 text-xs text-gray-400 capitalize">{log.messageType}</span>
                  </td>
                  {/* Message snippet */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-xs text-gray-400 max-w-[200px] truncate">
                      {log.mediaName || log.message || "—"}
                    </p>
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles[log.deliveryStatus]}`}>
                      {log.deliveryStatus.charAt(0).toUpperCase() + log.deliveryStatus.slice(1)}
                    </span>
                  </td>
                  {/* Time */}
                  <td className="px-6 py-4 text-xs text-gray-500 hidden lg:table-cell">
                    {fmtTime(log.sentAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 disabled:opacity-40 hover:bg-white/10 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 disabled:opacity-40 hover:bg-white/10 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
