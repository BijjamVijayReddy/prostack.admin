"use client";

import type { WAConnectionState } from "../whatapp.types";

interface Props {
  state: WAConnectionState;
  onDisconnect: () => void;
  onReconnect: () => void;
  loading: boolean;
}

const statusConfig = {
  connected: {
    dot: "bg-emerald-400 shadow-emerald-400/60",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    label: "Connected",
    ring: "ring-emerald-500/30",
  },
  connecting: {
    dot: "bg-amber-400 animate-pulse shadow-amber-400/60",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    label: "Connecting…",
    ring: "ring-amber-500/30",
  },
  qr_ready: {
    dot: "bg-blue-400 animate-pulse shadow-blue-400/60",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    label: "Scan QR Code",
    ring: "ring-blue-500/30",
  },
  disconnected: {
    dot: "bg-red-400 shadow-red-400/60",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    label: "Disconnected",
    ring: "ring-red-500/30",
  },
};

export function ConnectionCard({ state, onDisconnect, onReconnect, loading }: Props) {
  const cfg = statusConfig[state.status];

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#111827] border border-white/10 ring-1 ${cfg.ring} p-6 transition-all duration-300`}>
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* WhatsApp icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">WhatsApp Web</p>
              <p className="text-xs text-gray-500">Institute Account</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full shadow-lg ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoTile label="Phone Number" value={state.phoneNumber ?? "—"} />
          <InfoTile label="Connected Since" value={fmtDate(state.connectedSince)} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {state.status === "connected" ? (
            <button
              onClick={onDisconnect}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          ) : (
            <button
              onClick={onReconnect}
              disabled={loading || state.status === "connecting" || state.status === "qr_ready"}
              className="flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/30 px-4 py-2 text-sm font-medium text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${state.status === "connecting" ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {state.status === "connecting" ? "Connecting…" : "Reconnect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white truncate">{value}</p>
    </div>
  );
}
