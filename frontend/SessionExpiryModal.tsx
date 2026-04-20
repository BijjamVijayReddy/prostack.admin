"use client";

import { useEffect, useState } from "react";

interface Props {
  expiresAt: number | null;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionExpiryModal({ expiresAt, onExtend, onLogout }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const s = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const countdownLabel = mins > 0
    ? `${mins}m ${String(secs).padStart(2, "0")}s`
    : `${secs}s`;

  // Colour shifts red as time runs out
  const urgent = secondsLeft <= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Session Expiring</h2>
          <p className="text-sm text-gray-500">
            Your session is about to expire. Would you like to extend it for another&nbsp;2&nbsp;hours?
          </p>

          {/* Countdown */}
          <div className={`mt-1 text-3xl font-bold tabular-nums tracking-tight transition-colors ${urgent ? "text-red-500" : "text-yellow-500"}`}>
            {countdownLabel}
          </div>
          <p className="text-xs text-gray-400">
            {urgent ? "⚠ Auto-logout imminent" : "You will be logged out automatically"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            No, Logout
          </button>
          <button
            onClick={onExtend}
            className="flex-1 rounded-lg bg-yellow-400 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 transition-colors cursor-pointer"
          >
            Yes, Extend
          </button>
        </div>
      </div>
    </div>
  );
}
