"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ArrowDownTrayIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Student } from "../students.types";

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student | null;
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
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        color: "#1a1a1a",
        fontSize: "13px",
        lineHeight: "1.5",
      }}
    >
      {/* ── TOP ACCENT BAR ── */}
      <div style={{ height: "6px", background: "linear-gradient(90deg,#c0622a,#e8943a,#f7b205)" }} />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 36px 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/proStackLogo-2.png" alt="Pro Stack Academy" style={{ width: "140px", height: "auto", objectFit: "contain" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "5px", color: "#0B1220" }}>INVOICE</div>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>prostackacademy@gmail.com</div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: "1px", background: "#f0e8df", margin: "0 36px" }} />

      {/* ── META + BILL TO (side by side) ── */}
      <div style={{ display: "flex", gap: "16px", padding: "20px 36px", alignItems: "flex-start" }}>
        {/* Invoice details */}
        <div style={{ flex: 1, background: "#fdf6ee", border: "1px solid #f0dbbf", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#c0622a", letterSpacing: "1.5px", marginBottom: "10px", textTransform: "uppercase" }}>Invoice Details</div>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px" }}>
            <tbody>
              {[
                ["Invoice No", <span style={{ fontWeight: "700", color: "#0B1220" }}>{receiptNo}</span>],
                ["Invoice Date", fmtDate(student.courseTakenDate)],
                ...(isPending && student.dueDate ? [["Due Date", <span style={{ color: "#dc2626", fontWeight: "600" }}>{fmtDate(student.dueDate)}</span>]] : []),
                ["Admission No", student.admissionNo],
                ["Payment Mode", student.paymentMode || "—"],
              ].map(([label, val], i) => (
                <tr key={i}>
                  <td style={{ color: "#888", paddingBottom: "5px", paddingRight: "12px", whiteSpace: "nowrap" }}>{label}</td>
                  <td style={{ fontWeight: "500", paddingBottom: "5px" }}>: {val as any}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill To */}
        <div style={{ flex: 1, background: "#f8faff", border: "1px solid #dde8ff", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#3b5bdb", letterSpacing: "1.5px", marginBottom: "10px", textTransform: "uppercase" }}>Bill To</div>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px" }}>
            <tbody>
              {[
                ["Name", <span style={{ fontWeight: "700" }}>{student.name}</span>],
                ["Mobile", `+91-${student.mobile}`],
                ["Email", student.email],
                ["City", student.city],
              ].map(([label, val], i) => (
                <tr key={i}>
                  <td style={{ color: "#888", paddingBottom: "5px", paddingRight: "12px", whiteSpace: "nowrap" }}>{label}</td>
                  <td style={{ fontWeight: "500", paddingBottom: "5px" }}>: {val as any}</td>
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
            <tr style={{ background: "#0B1220", color: "#fff" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", borderRadius: "6px 0 0 0", width: "50px" }}>#</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600" }}>Course / Description</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", borderRadius: "0 6px 0 0" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "12px 14px", color: "#888" }}>1</td>
              <td style={{ padding: "12px 14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px" }}>{student.course}
                {student.stream ? <span style={{ display: "block", fontWeight: "400", fontSize: "11px", color: "#888", textTransform: "none" }}>{student.stream}</span> : null}
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700" }}>{fmt(student.totalFee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── SUMMARY ── */}
      <div style={{ padding: "0 36px", marginBottom: "16px" }}>
        <div style={{ marginLeft: "auto", width: "260px", background: "#fafafa", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
          {[
            ["Total Fee", fmt(student.totalFee), "#0B1220", "600"],
            ["Amount Paid", fmt(student.totalPaid), "#166534", "600"],
            ...(isPending ? [["Pending", fmt(student.pendingAmount), "#dc2626", "700"]] : []),
          ].map(([label, val, color, weight], i, arr) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "9px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid #eee" : "none",
              fontSize: "12px",
            }}>
              <span style={{ color: "#666" }}>{label}</span>
              <span style={{ color, fontWeight: weight as any }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOTAL BANNER ── */}
      <div style={{
        margin: "0 36px 20px",
        background: "linear-gradient(135deg,#0B1220,#1e3a5f)",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
      }}>
        <div>
          <div style={{ color: "#f7b205", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>Grand Total</div>
          <div style={{ color: "#aac4e8", fontSize: "10px", marginTop: "2px" }}>{isPending ? "Includes pending balance" : "Fully Paid ✓"}</div>
        </div>
        <div style={{ color: "#fff", fontWeight: "900", fontSize: "20px", letterSpacing: "0.5px" }}>{fmt(student.totalFee)}</div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ margin: "0 36px", borderTop: "1px solid #f0e8df", paddingTop: "14px", paddingBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#aaa" }}>
          <span>Thank you for choosing <strong style={{ color: "#c0622a" }}>Pro Stack Academy</strong></span>
          <span style={{ fontSize: "10px" }}>This is a system-generated invoice.</span>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ height: "4px", background: "linear-gradient(90deg,#f7b205,#e8943a,#c0622a)" }} />
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────────────────────────── */
export function ReceiptPreviewModal({ open, onClose, student }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSendEmail = () => {
    if (!student) return;
    const isPending = student.pendingAmount > 0;
    const receiptNo = student.receiptNo || `PS-${student.admissionNo.replace(/\D/g, "").slice(-6)}`;
    const subject = encodeURIComponent(`${student.course} Payment Invoice From Prostack - Admin`);
    const body = encodeURIComponent(
`Dear ${student.name},

We are Happy to Welcome you to Pro Stack Academy! You've taken an Important Step Toward Enhancing your Skills, and we're Excited to have you on Board. Our team is dedicated to Providing you with the Best Possible Learning Experience, and We're Here to Support you Throughout your Journey.

Please Find Attached the Payment Invoice for the ${student.course} course.

Details of your transaction:

Invoice No: ${receiptNo}
Total Amount: ₹ ${student.totalFee.toLocaleString("en-IN")} /-
Paid Amount: ₹ ${student.totalPaid.toLocaleString("en-IN")} /-
Pending Amount: ${isPending ? `₹ ${student.pendingAmount.toLocaleString("en-IN")} /-` : "₹ NA/-"}
Due Date: ${isPending && student.dueDate ? fmtDate(student.dueDate) : "NA"}

If you have any Questions or need Further Assistance, Please do not Hesitate to Contact Us.

--

Thanks and regards,

ADMIN
Pro Stack Academy
prostackacademy@gmail.com`
    );
    const to = student.email ?? "";
    const cc = "prostackacademy@gmail.com";
    const mailto = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
    window.open(mailto, "_blank");
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: student
      ? `Receipt_${student.receiptNo || student.admissionNo}`
      : "Receipt",
    pageStyle: `
      @page { size: A4; margin: 0; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @media print {
        body * { visibility: hidden; }
        #receipt-print-area, #receipt-print-area * { visibility: visible; }
        #receipt-print-area {
          position: fixed !important;
          top: 0; left: 0;
          width: 100vw;
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
                onClick={handleSendEmail}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
                Send
              </button>
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
            style={{ background: "linear-gradient(160deg,#e8edf5 0%,#d4dce8 100%)", padding: "28px 28px 28px" }}
          >
            <div
              ref={contentRef}
              style={{
                boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#fff",
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