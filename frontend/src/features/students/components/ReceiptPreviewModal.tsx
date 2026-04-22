"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ArrowDownTrayIcon, PaperAirplaneIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Student } from "../students.types";
import { sendReceiptEmail } from "../students.api";

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  /** When true, automatically send the receipt email as soon as the modal renders */
  autoSend?: boolean;
}

function fmt(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}/-`;
}

function fmtDate(d?: string) {
  if (!d) return "NA";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/* ── Receipt content (the printable area) ─────────────────────────────── */
function ReceiptContent({ student }: { student: Student }) {
  const receiptNo = student.receiptNo || `PS-${student.admissionNo.replace(/\D/g, "").slice(-6)}`;
  const isPending = student.pendingAmount > 0;

  return (
    <div
      id="receipt-print-area"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        width: "595px",
        minHeight: "842px",
        backgroundColor: "#0f172a",
        backgroundImage: "radial-gradient(ellipse at 20% 10%, rgba(30,58,95,0.8) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(120,50,10,0.3) 0%, transparent 50%)",
        boxSizing: "border-box",
        color: "#e2e8f0",
        fontSize: "13px",
        lineHeight: "1.5",
      }}
    >
      {/* ── TOP ACCENT BAR ── */}
      <div style={{ height: "4px", background: "linear-gradient(90deg,#f7b205,#e8943a,#c0622a)" }} />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 36px 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/proStacklogo.png" alt="Pro Stack Academy" style={{ width: "140px", height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "5px", color: "#ffffff" }}>INVOICE</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>prostackacademy@gmail.com</div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 36px" }} />

      {/* ── META + BILL TO (side by side) ── */}
      <div style={{ display: "flex", gap: "16px", padding: "20px 36px", alignItems: "flex-start" }}>
        {/* Invoice details */}
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(247,178,5,0.25)", borderRadius: "10px", padding: "14px 16px", backdropFilter: "blur(4px)" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#f7b205", letterSpacing: "1.5px", marginBottom: "10px", textTransform: "uppercase" }}>Invoice Details</div>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px" }}>
            <tbody>
              {[
                ["Invoice No", <span style={{ fontWeight: "700", color: "#ffffff" }}>{receiptNo}</span>],
                ["Invoice Date", fmtDate(student.courseTakenDate)],
                ...(isPending && student.dueDate ? [["Due Date", <span style={{ color: "#f87171", fontWeight: "600" }}>{fmtDate(student.dueDate)}</span>]] : []),
                ["Admission No", student.admissionNo],
                ["Payment Mode", student.paymentMode || "—"],
              ].map(([label, val], i) => (
                <tr key={i}>
                  <td style={{ color: "#94a3b8", paddingBottom: "5px", paddingRight: "12px", whiteSpace: "nowrap" }}>{label}</td>
                  <td style={{ fontWeight: "500", paddingBottom: "5px", color: "#e2e8f0" }}>: {val as any}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill To */}
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,179,237,0.25)", borderRadius: "10px", padding: "14px 16px", backdropFilter: "blur(4px)" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#63b3ed", letterSpacing: "1.5px", marginBottom: "10px", textTransform: "uppercase" }}>Bill To</div>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px" }}>
            <tbody>
              {[
                ["Name", <span style={{ fontWeight: "700", color: "#ffffff" }}>{student.name}</span>],
                ["Mobile", `+91-${student.mobile}`],
                ["Email", student.email],
                ["City", student.city],
              ].map(([label, val], i) => (
                <tr key={i}>
                  <td style={{ color: "#94a3b8", paddingBottom: "5px", paddingRight: "12px", whiteSpace: "nowrap" }}>{label}</td>
                  <td style={{ fontWeight: "500", paddingBottom: "5px", color: "#e2e8f0" }}>: {val as any}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── COURSE TABLE ── */}
      <div style={{ padding: "0 36px", marginBottom: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "linear-gradient(90deg,#f7b205,#e8943a)", color: "#0B1220" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "700", borderRadius: "8px 0 0 0", width: "50px" }}>#</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "700" }}>Course / Description</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", borderRadius: "0 8px 0 0" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <td style={{ padding: "12px 14px", color: "#64748b" }}>1</td>
              <td style={{ padding: "12px 14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px", color: "#f1f5f9" }}>{student.course}
                {student.stream ? <span style={{ display: "block", fontWeight: "400", fontSize: "11px", color: "#94a3b8", textTransform: "none" }}>{student.stream}</span> : null}
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700", color: "#f1f5f9" }}>{fmt(student.totalFee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── SUMMARY ── */}
      <div style={{ padding: "0 36px", marginBottom: "16px" }}>
        <div style={{ marginLeft: "auto", width: "260px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden" }}>
          {[
            ["Total Fee", fmt(student.totalFee), "#f1f5f9", "600"],
            ["Amount Paid", fmt(student.totalPaid), "#4ade80", "600"],
            ...(isPending ? [["Pending", fmt(student.pendingAmount), "#f87171", "700"]] : []),
          ].map(([label, val, color, weight], i, arr) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "9px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              fontSize: "12px",
            }}>
              <span style={{ color: "#94a3b8" }}>{label}</span>
              <span style={{ color, fontWeight: weight as any }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOTAL BANNER ── */}
      <div style={{
        margin: "0 36px 20px",
        background: "linear-gradient(135deg,#f7b205 0%,#e8943a 50%,#c0622a 100%)",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        boxShadow: "0 4px 20px rgba(247,178,5,0.3)",
      }}>
        <div>
          <div style={{ color: "#0B1220", fontSize: "10px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>Grand Total</div>
          <div style={{ color: "rgba(0,0,0,0.55)", fontSize: "10px", marginTop: "2px" }}>{isPending ? "Includes pending balance" : "Fully Paid ✓"}</div>
        </div>
        <div style={{ color: "#0B1220", fontWeight: "900", fontSize: "22px", letterSpacing: "0.5px" }}>{fmt(student.totalFee)}</div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ margin: "0 36px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", paddingBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748b" }}>
          <span>Thank you for choosing <strong style={{ color: "#f7b205" }}>Pro Stack Academy</strong></span>
          <span style={{ fontSize: "10px" }}>This is a system-generated invoice.</span>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ height: "4px", background: "linear-gradient(90deg,#c0622a,#e8943a,#f7b205)" }} />
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────────────────────────── */
export function ReceiptPreviewModal({ open, onClose, student, autoSend = false }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError,  setSendError]  = useState("");

  /** Capture receipt div → PDF base64 → POST to backend */
  const doSend = useCallback(async () => {
    if (!student?._id) return;
    setSendStatus("sending");
    setSendError("");
    try {
      let pdfBase64: string | undefined;
      const el = document.getElementById("receipt-print-area");
      if (el) {
        const html2canvas = (await import("html2canvas")).default;
        const jsPDF        = (await import("jspdf")).jsPDF;
        const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL("image/jpeg", 0.82);
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [595, 842] });
        pdf.addImage(imgData, "JPEG", 0, 0, 595, 842);
        // strip the data-URI prefix to get raw base64
        pdfBase64 = pdf.output("datauristring").split(",")[1];
      }
      await sendReceiptEmail(student._id, pdfBase64);
      setSendStatus("sent");
    } catch (err: any) {
      setSendError(err.message ?? "Failed to send email");
      setSendStatus("error");
    }
  }, [student]);

  // Auto-send on first render when autoSend=true
  useEffect(() => {
    if (open && autoSend && sendStatus === "idle") {
      // Small delay so the receipt DOM is fully rendered
      const t = setTimeout(() => { void doSend(); }, 600);
      return () => clearTimeout(t);
    }
  }, [open, autoSend, doSend, sendStatus]);

  // Reset status whenever a new student is shown
  useEffect(() => {
    setSendStatus("idle");
    setSendError("");
  }, [student?._id]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: student
      ? `Receipt_${student.receiptNo || student.admissionNo}`
      : "Receipt",
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; }
        body * { visibility: hidden; }
        #receipt-print-area, #receipt-print-area * { visibility: visible; }
        #receipt-print-area {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 595px !important;
          min-height: 842px !important;
          transform: scale(1.3361) !important;
          transform-origin: top left !important;
          margin: 0 !important;
        }
      }
    `,
  });

  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Blurred dark backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <Dialog.Panel className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] max-h-[95vh] overflow-y-auto">

          {/* ── Toolbar ── */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: "linear-gradient(135deg,#0B1220 0%,#1a2f50 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <ArrowDownTrayIcon className="h-4 w-4 text-[#f7b205]" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-bold text-white tracking-wide">Receipt Preview</Dialog.Title>
                <p className="text-[11px] text-blue-300 mt-0.5">{student.name} · {student.admissionNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#f7b205,#e8943a)", color: "#0B1220" }}
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                Download PDF
              </button>
              <button
                onClick={() => { void doSend(); }}
                disabled={sendStatus === "sending" || sendStatus === "sent"}
                className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={
                  sendStatus === "sent"
                    ? { background: "rgba(74,222,128,0.15)", borderColor: "rgba(74,222,128,0.4)", color: "#4ade80" }
                    : sendStatus === "error"
                    ? { background: "rgba(248,113,113,0.15)", borderColor: "rgba(248,113,113,0.4)", color: "#f87171" }
                    : { background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" }
                }
              >
                {sendStatus === "sending" && <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z"/></svg>}
                {sendStatus === "sent"    && <CheckCircleIcon className="h-3.5 w-3.5" />}
                {sendStatus === "error"   && <ExclamationCircleIcon className="h-3.5 w-3.5" />}
                {sendStatus === "idle"    && <PaperAirplaneIcon className="h-3.5 w-3.5" />}
                {sendStatus === "sending" ? "Sending…" : sendStatus === "sent" ? "Email Sent!" : sendStatus === "error" ? "Retry Send" : "Send Email"}
              </button>
              {sendStatus === "error" && sendError && (
                <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={sendError}>{sendError}</span>
              )}
              <button
                onClick={onClose}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-gray-400 hover:bg-red-500/30 hover:text-white transition-all cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Invoice preview (no scroll) ── */}
          <div
            className="flex justify-center"
            style={{ background: "linear-gradient(160deg,#0a0f1e 0%,#0d1b2e 50%,#0a1628 100%)", padding: "28px 28px 28px" }}
          >
            <div
              ref={contentRef}
              style={{
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#0f172a",
                width: "595px",
              }}
            >
              <ReceiptContent student={student} />
            </div>
          </div>

          {/* ── Bottom strip ── */}
          <div
            className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium"
            style={{ background: "#0B1220", color: "#4a6fa5" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f7b205]" />
            Pro Stack Academy — Secure Invoice System
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}