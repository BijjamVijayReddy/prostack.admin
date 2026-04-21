"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { EnquiryForm } from "./EnquiryForm";
import { Enquiry } from "../enquiry.types";
import { createEnquiry, updateEnquiry } from "../enquiry.api";

interface Props {
  open: boolean;
  onClose: () => void;
  enquiry?: Enquiry | null;
  onSaved?: () => void;
  onError?: (message: string) => void;
}

export function EnquiryFormModal({ open, onClose, enquiry, onSaved, onError }: Props) {
  const isEdit = !!enquiry;
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const fmtUpdated = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const day = d.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
    const month = d.toLocaleString("en-IN", { month: "long" });
    const year = d.getFullYear();
    const time = d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
    return `${day}${suffix} ${month} ${year}, ${time}`;
  };

  useEffect(() => {
    if (open) {
      setFormKey((k) => k + 1);
    }
  }, [open]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      if (isEdit && enquiry._id) {
        await updateEnquiry(enquiry._id, data);
      } else {
        await createEnquiry(data);
      }
      onSaved?.();
      onClose();
    } catch (err: any) {
      onError?.(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <Dialog.Panel className="relative w-full sm:max-w-3xl rounded-t-xl sm:rounded-xl bg-white p-4 sm:p-6 shadow-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold shrink-0">
              {isEdit ? "Edit Enquiry" : "New Enquiry"}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {isEdit && fmtUpdated(enquiry?.updatedAt) && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1">
                  <ClockIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-medium text-indigo-500 whitespace-nowrap">
                    Last updated: <span className="font-semibold text-indigo-700">{fmtUpdated(enquiry?.updatedAt)}</span>
                  </span>
                </div>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
          </div>

          <EnquiryForm
            key={formKey}
            defaultValues={enquiry ?? undefined}
            onCancel={onClose}
            onSubmit={handleSubmit}
            isSubmitting={saving}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}