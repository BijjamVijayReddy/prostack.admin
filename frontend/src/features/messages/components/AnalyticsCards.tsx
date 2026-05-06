"use client";

import type { Analytics } from "../whatapp.types";

interface Props {
  data: Analytics | null;
  loading: boolean;
  connected: boolean;
}

export function AnalyticsCards({ data, loading, connected }: Props) {
  const cards = [
    {
      label:   "Messages Today",
      value:   data?.todayTotal ?? 0,
      icon:    "💬",
      color:   "from-orange-500/20 to-orange-600/5",
      border:  "border-orange-500/20",
      textColor: "text-orange-400",
    },
    {
      label:   "Delivery Rate",
      value:   `${data?.deliveryRate ?? 0}%`,
      icon:    "✅",
      color:   "from-emerald-500/20 to-emerald-600/5",
      border:  "border-emerald-500/20",
      textColor: "text-emerald-400",
    },
    {
      label:   "Read Rate",
      value:   `${data?.readRate ?? 0}%`,
      icon:    "👁",
      color:   "from-blue-500/20 to-blue-600/5",
      border:  "border-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      label:   "Failed",
      value:   data?.failed ?? 0,
      icon:    "❌",
      color:   "from-red-500/20 to-red-600/5",
      border:  "border-red-500/20",
      textColor: "text-red-400",
    },
    {
      label:   "Total Sent",
      value:   data?.totalAll ?? 0,
      icon:    "📊",
      color:   "from-purple-500/20 to-purple-600/5",
      border:  "border-purple-500/20",
      textColor: "text-purple-400",
    },
    {
      label:   "Connection",
      value:   connected ? "Active" : "Offline",
      icon:    connected ? "🟢" : "🔴",
      color:   connected ? "from-emerald-500/20 to-emerald-600/5" : "from-red-500/20 to-red-600/5",
      border:  connected ? "border-emerald-500/20" : "border-red-500/20",
      textColor: connected ? "text-emerald-400" : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} border ${c.border} p-4 transition-all duration-300 hover:scale-[1.02]`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xl">{c.icon}</span>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-16 rounded bg-white/10 animate-pulse" />
            ) : (
              <p className={`text-2xl font-bold ${c.textColor}`}>{c.value}</p>
            )}
            <p className="mt-1 text-[11px] font-medium text-gray-400">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
