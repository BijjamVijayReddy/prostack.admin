"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { StudentForm } from "./StudentForm";
import { Student } from "../students.types";
import { createStudent, updateStudent } from "../students.api";
import { createPlacement } from "../../placements/placements.api";

interface Props {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
  onSaved?: (message: string) => void;
  onError?: (message: string) => void;
}

export function StudentFormModal({ open, onClose, student, onSaved, onError }: Props) {
  const isEdit = !!student;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Each time the dialog opens, increment key to force StudentForm to remount & re-fetch
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
    setError(null);
    try {
      if (isEdit && student._id) {
        await updateStudent(student._id, data);
        onSaved?.(`${data.name}'s details have been updated successfully.`);
      } else {
        await createStudent(data);
        // If placed, auto-create a placement record
        if (data.placementStatus === "Placed") {
          const nameParts = (data.name as string).trim().split(" ");
          await createPlacement({
            firstName: nameParts[0] ?? data.name,
            secondName: nameParts.slice(1).join(" ") || "-",
            courseTaken: data.course ?? "",
            joinedInstitutionDate: new Date().toISOString().slice(0, 10),
            joinedCompanyDate: new Date().toISOString().slice(0, 10),
            companyName: "-",
            packageLakhs: 0,
            reviewGiven: "Not Given",
            howGotJob: "Institution",
            documentsRequired: "No",
            bgvRequired: "No",
            consentSocialMedia: false,
            photo: data.photo ?? null,
          });
        }
        onSaved?.(`${data.name} has been added as a new student successfully.`);
      }
      onClose();
    } catch (err: any) {
      onError?.(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl flex flex-col max-h-[92vh]">

          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold shrink-0">
              {isEdit ? "Edit Student" : "New Student"}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {isEdit && fmtUpdated(student?.updatedAt) && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1">
                  <ClockIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-medium text-indigo-500 whitespace-nowrap">
                    Last updated: <span className="font-semibold text-indigo-700">{fmtUpdated(student?.updatedAt)}</span>
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

          {/* no inline error — errors shown as toast in parent */}

          <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            <StudentForm
              key={formKey}
              defaultValues={student ?? undefined}
              onCancel={onClose}
              onSubmit={handleSubmit}
              isSubmitting={saving}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}