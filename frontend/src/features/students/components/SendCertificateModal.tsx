"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Student } from "../students.types";
import { sendCertificateEmail, SendCertificatePayload } from "../students.api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSent?: (studentName: string) => void;
  student: Student | null;
}

function buildCertId(admissionNo: string, stream: string, course: string, year: number): string {
  const match = admissionNo.match(/^AD(\d{3})/);
  const seq = match ? parseInt(match[1], 10) : 1;
  const certNum = String(seq + 540).padStart(4, "0");
  const s = (stream || course).toUpperCase();
  let code = "FS";
  if (s.includes("PYTHON"))  code = "PF";
  else if (s.includes("JAVA"))    code = "JF";
  else if (s.includes("REACT"))   code = "RC";
  else if (s.includes("MERN"))    code = "MN";
  else if (s.includes("MEAN"))    code = "MN";
  else if (s.includes("DATA"))    code = "DS";
  else if (s.includes("CLOUD"))   code = "CL";
  else if (s.includes("DEVOPS"))  code = "DO";
  return `PSA/${code}/${year}/${certNum}`;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function todayInputValue(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return todayFormatted();
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function SendCertificateModal({ open, onClose, onSent, student }: Props) {
  const [course, setCourse] = useState("");
  const [completionDateInput, setCompletionDateInput] = useState(todayInputValue());
  const [personalMessage, setPersonalMessage] = useState(
    "Congratulations on completing the course! 🎉\nPlease find your certificate attached."
  );
  const [certificateId, setCertificateId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    setCourse(student.course);
    setCompletionDateInput(todayInputValue());
    setPersonalMessage(`Congratulations on completing the ${student.course} course! 🎉\nPlease find your certificate attached.`);
    setError(null);
  }, [student, open]);

  // Auto-update cert ID whenever course/date/admission changes
  useEffect(() => {
    if (!student) return;
    const year = completionDateInput
      ? new Date(completionDateInput).getFullYear()
      : new Date().getFullYear();
    setCertificateId(buildCertId(student.admissionNo, student.stream, course, year));
  }, [student, course, completionDateInput]);

  async function handleSend() {
    if (!student?._id) return;
    setSending(true);
    setError(null);
    try {
      const payload: SendCertificatePayload = {
        course,
        completionDate: formatDisplayDate(completionDateInput),
        personalMessage: personalMessage.trim(),
        certificateId,
      };
      await sendCertificateEmail(student._id, payload);
      onSent?.(student.name);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send certificate.");
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  if (!student) return null;

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-[100]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 border border-green-200">
              <EnvelopeIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                Send Course Certificate
              </Dialog.Title>
              <p className="text-xs text-gray-500 mt-0.5">Send certificate to student via email</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            {/* Student card */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{student.admissionNo}</span>
                  <span className="text-xs text-gray-500 truncate">{student.email}</span>
                  {student.mobile && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.533 5.851L.057 23.571a.75.75 0 00.919.921l5.769-1.479A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.716 9.716 0 01-4.964-1.357l-.355-.211-3.683.943.97-3.608-.231-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                      </svg>
                      {student.mobile}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Course + Completion Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Course</label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#023430]/30 focus:border-[#023430] cursor-pointer"
                >
                  {[student.course, "Python Full Stack", "Java Full Stack", "MERN Stack", "React JS Development", "Data Science", "Cloud Computing", "DevOps"]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Completion Date</label>
                <input
                  type="date"
                  value={completionDateInput}
                  onChange={(e) => setCompletionDateInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#023430]/30 focus:border-[#023430] cursor-pointer"
                />
              </div>
            </div>

            {/* Template + Certificate ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Certificate Template</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#023430]/30 focus:border-[#023430] cursor-pointer"
                  defaultValue="default"
                >
                  <option value="default">Default Certificate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Certificate ID <span className="text-gray-400 font-normal">(Auto)</span>
                </label>
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#023430]/30 focus:border-[#023430]"
                  placeholder="PSA/FS/2026/0001"
                />
              </div>
            </div>

            {/* Send to info */}
            <div className="flex items-start gap-2.5 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <svg className="h-4 w-4 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-green-800">Certificate will be sent to</p>
                <p className="text-xs text-green-700 mt-0.5">{student.email}</p>
              </div>
            </div>

            {/* Personal message */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Personal Message <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#023430]/30 focus:border-[#023430]"
                placeholder="Write a congratulation message..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={sending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !course}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#023430] hover:bg-[#012825] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {sending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <EnvelopeIcon className="h-4 w-4" />
                  Send Certificate
                </>
              )}
            </button>
          </div>

        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
