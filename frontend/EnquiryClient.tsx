"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchEnquiries } from "./enquiry.api";
import { Enquiry } from "./enquiry.types";
import { EnquiriesFilters } from "./components/EnquiriesFilters";
import { EnquiriesTable } from "./components/EnquiriesTable";
import { Button } from "@headlessui/react";
import { PlusCircleIcon, CheckCircleIcon, XMarkIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { EnquiryFormModal } from "./components/EnquiryFormModal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

function SavedToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-2xl max-w-sm">
      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Enquiry Saved Successfully</p>
        <p className="mt-0.5 text-xs opacity-85 leading-snug">{message}</p>
      </div>
      <button onClick={onClose} className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer"><XMarkIcon className="h-4 w-4" /></button>
    </div>
  );
}

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-red-600 px-5 py-4 text-white shadow-2xl max-w-sm">
      <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Duplicate Entry</p>
        <p className="mt-0.5 text-xs opacity-90 leading-snug">{message}</p>
      </div>
      <button onClick={onClose} className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer"><XMarkIcon className="h-4 w-4" /></button>
    </div>
  );
}

export function EnquiryClient() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedStatus, setSelectedStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [editEnquiry, setEditEnquiry] = useState<Enquiry | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadEnquiries = () => {
    setLoading(true);
    fetchEnquiries()
      .then((res) => setEnquiries(res))
      .catch(() => setEnquiries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEnquiries(); }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const [year, month] = e.enquiryMonth.split("-");
      const matchMonth = selectedMonth ? month === selectedMonth : true;
      const matchYear = selectedYear ? year === selectedYear : true;
      const matchStatus = selectedStatus ? e.status === selectedStatus : true;
      return matchMonth && matchYear && matchStatus;
    });
  }, [enquiries, selectedMonth, selectedYear, selectedStatus]);

  return (
    <div className="space-y-4">
      {toastMsg && <SavedToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <EnquiriesFilters
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />
        <Button
          className="flex items-center gap-2 bg-[#023430] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-[#023430]/30 hover:bg-[#012825] hover:shadow-[#023430]/40 active:scale-95 active:shadow-sm transition-all duration-200 ease-in-out cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <PlusCircleIcon className="h-4 w-4" />
          New Enquiry
        </Button>
      </div>

      {loading ? (
        <TableSkeleton cols={7} rows={8} />
      ) : (
        <EnquiriesTable
          data={filteredEnquiries}
          onEdit={(enquiry) => setEditEnquiry(enquiry)}
        />
      )}

      {/* New enquiry modal */}
      <EnquiryFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => { loadEnquiries(); setToastMsg("Enquiry has been added successfully."); }}
        onError={(msg) => setErrorMsg(msg)}
      />
      {/* Edit enquiry modal */}
      <EnquiryFormModal
        open={!!editEnquiry}
        enquiry={editEnquiry}
        onClose={() => setEditEnquiry(null)}
        onSaved={() => { loadEnquiries(); setToastMsg("Enquiry has been updated successfully."); }}
        onError={(msg) => setErrorMsg(msg)}
      />
    </div>
  );
}
