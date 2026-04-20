"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { studentSchema } from "../student.schema";
import { StudentPhotoUpload } from "./StudentPhotoUpload";
import { Student } from "../students.types";
import { fetchNextAdmissionNumber } from "../students.api";
import {
  IdentificationIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  ChevronDownIcon,
  CheckIcon,
  BanknotesIcon,
  QrCodeIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import { FaJava, FaPython, FaReact, FaMale, FaFemale, FaBriefcase, FaTimesCircle } from "react-icons/fa";
import { SiMongodb, SiSpringboot } from "react-icons/si";
import type { IconType } from "react-icons";

const COURSES: { value: string; label: string; color: string; bg: string; Icon: IconType }[] = [
  { value: "Java Full Stack",   label: "Java Full Stack",   color: "#e53935", bg: "#fde8e8", Icon: SiSpringboot },
  { value: "Python Full Stack", label: "Python Full Stack", color: "#1976d2", bg: "#e3f0fc", Icon: FaPython     },
  { value: "MERN Stack",        label: "MERN Stack",        color: "#43a047", bg: "#e5f5ec", Icon: SiMongodb    },
  { value: "React JS",          label: "React JS",          color: "#0288d1", bg: "#e0f7fa", Icon: FaReact      },
  { value: "Java",              label: "Java",              color: "#bf360c", bg: "#fbe9e7", Icon: FaJava       },
  { value: "Python",            label: "Python",            color: "#f9a825", bg: "#fffde7", Icon: FaPython     },
];

const GENDERS: { value: string; label: string; color: string; bg: string; Icon: IconType }[] = [
  { value: "Male",   label: "Male",   color: "#1976d2", bg: "#e3f0fc", Icon: FaMale   },
  { value: "Female", label: "Female", color: "#d81b60", bg: "#fce4ec", Icon: FaFemale },
];

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const PAYMENT_MODES: { value: string; label: string; color: string; bg: string; Icon: HeroIcon }[] = [
  { value: "Cash",          label: "Cash",          color: "#16a34a", bg: "#dcfce7", Icon: BanknotesIcon        },
  { value: "UPI",           label: "UPI",           color: "#7c3aed", bg: "#ede9fe", Icon: QrCodeIcon           },
  { value: "Bank Transfer", label: "Bank Transfer", color: "#0284c7", bg: "#e0f2fe", Icon: BuildingLibraryIcon  },
  { value: "Card",          label: "Card",          color: "#0d9488", bg: "#ccfbf1", Icon: CreditCardIcon       },
  { value: "Cheque",        label: "Cheque",        color: "#d97706", bg: "#fef3c7", Icon: DocumentTextIcon     },
];

const PLACEMENT_STATUSES: { value: string; label: string; color: string; bg: string; Icon: IconType }[] = [
  { value: "Not Placed", label: "Not Placed", color: "#e53935", bg: "#fde8e8", Icon: FaTimesCircle },
  { value: "Placed",     label: "Placed",     color: "#2e7d32", bg: "#e8f5e9", Icon: FaBriefcase   },
];

function PaymentModeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PAYMENT_MODES.find((p) => p.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 rounded-lg border px-3 py-3 text-base bg-white transition-all"
        style={{
          borderColor: open ? (selected?.color ?? "#023430") : "#023430",
          boxShadow: open ? `0 0 0 3px ${(selected?.color ?? "#023430")}20` : "none",
        }}
      >
        {selected ? (
          <>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: selected.bg, border: `1.5px solid ${selected.color}40` }}
            >
              <selected.Icon className="h-4 w-4" style={{ color: selected.color }} />
            </div>
            <span className="flex-1 text-left font-medium" style={{ color: selected.color }}>{selected.label}</span>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <CreditCardIcon className="h-4 w-4 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-gray-400">Select Payment Mode</span>
          </>
        )}
        <ChevronDownIcon
          className="h-4 w-4 flex-shrink-0 transition-transform duration-200 text-gray-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 bottom-full z-[400] mb-1 overflow-hidden rounded-xl py-1"
          style={{
            background: "var(--color-bg-surface, #fff)",
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 -8px 24px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {PAYMENT_MODES.map((pm) => {
            const isActive = pm.value === value;
            return (
              <button
                key={pm.value}
                type="button"
                onClick={() => { onChange(pm.value); setOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer"
                style={{ background: isActive ? `${pm.color}12` : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: pm.bg, border: `1.5px solid ${pm.color}35` }}
                >
                  <pm.Icon className="h-3.5 w-3.5" style={{ color: pm.color }} />
                </div>
                <span className="flex-1 text-left font-medium" style={{ color: isActive ? pm.color : "#374151" }}>
                  {pm.label}
                </span>
                {isActive && <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: pm.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlacementDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PLACEMENT_STATUSES.find((p) => p.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 rounded-lg border px-3 py-3 text-base bg-white transition-all"
        style={{
          borderColor: open ? (selected?.color ?? "#023430") : "#023430",
          boxShadow: open ? `0 0 0 3px ${(selected?.color ?? "#023430")}20` : "none",
        }}
      >
        {selected ? (
          <>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: selected.bg, border: `1.5px solid ${selected.color}40` }}
            >
              <selected.Icon size={15} style={{ color: selected.color }} />
            </div>
            <span className="flex-1 text-left font-medium" style={{ color: selected.color }}>{selected.label}</span>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <BriefcaseIcon className="h-4 w-4 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-gray-400">Select Status</span>
          </>
        )}
        <ChevronDownIcon
          className="h-4 w-4 flex-shrink-0 transition-transform duration-200 text-gray-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-[400] mt-1 overflow-hidden rounded-xl py-1"
          style={{
            background: "var(--color-bg-surface, #fff)",
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {PLACEMENT_STATUSES.map((ps) => {
            const isActive = ps.value === value;
            return (
              <button
                key={ps.value}
                type="button"
                onClick={() => { onChange(ps.value); setOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer"
                style={{ background: isActive ? `${ps.color}12` : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: ps.bg, border: `1.5px solid ${ps.color}35` }}
                >
                  <ps.Icon size={14} style={{ color: ps.color }} />
                </div>
                <span className="flex-1 text-left font-medium" style={{ color: isActive ? ps.color : "#374151" }}>
                  {ps.label}
                </span>
                {isActive && <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: ps.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GenderDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = GENDERS.find((g) => g.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 rounded-lg border px-3 py-3 text-base bg-white transition-all"
        style={{
          borderColor: open ? (selected?.color ?? "#023430") : "#023430",
          boxShadow: open ? `0 0 0 3px ${(selected?.color ?? "#023430")}20` : "none",
        }}
      >
        {selected ? (
          <>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: selected.bg, border: `1.5px solid ${selected.color}40` }}
            >
              <selected.Icon size={15} style={{ color: selected.color }} />
            </div>
            <span className="flex-1 text-left font-medium" style={{ color: selected.color }}>{selected.label}</span>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <UserIcon className="h-4 w-4 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-gray-400">Select Gender</span>
          </>
        )}
        <ChevronDownIcon
          className="h-4 w-4 flex-shrink-0 transition-transform duration-200 text-gray-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-[400] mt-1 overflow-hidden rounded-xl py-1"
          style={{
            background: "var(--color-bg-surface, #fff)",
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {GENDERS.map((g) => {
            const isActive = g.value === value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => { onChange(g.value); setOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer"
                style={{ background: isActive ? `${g.color}12` : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: g.bg, border: `1.5px solid ${g.color}35` }}
                >
                  <g.Icon size={14} style={{ color: g.color }} />
                </div>
                <span className="flex-1 text-left font-medium" style={{ color: isActive ? g.color : "#374151" }}>
                  {g.label}
                </span>
                {isActive && <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: g.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COURSES.find((c) => c.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 rounded-lg border px-3 py-3 text-base bg-white transition-all"
        style={{
          borderColor: open ? (selected?.color ?? "#023430") : "#023430",
          boxShadow: open ? `0 0 0 3px ${(selected?.color ?? "#023430")}20` : "none",
        }}
      >
        {selected ? (
          <>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: selected.bg, border: `1.5px solid ${selected.color}40` }}
            >
              <selected.Icon size={15} style={{ color: selected.color }} />
            </div>
            <span className="flex-1 text-left font-medium" style={{ color: selected.color }}>{selected.label}</span>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <AcademicCapIcon className="h-4 w-4 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-gray-400">Select Course</span>
          </>
        )}
        <ChevronDownIcon
          className="h-4 w-4 flex-shrink-0 transition-transform duration-200 text-gray-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-[400] mt-1 overflow-hidden rounded-xl py-1"
          style={{
            background: "var(--color-bg-surface, #fff)",
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {COURSES.map((course) => {
            const isActive = course.value === value;
            return (
              <button
                key={course.value}
                type="button"
                onClick={() => { onChange(course.value); setOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer"
                style={{
                  background: isActive ? `${course.color}12` : "transparent",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: course.bg, border: `1.5px solid ${course.color}35` }}
                >
                  <course.Icon size={14} style={{ color: course.color }} />
                </div>
                <span className="flex-1 text-left font-medium" style={{ color: isActive ? course.color : "#374151" }}>
                  {course.label}
                </span>
                {isActive && <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: course.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StudentFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<Student>;
  isSubmitting?: boolean;
}

export function StudentForm({ onSubmit, onCancel, defaultValues, isSubmitting }: StudentFormProps) {
  const isEdit = !!defaultValues?._id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(studentSchema),
    defaultValues: {
      photo: defaultValues?.photo ?? null,
      admissionNo: defaultValues?.admissionNo ?? "",
      name: defaultValues?.name ?? "",
      mobile: defaultValues?.mobile ?? "",
      email: defaultValues?.email ?? "",
      gender: defaultValues?.gender ?? "",
      city: defaultValues?.city ?? "",
      course: defaultValues?.course ?? "",
      stream: defaultValues?.stream ?? "",
      courseTakenDate: defaultValues?.courseTakenDate ?? "",
      joinedDate: defaultValues?.joinedDate
        ?? (defaultValues?.admissionMonth ? `${defaultValues.admissionMonth}-01` : new Date().toISOString().slice(0, 10)),
      placementStatus: defaultValues?.placementStatus ?? "Not Placed",
      admissionMonth: defaultValues?.admissionMonth ?? "",
      totalFee: defaultValues?.totalFee ?? undefined,
      totalPaid: defaultValues?.totalPaid ?? undefined,
      pendingAmount: defaultValues?.pendingAmount ?? undefined,
      dueDate: defaultValues?.dueDate ?? new Date().toISOString().slice(0, 10),
      passoutYear: defaultValues?.passoutYear ?? undefined,
      paymentMode: defaultValues?.paymentMode ?? "",
      receiptNo: defaultValues?.receiptNo ?? "",
    },
  });

  // For new students, auto-generate and lock admissionNo + receiptNo
  useEffect(() => {
    if (isEdit) return;
    fetchNextAdmissionNumber()
      .then(({ admissionNo, receiptNo }) => {
        setValue("admissionNo", admissionNo);
        setValue("receiptNo", receiptNo);
      })
      .catch(() => {/* keep blank if API fails */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-set only courseTakenDate for new students (joinedDate/dueDate come from defaultValues)
  useEffect(() => {
    if (isEdit) return;
    const today = new Date().toISOString().slice(0, 10);
    setValue("courseTakenDate", today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photo = watch("photo") ?? null;
  const totalFee = watch("totalFee");
  const totalPaid = watch("totalPaid");
  const pendingDisplay = watch("pendingAmount");
  const hasPending = Number(pendingDisplay) > 0;
  const joinedDateValue = watch("joinedDate");

  // Derive admissionMonth reactively from the user-selected joinedDate
  useEffect(() => {
    if (!joinedDateValue) return;
    const [y, m] = joinedDateValue.split("-");
    if (y && m) setValue("admissionMonth", `${y}-${m}`);
  }, [joinedDateValue, setValue]);

  // Real-time pending amount calculation
  useEffect(() => {
    const fee = Number(totalFee) || 0;
    const paid = Number(totalPaid) || 0;
    setValue("pendingAmount", Math.max(0, fee - paid), { shouldValidate: false });
  }, [totalFee, totalPaid, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {/* PHOTO UPLOAD */}
      <div className="sm:col-span-2 lg:col-span-3">
        <StudentPhotoUpload
          photo={photo}
          setPhoto={(val) => setValue("photo", val)}
        />
      </div>

      {/* ADMISSION NO â€” auto-generated, read-only */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Admission Number</label>
        <div className="relative">
          <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow" />
          <input
            {...register("admissionNo")}
            readOnly
            placeholder="Auto-generated…"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base font-mono bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-red-500">{errors.admissionNo?.message}</p>
      </div>

      {/* FULL NAME */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow" />
          <input
            {...register("name")}
            placeholder="Full Name"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.name?.message}</p>
      </div>

      {/* MOBILE */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Mobile Number</label>
        <div className="flex items-center rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
          <span className="flex items-center gap-1.5 flex-shrink-0 px-3 py-3 text-base font-medium text-gray-500 bg-gray-50 border-r border-gray-200">
            <PhoneIcon className="h-3.5 w-3.5 text-emerald-500 drop-shadow" />
            +91
          </span>
          <input
            {...register("mobile")}
            placeholder="10-digit number"
            maxLength={10}
            className="flex-1 px-3 py-3 text-base outline-none bg-white"
          />
        </div>
        <p className="text-xs text-red-500">{errors.mobile?.message}</p>
      </div>

      {/* EMAIL */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
        <div className="relative">
          <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 drop-shadow" />
          <input
            {...register("email")}
            placeholder="Email"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.email?.message}</p>
      </div>

      {/* GENDER */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Gender</label>
        <GenderDropdown
          value={watch("gender") ?? ""}
          onChange={(v) => setValue("gender", v, { shouldValidate: true })}
        />
        <p className="text-xs text-red-500">{errors.gender?.message}</p>
      </div>

      {/* CITY */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">City</label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 drop-shadow" />
          <input
            {...register("city")}
            placeholder="City"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.city?.message}</p>
      </div>

      {/* COURSE */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Course</label>
        <CourseDropdown
          value={watch("course") ?? ""}
          onChange={(v) => setValue("course", v, { shouldValidate: true })}
        />
        <p className="text-xs text-red-500">{errors.course?.message}</p>
      </div>

      {/* STREAM */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Stream</label>
        <div className="relative">
          <BookOpenIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400 drop-shadow" />
          <input
            {...register("stream")}
            placeholder="Stream"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.stream?.message}</p>
      </div>

      {/* PLACEMENT STATUS */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Placement Status</label>
        <PlacementDropdown
          value={watch("placementStatus") ?? "Not Placed"}
          onChange={(v) => setValue("placementStatus", v as "Not Placed" | "Placed", { shouldValidate: true })}
        />
        <p className="text-xs text-red-500">{errors.placementStatus?.message}</p>
      </div>

      {/* JOINED DATE â€” defaults to today, admin can change */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Joined Date</label>
        <div className="relative">
          <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 drop-shadow" />
          <input
            type="date"
            {...register("joinedDate")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.joinedDate?.message}</p>
      </div>

      {/* TOTAL FEE */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Total Fee</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-500">₹</span>
          <input
            type="number"
            {...register("totalFee")}
            placeholder="Total Fee"
            className="w-full rounded-lg border pl-7 pr-3 py-3 text-base [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <p className="text-xs text-red-500">{errors.totalFee?.message}</p>
      </div>

      {/* TOTAL PAID */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Total Paid</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-500">₹</span>
          <input
            type="number"
            {...register("totalPaid")}
            placeholder="Total Paid"
            className="w-full rounded-lg border pl-7 pr-3 py-3 text-base [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <p className="text-xs text-red-500">{errors.totalPaid?.message}</p>
      </div>

      {/* PENDING â€” auto-calculated, read-only */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Pending Amount</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-500">₹</span>
          <input
            type="number"
            {...register("pendingAmount")}
            value={pendingDisplay ? pendingDisplay : ""}
            readOnly
            placeholder="Pending Amount"
            className="w-full rounded-lg border pl-7 pr-3 py-3 text-base bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-red-500">{errors.pendingAmount?.message}</p>
      </div>

      {/* RECEIPT NO â€” auto-generated, read-only */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Receipt Number</label>
        <div className="relative">
          <DocumentTextIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 drop-shadow" />
          <input
            {...register("receiptNo")}
            readOnly
            placeholder="Auto-generated…"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base font-mono bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>
      </div>

      {/* PASSOUT YEAR */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Passout Year</label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 drop-shadow" />
          <input
            type="number"
            {...register("passoutYear")}
            placeholder="e.g. 2024"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.passoutYear?.message}</p>
      </div>

      {/* DUE DATE â€” enabled only when there is a pending amount */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">
          Due Date {!hasPending && <span className="text-gray-400 font-normal">(no pending amount)</span>}
        </label>
        <div className="relative">
          <ClockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400 drop-shadow" />
          <input
          type="date"
          {...register("dueDate")}
          disabled={!hasPending}
          className={`w-full rounded-lg border pl-9 pr-3 py-3 text-base transition ${
            hasPending
              ? "bg-white text-gray-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          />
          </div>
        <p className="text-xs text-red-500">{errors.dueDate?.message}</p>
      </div>

      {/* PAYMENT MODE */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Payment Mode</label>
        <PaymentModeDropdown
          value={watch("paymentMode") ?? ""}
          onChange={(v) => setValue("paymentMode", v, { shouldValidate: true })}
        />
        <p className="text-xs text-red-500">{errors.paymentMode?.message}</p>
      </div>

      {/* SUBMIT */}
      <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3 pt-2">
        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg bg-[#C70000] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C70000]/30 hover:bg-[#a80000] hover:shadow-[#C70000]/40 active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out"
        >
          Cancel
        </button>

        {/* Save */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#023430] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#023430]/30 hover:bg-[#012825] hover:shadow-[#023430]/40 active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? "Saving…" : "Save Student"}
        </button>
      </div>
    </form>
  );
}

