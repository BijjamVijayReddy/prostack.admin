"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";
import { Placement } from "./placment.types";
import { fetchPlacements } from "./placements.api";
import { PlacementFormModal } from "./components/PlacementFormModal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

function SavedToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-2xl max-w-sm" style={{ animation: "slideInRight 0.3s ease forwards" }}>
      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Placement Saved</p>
        <p className="mt-0.5 text-xs opacity-85">{message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"><XMarkIcon className="h-4 w-4" /></button>
      <style jsx global>{`@keyframes slideInRight{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-red-600 px-5 py-4 text-white shadow-2xl max-w-sm" style={{ animation: "slideInRight 0.3s ease forwards" }}>
      <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Error</p>
        <p className="mt-0.5 text-xs opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"><XMarkIcon className="h-4 w-4" /></button>
    </div>
  );
}

const HOW_COLORS: Record<string, string> = {
  Institution: "#6366f1",
  Referral: "#0284c7",
  LinkedIn: "#0a66c2",
  Naukari: "#e85d04",
  Others: "#6b7280",
};

export function PlacementsClient() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editPlacement, setEditPlacement] = useState<Placement | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchPlacements()
      .then(setPlacements)
      .catch(() => setPlacements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditPlacement(null); setOpen(true); };
  const openEdit = (p: Placement) => { setEditPlacement(p); setOpen(true); };

  return (
    <div className="flex flex-col gap-4">
      {toastMsg && <SavedToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
          Placements
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-[#023430] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#023430]/30 hover:bg-[#012825] hover:shadow-[#023430]/40 active:scale-95 active:shadow-sm transition-all duration-200 ease-in-out cursor-pointer"
        >
          <PlusCircleIcon className="h-4 w-4" />
          New Placement
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm">
          <BriefcaseIcon className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-gray-800">{placements.length}</span>
          <span className="text-gray-500">Total Placed</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm">
          <BuildingOfficeIcon className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-gray-800">
            {new Set(placements.map((p) => p.companyName)).size}
          </span>
          <span className="text-gray-500">Companies</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm">
          <CurrencyRupeeIcon className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-gray-800">
            {placements.length
              ? (placements.reduce((s, p) => s + p.packageLakhs, 0) / placements.length).toFixed(1)
              : "0"}L
          </span>
          <span className="text-gray-500">Avg Package</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={9} />
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  {["#", "Photo", "Name", "Course", "Company", "Job Offer Date", "Package", "How Got Job", "Review", "Social Media", "Edit"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {placements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-sm text-gray-400">
                      No placements yet. Click <strong>New Placement</strong> to add one.
                    </td>
                  </tr>
                ) : (
                  placements.map((p, i) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3">
                        {p.photo ? (
                          <img src={p.photo} alt={p.firstName} className="h-9 w-9 rounded-full object-cover border" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                            {p.firstName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {p.firstName} {p.secondName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.courseTaken}</td>
                      <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{p.companyName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {p.jobOfferDate
                          ? new Date(p.jobOfferDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-emerald-700">₹{p.packageLakhs}L</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: HOW_COLORS[p.howGotJob] ?? "#6b7280" }}
                        >
                          {p.howGotJob}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.reviewGiven === "Given" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            <CheckCircleIcon className="h-3 w-3" /> Given
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                            Not Given
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.consentSocialMedia ? (
                          <span className="text-xs font-semibold text-emerald-600">✓ Yes</span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-[#023430] bg-[#023430]/5 hover:bg-[#023430]/15 shadow-sm hover:shadow-md hover:shadow-[#023430]/20 active:scale-95 transition-all duration-150 cursor-pointer"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlacementFormModal
        open={open}
        onClose={() => { setOpen(false); setEditPlacement(null); }}
        placement={editPlacement}
        onSaved={(msg) => { setToastMsg(msg); load(); }}
        onError={(msg) => setErrorMsg(msg)}
      />
    </div>
  );
}