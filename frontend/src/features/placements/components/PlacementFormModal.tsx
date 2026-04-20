"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PlacementForm } from "./PlacementForm";
import { Placement } from "../placment.types";
import { createPlacement, updatePlacement } from "../placements.api";

interface Props {
  open: boolean;
  onClose: () => void;
  placement?: Placement | null;
  onSaved?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function PlacementFormModal({ open, onClose, placement, onSaved, onError }: Props) {
  const isEdit = !!placement;
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: Omit<Placement, "_id" | "createdAt" | "updatedAt">) => {
    setSaving(true);
    try {
      if (isEdit && placement._id) {
        await updatePlacement(placement._id, data);
        onSaved?.(`${data.firstName} ${data.secondName}'s placement updated successfully.`);
      } else {
        await createPlacement(data);
        onSaved?.(`${data.firstName} ${data.secondName} added to placements successfully.`);
      }
      onClose();
    } catch (err: any) {
      onError?.(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-2.25 2.25h-12A2.25 2.25 0 013.75 18.223V14.15M16.5 6l-4.5 6.75L7.5 6M12 12.75V3" />
                </svg>
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold text-gray-800">
                  {isEdit ? "Edit Placement" : "New Placement"}
                </Dialog.Title>
                <p className="text-xs text-gray-400">{isEdit ? "Update placement record" : "Add a new placed student"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <PlacementForm
              initial={placement ?? undefined}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}