"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchStudents } from "./students.api";
import { Student } from "./students.types";
import { StudentsFilters } from "./components/StudentsFilters";
import { StudentsTable } from "./components/StudentsTable";
import { Button } from "@headlessui/react";
import { PlusCircleIcon, CheckCircleIcon, XMarkIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { StudentFormModal } from "./components/StudentFormModal";
import { ReceiptPreviewModal } from "./components/ReceiptPreviewModal";
import { StudentSearchBar } from "./components/StudentSearchBar";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

function SavedToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-2xl max-w-sm animate-slide-in-student">
        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Student Saved Successfully</p>
          <p className="mt-0.5 text-xs opacity-85 leading-snug">{message}</p>
        </div>
        <button onClick={onClose} className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <style jsx global>{`
        @keyframes slide-in-student {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in-student { animation: slide-in-student 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
    </>
  );
}

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <div className="fixed top-5 right-5 z-[200] flex items-start gap-3 rounded-2xl bg-red-600 px-5 py-4 text-white shadow-2xl max-w-sm animate-slide-in-student">
        <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Duplicate Entry</p>
          <p className="mt-0.5 text-xs opacity-90 leading-snug">{message}</p>
        </div>
        <button onClick={onClose} className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export function StudentsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStudents = () => {
    setLoading(true);
    fetchStudents()
      .then((res) => setStudents(res))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);

  // Open edit modal if ?edit=<id> is in the URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || students.length === 0) return;
    const found = students.find((s) => s._id === editId);
    if (found) {
      setEditStudent(found);
      router.replace("/students", { scroll: false });
    }
  }, [searchParams, students, router]);

  // 🔥 FILTER LOGIC
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const [year, month] = student.admissionMonth.split("-");

      const matchMonth = selectedMonth ? month === selectedMonth : true;

      const matchYear = selectedYear ? year === selectedYear : true;

      return matchMonth && matchYear;
    });
  }, [students, selectedMonth, selectedYear]);

  return (
    <div className="space-y-4">
      {toastMsg && <SavedToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StudentsFilters
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:flex-nowrap sm:w-auto">
          <div className="flex-1 min-w-0 sm:flex-none">
            <StudentSearchBar students={students} />
          </div>
          <Button
            className="flex items-center gap-2 bg-[#023430] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-[#023430]/30 hover:bg-[#012825] hover:scale-[1.04] hover:shadow-[#023430]/40 active:scale-95 active:shadow-sm transition-all duration-200 ease-in-out cursor-pointer whitespace-nowrap"
            onClick={() => setOpen(true)}
          >
            <PlusCircleIcon className="h-4 w-4" />
            New Student
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton cols={8} rows={8} />
      ) : (
        <StudentsTable
          data={filteredStudents}
          onEdit={(student) => setEditStudent(student)}
          onReceipt={(student) => setReceiptStudent(student)}
        />
      )}
      {/* New student modal */}
      <StudentFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(msg) => { loadStudents(); setToastMsg(msg); }}
        onError={(msg) => setErrorMsg(msg)}
      />
      {/* Edit student modal */}
      <StudentFormModal
        open={!!editStudent}
        student={editStudent}
        onClose={() => setEditStudent(null)}
        onSaved={(msg) => { loadStudents(); setToastMsg(msg); }}
        onError={(msg) => setErrorMsg(msg)}
      />
      {/* Receipt preview modal */}
      <ReceiptPreviewModal
        open={!!receiptStudent}
        student={receiptStudent}
        onClose={() => setReceiptStudent(null)}
      />
    </div>
  );
}