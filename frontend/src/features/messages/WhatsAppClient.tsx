"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import type { WAConnectionState, MessageLog, StudentOption, DeliveryStatus } from "./whatapp.types";
import {
  fetchStatus, postDisconnect, postReconnect,
  fetchLogs, fetchStudents, sendTextMessage, sendFile as sendFileAPI,
} from "./whatapp.api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const INITIAL_STATE: WAConnectionState = {
  status:         "disconnected",
  qrDataUrl:      null,
  qrRefreshIn:    null,
  phoneNumber:    null,
  connectedSince: null,
};

const STATUS_CHIP: Record<DeliveryStatus, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-gray-500/20 text-gray-400 border-gray-500/20" },
  sent:      { label: "Sent",      cls: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
  delivered: { label: "Delivered", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" },
  read:      { label: "Read",      cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20" },
  failed:    { label: "Failed",    cls: "bg-red-500/20 text-red-400 border-red-500/20" },
};

const AVATAR_COLORS = [
  "bg-red-500", "bg-emerald-500", "bg-purple-500", "bg-blue-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function fmtTime(iso: string) {
  const d   = new Date(iso);
  const now = new Date();
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 1)  return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  if (h < 48)   return `Yesterday, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

const QR_STEPS = [
  { title: "Open WhatsApp on your phone",  desc: "Tap on Menu  |  or Settings  ⚙  and select Linked Devices" },
  { title: "Tap on Link a Device",          desc: "Tap on Link a Device" },
  { title: "Scan this QR Code",             desc: "Point your phone to this screen to scan the code" },
];

export function WhatsAppClient() {
  const [waState, setWaState]         = useState<WAConnectionState>(INITIAL_STATE);
  const [logs, setLogs]               = useState<MessageLog[]>([]);
  const [loadingAction, setLoading]   = useState(false);
  const [qrCountdown, setQrCountdown] = useState<number | null>(null);

  // Send-form state
  const [search, setSearch]                   = useState("");
  const [students, setStudents]               = useState<StudentOption[]>([]);
  const [searching, setSearching]             = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [dropdownOpen, setDropdownOpen]       = useState(false);
  const [message, setMessage]                 = useState("");
  const [file, setFile]                       = useState<File | null>(null);
  const [sending, setSending]                 = useState(false);
  const [toast, setToast]                     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen]         = useState(false);

  const socketRef   = useRef<Socket | null>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLogs = useCallback(async () => {
    try { const d = await fetchLogs({ limit: 6 }); setLogs(d.logs); } catch { /* */ }
  }, []);

  // Socket + initial fetch
  useEffect(() => {
    fetchStatus().then((s) => setWaState(s)).catch(() => {});
    const token = typeof window !== "undefined" ? localStorage.getItem("prostack_token") ?? "" : "";
    const socket = io(API_BASE, { transports: ["websocket", "polling"], auth: { token }, reconnectionAttempts: 10 });
    socketRef.current = socket;
    socket.on("wa:status", (s: WAConnectionState) => {
      setWaState(s);
      if (s.status === "connected") loadLogs();
    });
    socket.on("wa:message_ack", () => loadLogs());
    loadLogs();
    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // QR countdown — uses a ref-stored expiry to avoid setState in effect body
  const qrExpiryRef = useRef<number | null>(null);
  useEffect(() => {
    if (waState.qrRefreshIn === null) {
      qrExpiryRef.current = null;
      return;
    }
    qrExpiryRef.current = Date.now() + waState.qrRefreshIn * 1000;
    const iv = setInterval(() => {
      const remaining = qrExpiryRef.current
        ? Math.max(0, Math.round((qrExpiryRef.current - Date.now()) / 1000))
        : 0;
      setQrCountdown(remaining);
    }, 1000);
    return () => clearInterval(iv);
  }, [waState.qrRefreshIn]);

  // Student search
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setStudents([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try { setStudents(await fetchStudents(q)); } catch { /* */ }
      setSearching(false);
    }, 300);
  }, []);

  // Send
  const handleSend = async () => {
    if (!selectedStudent)              { showToast("error", "Please select a student"); return; }
    if (!message.trim() && !file)      { showToast("error", "Enter a message or attach a file"); return; }
    if (waState.status !== "connected") { showToast("error", "WhatsApp is not connected"); return; }
    setSending(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("phone", selectedStudent.mobile);
        fd.append("studentName", selectedStudent.name);
        fd.append("studentId", selectedStudent._id);
        if (message) fd.append("caption", message);
        await sendFileAPI(fd);
      } else {
        await sendTextMessage({ phone: selectedStudent.mobile, studentName: selectedStudent.name, studentId: selectedStudent._id, message });
      }
      showToast("success", "Message sent successfully!");
      setMessage(""); setFile(null); setSelectedStudent(null); setSearch("");
      loadLogs();
    } catch (err: unknown) { showToast("error", err instanceof Error ? err.message : "Failed to send"); }
    setSending(false);
  };

  const isConnected  = waState.status === "connected";
  const isQR         = waState.status === "qr_ready";
  const isConnecting = waState.status === "connecting";

  return (
    <div className="min-h-screen bg-[#0B1220]">
      <div className="mx-auto max-w-[1400px] space-y-5 px-5 py-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl transition-all ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-emerald-900/95 text-emerald-300"
              : "border-red-500/50 bg-red-900/95 text-red-300"
          }`}>
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            {toast.text}
          </div>
        )}

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">WhatsApp Web</h1>
          <p className="mt-0.5 text-xs text-gray-500">Send messages to students using your WhatsApp account</p>
        </div>

        {/* ── Status Banner ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-[#111827] px-6 py-5">
          <div className="flex flex-wrap items-center gap-6">
            {/* Icon + status */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-lg">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-[#25D366]"><path d={WA_PATH} /></svg>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400">WhatsApp Web Status</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isConnected ? "bg-emerald-500/20 text-emerald-400"
                    : isConnecting || isQR ? "bg-amber-500/20 text-amber-400"
                    : "bg-red-500/20 text-red-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      isConnected ? "bg-emerald-400 shadow-sm shadow-emerald-400/60"
                      : isConnecting || isQR ? "bg-amber-400 animate-pulse"
                      : "bg-red-400"
                    }`} />
                    {isConnected ? "Connected" : isConnecting ? "Connecting…" : isQR ? "Scan QR" : "Disconnected"}
                  </span>
                  {isConnected && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-xs text-[11px] text-gray-500">
                  {isConnected ? "Your WhatsApp account is connected and ready to send messages."
                   : isQR      ? "Scan the QR code with your WhatsApp mobile app."
                               : "WhatsApp is disconnected. Click Reconnect to start."}
                </p>
              </div>
            </div>

            {/* Connected since */}
            <div className="hidden border-l border-white/10 pl-6 sm:block">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Connected Since</p>
              <p className="text-sm font-semibold text-white">{fmtDate(waState.connectedSince)}</p>
            </div>

            {/* Phone */}
            <div className="hidden border-l border-white/10 pl-6 sm:block">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Phone Number</p>
              <p className="text-sm font-semibold text-white">{waState.phoneNumber ?? "—"}</p>
            </div>

            {/* Action button */}
            <div className="ml-auto">
              {isConnected ? (
                <button
                  onClick={() => { setLoading(true); postDisconnect().finally(() => setLoading(false)); }}
                  disabled={loadingAction}
                  className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => { setLoading(true); postReconnect().finally(() => setLoading(false)); }}
                  disabled={loadingAction || isConnecting || isQR}
                  className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20 active:scale-95 disabled:opacity-50"
                >
                  <svg className={`h-4 w-4 ${isConnecting ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isConnecting ? "Connecting…" : "Reconnect"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Grid: Send Message | WhatsApp Connection ─────────── */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">

          {/* ── LEFT: Send Message ── */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
            <div className="px-6 pt-5">
              <h2 className="text-base font-bold text-white">Send Message</h2>
              <p className="mt-0.5 text-xs text-gray-500">Send messages to students instantly</p>
            </div>

            <div className="space-y-4 px-6 py-4">
              {/* Send To */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Send To</label>
                <div className="relative">
                  <div
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-white/20"
                  >
                    <svg className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {selectedStudent ? (
                      <span className="flex-1 truncate text-sm text-white">{selectedStudent.name} · {selectedStudent.mobile}</span>
                    ) : (
                      <span className="flex-1 text-sm text-gray-500">Select Students</span>
                    )}
                    <svg className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/15 bg-[#1a2436] shadow-2xl">
                      <div className="border-b border-white/8 p-2">
                        <input
                          type="text"
                          autoFocus
                          value={search}
                          onChange={(e) => handleSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Search by name, phone, course…"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500/40"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {searching ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
                          </div>
                        ) : students.length === 0 ? (
                          <p className="py-4 text-center text-xs text-gray-500">
                            {search ? "No students found" : "Start typing to search…"}
                          </p>
                        ) : (
                          students.map((s) => (
                            <button
                              key={s._id}
                              onClick={() => { setSelectedStudent(s); setDropdownOpen(false); setSearch(""); setStudents([]); }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5"
                            >
                              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(s.name)}`}>
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.mobile} · {s.course}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Message</label>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={5}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-gray-500">{message.length} / 1000</span>
                </div>
              </div>

              {/* Attach */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Attach (Optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-orange-500/30 hover:bg-orange-500/5"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-400">{file ? file.name : "Attach File"}</p>
                    <p className="text-[11px] text-gray-600">PDF,DOC,DOCX,Image(Max 16MB)</p>
                  </div>
                  {file && (
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-sm text-gray-500 hover:text-red-400">✕</button>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>

              {/* Preview panel */}
              {previewOpen && message && (
                <div className="rounded-xl border border-white/10 bg-[#1a2436] px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Preview</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-200">{message}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSend}
                  disabled={sending || !isConnected}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d={WA_PATH} /></svg>
                  )}
                  Send Message
                </button>
                <button
                  onClick={() => setPreviewOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="mx-5 mb-5 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-base">💡</span>
                <div>
                  <p className="mb-1 text-xs font-semibold text-amber-400">Tips</p>
                  <ul className="space-y-0.5 text-[11px] text-gray-400">
                    <li>• Keep WhatsApp Web open in this browser tab.</li>
                    <li>• Do not logout from WhatsApp on your phone.</li>
                    <li>• If disconnected, scan the QR code again to reconnect.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: WhatsApp Connection ── */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
            <div className="px-6 pt-5">
              <h2 className="text-base font-bold text-white">WhatsApp Connection</h2>
              <p className="mt-0.5 text-xs text-gray-500">Scan QR code using your WhatsApp mobile app</p>
            </div>

            <div className="px-6 pb-6">
              {/* Connected */}
              {isConnected && (
                <div className="flex flex-col items-center justify-center gap-4 py-14">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                    <svg className="h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">Connected!</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {waState.phoneNumber ? `Active on ${waState.phoneNumber}` : "Your WhatsApp is connected and ready."}
                    </p>
                  </div>
                </div>
              )}

              {/* Connecting */}
              {isConnecting && (
                <div className="flex flex-col items-center justify-center gap-4 py-14">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
                  <p className="text-sm text-gray-400">Initializing WhatsApp session…</p>
                </div>
              )}

              {/* QR Ready */}
              {isQR && (
                <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                    {/* Steps */}
                    <div className="flex-1 space-y-5">
                      {QR_STEPS.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-snug text-white">{step.title}</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* QR image */}
                    <div className="flex-shrink-0 self-center">
                      {waState.qrDataUrl ? (
                        <div className="relative">
                          <div className="rounded-xl bg-white p-2 shadow-xl">
                            <Image src={waState.qrDataUrl} alt="WhatsApp QR Code" width={176} height={176} className="rounded-lg" unoptimized />
                          </div>
                          {qrCountdown !== null && qrCountdown < 10 && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/70">
                              <div className="text-center">
                                <p className="text-4xl font-bold text-amber-400">{qrCountdown}</p>
                                <p className="mt-0.5 text-xs text-amber-300">sec</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-44 w-44 animate-pulse rounded-xl bg-white/10" />
                      )}
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="mt-4 flex items-center justify-end gap-1.5 text-xs text-gray-500">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    QR Code will refresh in {qrCountdown ?? 45}s
                  </div>
                </div>
              )}

              {/* Disconnected */}
              {waState.status === "disconnected" && (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="flex flex-col items-center gap-5 opacity-40 sm:flex-row sm:items-start">
                    <div className="flex-1 space-y-5">
                      {QR_STEPS.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-700">
                            <span className="text-[10px] font-bold text-white">{i + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{step.title}</p>
                            <p className="mt-0.5 text-[11px] text-gray-500">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex h-44 w-44 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 self-center">
                      <svg className="h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 19v1M7.05 17.657l-.707.707M5 12H4M7.05 6.343l-.707-.707" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-sm text-gray-400">
                    Click <span className="font-semibold text-orange-400">Reconnect</span> above to generate a fresh QR code.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Activity ─────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Activity</h2>
              <p className="mt-0.5 text-xs text-gray-500">Latest WhatsApp messages</p>
            </div>
            <button onClick={loadLogs} className="text-xs font-semibold text-orange-400 transition hover:text-orange-300">
              View All
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-500">
                <svg className="h-9 w-9 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">No messages yet. Send your first message above!</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-white/[0.02]">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(log.studentName)}`}>
                    {log.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="truncate text-sm font-semibold text-white">{log.studentName}</p>
                      <p className="flex-shrink-0 text-[11px] text-gray-500">{log.phone}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{log.message || log.mediaName || "—"}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[log.deliveryStatus].cls}`}>
                    {STATUS_CHIP[log.deliveryStatus].label}
                  </span>
                  <span className="hidden flex-shrink-0 text-xs text-gray-500 sm:block">{fmtTime(log.sentAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
