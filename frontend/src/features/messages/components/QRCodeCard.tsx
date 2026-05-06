"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { WAConnectionState } from "../whatapp.types";

interface Props {
  state: WAConnectionState;
}

const steps = [
  { icon: "📱", title: "Open WhatsApp on your phone" },
  { icon: "⚙️", title: "Tap Menu or Settings" },
  { icon: "🔗", title: "Select Linked Devices" },
  { icon: "📷", title: "Tap Link a Device & Scan" },
];

export function QRCodeCard({ state }: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);

  const expiryRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.qrRefreshIn === null) {
      expiryRef.current = null;
      return;
    }
    expiryRef.current = Date.now() + state.qrRefreshIn * 1000;
    const timer = setInterval(() => {
      const remaining = expiryRef.current
        ? Math.max(0, Math.round((expiryRef.current - Date.now()) / 1000))
        : 0;
      setCountdown(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.qrRefreshIn]);

  const isQR        = state.status === "qr_ready";
  const isConnected = state.status === "connected";
  const isConnecting = state.status === "connecting";

  return (
    <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="text-sm font-semibold text-white">WhatsApp Connection</h3>
          <p className="text-xs text-gray-500 mt-0.5">Scan QR code using your WhatsApp mobile app</p>
        </div>
        {isQR && (state.qrRefreshIn !== null || countdown !== null) && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-400">
              QR refreshes in {countdown ?? state.qrRefreshIn}s
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Connected state */}
        {isConnected && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-emerald-400">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">Connected!</p>
              <p className="text-sm text-gray-400 mt-1">
                {state.phoneNumber
                  ? `Active on ${state.phoneNumber}`
                  : "Your WhatsApp account is connected and ready to send messages."}
              </p>
            </div>
          </div>
        )}

        {/* Connecting/loading state */}
        {isConnecting && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
            <p className="text-sm text-gray-400">Initializing WhatsApp session…</p>
          </div>
        )}

        {/* QR code ready */}
        {isQR && (
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* QR Image */}
            <div className="flex-shrink-0">
              <div className="relative rounded-2xl bg-white p-3 shadow-2xl shadow-orange-500/10">
                {state.qrDataUrl ? (
                  <Image
                    src={state.qrDataUrl}
                    alt="WhatsApp QR Code"
                    width={208}
                    height={208}
                    className="rounded-lg"
                    unoptimized
                  />
                ) : (
                  <div className="h-52 w-52 animate-pulse rounded-lg bg-gray-200" />
                )}
                {/* Countdown ring overlay when expiring */}
                {(countdown ?? state.qrRefreshIn ?? 99) < 10 && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-amber-400">{countdown ?? state.qrRefreshIn}</p>
                      <p className="text-xs text-amber-300 mt-1">seconds left</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-3 flex-1">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 border border-white/8"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-sm font-bold text-orange-400">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-300 flex-1">{step.title}</span>
                  <span className="text-lg">{step.icon}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disconnected state */}
        {state.status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 text-center">
              WhatsApp is disconnected. Click <span className="text-orange-400 font-semibold">Reconnect</span> to generate a new QR code.
            </p>
          </div>
        )}
      </div>

      {/* Tips footer */}
      <div className="border-t border-white/8 bg-white/[0.02] px-6 py-4">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>Keep WhatsApp Web open in this browser tab.</p>
            <p>Do not logout from WhatsApp on your phone.</p>
            <p>If disconnected, use the Reconnect button.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
