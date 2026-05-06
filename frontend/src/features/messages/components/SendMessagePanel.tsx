"use client";

import { useState, useCallback, useRef } from "react";
import type { StudentOption } from "../whatapp.types";
import { sendTextMessage, sendBulkMessage, sendFile, fetchStudents } from "../whatapp.api";

const MESSAGE_TEMPLATES = [
  {
    label: "Fee Reminder",
    icon: "💰",
    text: "Hi {name}! 👋 This is a reminder that your fee payment of ₹{pending} is due. Please make the payment at your earliest convenience. Thank you! 🙏\n\n_Pro Stack Academy_",
  },
  {
    label: "Class Reminder",
    icon: "📚",
    text: "Hi {name}! 📚 Your class is scheduled for tomorrow. Please be on time. For any queries, contact us. See you! 😊\n\n_Pro Stack Academy_",
  },
  {
    label: "Welcome",
    icon: "🎉",
    text: "Welcome to Pro Stack Academy, {name}! 🎉 We're excited to have you on board. Your journey to success starts now! 🚀\n\n_Pro Stack Academy_",
  },
  {
    label: "Placement Update",
    icon: "💼",
    text: "Hi {name}! 💼 Great news — we have a new placement opportunity that matches your profile. Please check with the placement team. Best of luck! 🌟\n\n_Pro Stack Academy_",
  },
];

interface Props {
  connected: boolean;
  onMessageSent?: () => void;
}

export function SendMessagePanel({ connected, onMessageSent }: Props) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [search, setSearch]           = useState("");
  const [students, setStudents]       = useState<StudentOption[]>([]);
  const [searching, setSearching]     = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<StudentOption[]>([]);
  const [message, setMessage]         = useState("");
  const [preview, setPreview]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [toast, setToast]             = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setStudents([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await fetchStudents(q);
        setStudents(data);
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
  }, []);

  const toggleStudent = (s: StudentOption) => {
    setSelectedStudents((prev) =>
      prev.find((x) => x._id === s._id)
        ? prev.filter((x) => x._id !== s._id)
        : mode === "single"
        ? [s]
        : [...prev, s]
    );
    setSearch("");
    setStudents([]);
  };

  const removeStudent = (id: string) =>
    setSelectedStudents((prev) => prev.filter((x) => x._id !== id));

  const applyTemplate = (t: (typeof MESSAGE_TEMPLATES)[number]) => {
    const first = selectedStudents[0];
    let text = t.text;
    if (first) {
      text = text
        .replace(/\{name\}/g, first.name)
        .replace(/\{pending\}/g, first.pendingAmount.toLocaleString("en-IN"));
    }
    setMessage(text);
  };

  const handleSend = async () => {
    if (!connected) { showToast("error", "WhatsApp is not connected"); return; }
    if (!selectedStudents.length) { showToast("error", "Select at least one student"); return; }
    if (!message.trim() && !file) { showToast("error", "Enter a message or attach a file"); return; }

    setSending(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("phone", selectedStudents[0].mobile);
        fd.append("studentName", selectedStudents[0].name);
        fd.append("studentId", selectedStudents[0]._id);
        if (message) fd.append("caption", message);
        await sendFile(fd);
      } else if (mode === "single" || selectedStudents.length === 1) {
        await sendTextMessage({
          phone: selectedStudents[0].mobile,
          studentName: selectedStudents[0].name,
          studentId: selectedStudents[0]._id,
          message,
        });
      } else {
        await sendBulkMessage({
          recipients: selectedStudents.map((s) => ({
            phone: s.mobile,
            studentName: s.name,
            studentId: s._id,
          })),
          message,
          messageType: "bulk",
        });
      }
      showToast("success", `Message sent to ${selectedStudents.length} student(s)`);
      setMessage("");
      setFile(null);
      setSelectedStudents([]);
      onMessageSent?.();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to send");
    }
    setSending(false);
  };

  const charCount = message.length;

  return (
    <div className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-300"
            : "bg-red-900/90 border-red-500/40 text-red-300"
        }`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="text-sm font-semibold text-white">Send Message</h3>
          <p className="text-xs text-gray-500 mt-0.5">Send messages to students instantly</p>
        </div>
        {/* Mode toggle */}
        <div className="flex rounded-lg bg-white/5 p-0.5 gap-0.5">
          {(["single", "bulk"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedStudents([]); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                mode === m
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "single" ? "Single" : "Bulk"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Student selector */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Send To
          </label>

          {/* Selected students chips */}
          {selectedStudents.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedStudents.map((s) => (
                <span key={s._id} className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 pl-2.5 pr-1.5 py-1 text-xs font-medium text-orange-300">
                  {s.name}
                  <button onClick={() => removeStudent(s._id)} className="h-3.5 w-3.5 rounded-full hover:bg-orange-500/30 flex items-center justify-center text-orange-400">✕</button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search students by name, phone, course…"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
              </div>
            )}

            {/* Dropdown */}
            {students.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl bg-[#1E293B] border border-white/10 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {students.map((s) => {
                  const isSelected = selectedStudents.some((x) => x._id === s._id);
                  return (
                    <button
                      key={s._id}
                      onClick={() => toggleStudent(s)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5 ${isSelected ? "bg-orange-500/10" : ""}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-400 flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.mobile} · {s.course}</p>
                      </div>
                      {isSelected && <span className="text-orange-400 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Quick Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => applyTemplate(t)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:border-orange-500/30 hover:text-orange-300"
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message textarea */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Message
          </label>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here… Use *bold* and _italic_ for formatting."
              rows={5}
              maxLength={1000}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className={`text-xs ${charCount > 900 ? "text-red-400" : "text-gray-500"}`}>
                {charCount}/1000
              </span>
            </div>
          </div>
        </div>

        {/* File attachment */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Attach (Optional)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 cursor-pointer transition hover:border-orange-500/40 hover:bg-orange-500/5"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <div className="flex-1 min-w-0">
              {file ? (
                <p className="text-sm text-gray-200 truncate">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Attach File</p>
              )}
              <p className="text-xs text-gray-600">PDF, DOC, DOCX, Image (Max 16MB)</p>
            </div>
            {file && (
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-gray-500 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Preview */}
        {preview && message && (
          <div className="rounded-xl bg-[#1E293B] border border-white/10 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Preview</p>
            <div className="rounded-xl bg-[#DCF8C6]/10 border border-[#DCF8C6]/20 px-4 py-3">
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {preview ? "Hide Preview" : "Preview"}
          </button>

          <button
            onClick={handleSend}
            disabled={sending || !connected || !selectedStudents.length || (!message.trim() && !file)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
