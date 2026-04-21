import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  IdentificationIcon,
  CalendarDaysIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  CheckIcon,
  GlobeAltIcon,
  UsersIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShareIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { FaJava, FaPython, FaReact, FaMale, FaFemale } from "react-icons/fa";
import { SiMongodb, SiSpringboot } from "react-icons/si";
import type { IconType } from "react-icons";
import { enquirySchema } from "../enquiry.schema";
import { Enquiry } from "../enquiry.types";
import { fetchNextEnquiryNumber } from "../enquiry.api";

interface EnquiryFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<Enquiry>;
  isSubmitting?: boolean;
}

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const COURSE_OPTIONS: { value: string; label: string; color: string; bg: string; Icon: IconType }[] = [
  { value: "Java Full Stack",   label: "Java Full Stack",   color: "#e53935", bg: "#fde8e8", Icon: SiSpringboot },
  { value: "Python Full Stack", label: "Python Full Stack", color: "#1976d2", bg: "#e3f0fc", Icon: FaPython     },
  { value: "MERN Stack",        label: "MERN Stack",        color: "#43a047", bg: "#e5f5ec", Icon: SiMongodb    },
  { value: "React JS",          label: "React JS",          color: "#0288d1", bg: "#e0f7fa", Icon: FaReact      },
  { value: "Java",              label: "Java",              color: "#bf360c", bg: "#fbe9e7", Icon: FaJava       },
  { value: "Python",            label: "Python",            color: "#f9a825", bg: "#fffde7", Icon: FaPython     },
];

const GENDER_OPTIONS: { value: string; label: string; color: string; bg: string; Icon: IconType }[] = [
  { value: "Male",   label: "Male",   color: "#1976d2", bg: "#e3f0fc", Icon: FaMale   },
  { value: "Female", label: "Female", color: "#d81b60", bg: "#fce4ec", Icon: FaFemale },
];

const SOURCE_OPTIONS: { value: string; label: string; color: string; bg: string; Icon: HeroIcon }[] = [
  { value: "Walk-in",      label: "Walk-in",      color: "#7c3aed", bg: "#ede9fe", Icon: UserIcon      },
  { value: "Phone",        label: "Phone",        color: "#059669", bg: "#d1fae5", Icon: PhoneIcon     },
  { value: "Online",       label: "Online",       color: "#0284c7", bg: "#e0f2fe", Icon: GlobeAltIcon  },
  { value: "Referral",     label: "Referral",     color: "#d97706", bg: "#fef3c7", Icon: UsersIcon     },
  { value: "Social Media", label: "Social Media", color: "#db2777", bg: "#fce7f3", Icon: ShareIcon     },
];

const STATUS_OPTIONS: { value: string; label: string; color: string; bg: string; Icon: HeroIcon }[] = [
  { value: "Pending",        label: "Pending",        color: "#d97706", bg: "#fef3c7", Icon: ClockIcon       },
  { value: "Follow-up",      label: "Follow-up",      color: "#0284c7", bg: "#e0f2fe", Icon: ArrowPathIcon   },
  { value: "Converted",      label: "Converted",      color: "#16a34a", bg: "#dcfce7", Icon: CheckCircleIcon },
  { value: "Not Interested", label: "Not Interested", color: "#dc2626", bg: "#fee2e2", Icon: XCircleIcon     },
];

function CustomDropdown<T extends { value: string; label: string; color: string; bg: string }>({
  options, value, onChange, placeholder, FallbackIcon, renderIcon,
}: {
  options: T[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  FallbackIcon: HeroIcon;
  renderIcon: (opt: T, size: number) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm transition-all"
        style={{ borderColor: open ? (selected?.color ?? "#023430") : "#023430", boxShadow: open ? `0 0 0 3px ${(selected?.color ?? "#023430")}20` : "none" }}>
        {selected ? (
          <>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: selected.bg, border: `1.5px solid ${selected.color}40` }}>
              {renderIcon(selected, 14)}
            </div>
            <span className="flex-1 text-left font-medium" style={{ color: selected.color }}>{selected.label}</span>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <FallbackIcon className="h-4 w-4 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-gray-400">{placeholder}</span>
          </>
        )}
        <ChevronDownIcon className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[400] mt-1 overflow-hidden rounded-xl py-1"
          style={{ background: "var(--color-bg-surface, #fff)", border: "1.5px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}>
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer"
                style={{ background: isActive ? `${opt.color}12` : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: opt.bg, border: `1.5px solid ${opt.color}35` }}>
                  {renderIcon(opt, 14)}
                </div>
                <span className="flex-1 text-left font-medium" style={{ color: isActive ? opt.color : "#374151" }}>{opt.label}</span>
                {isActive && <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: opt.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function EnquiryForm({ onSubmit, onCancel, defaultValues, isSubmitting }: EnquiryFormProps) {
  const isEdit = !!defaultValues?.enquiryNo;
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(enquirySchema),
    defaultValues: {
      enquiryNo: defaultValues?.enquiryNo ?? "",
      enquiryDate: defaultValues?.enquiryDate ?? (!isEdit ? todayISO() : ""),
      enquiryMonth: defaultValues?.enquiryMonth ?? (!isEdit ? currentMonth() : ""),
      name: defaultValues?.name ?? "",
      mobile: defaultValues?.mobile ?? "",
      email: defaultValues?.email ?? "",
      gender: defaultValues?.gender ?? "",
      city: defaultValues?.city ?? "",
      course: defaultValues?.course ?? "",
      source: defaultValues?.source ?? "",
      status: defaultValues?.status ?? "",
      notes: defaultValues?.notes ?? "",
      expectedJoinDate: defaultValues?.expectedJoinDate ?? "",
    },
  });

  useEffect(() => {
    if (isEdit) return;
    fetchNextEnquiryNumber().then(({ enquiryNo }) => setValue("enquiryNo", enquiryNo)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enquiryDateValue = watch("enquiryDate");
  useEffect(() => {
    if (!enquiryDateValue) return;
    const [y, m] = enquiryDateValue.split("-");
    if (y && m) setValue("enquiryMonth", `${y}-${m}`);
  }, [enquiryDateValue, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Enquiry Number</label>
        <div className="relative">
          <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow" />
          <input {...register("enquiryNo")} readOnly placeholder="Auto-generated…" className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm font-mono bg-gray-50 text-gray-700 cursor-not-allowed" />
        </div>
        <p className="text-xs text-red-500">{errors.enquiryNo?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Enquiry Date</label>
        <div className="relative">
          <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 drop-shadow" />
          <input {...register("enquiryDate")} type="date" className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm" />
        </div>
        <p className="text-xs text-red-500">{errors.enquiryDate?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Expected Join Date</label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 drop-shadow" />
          <input {...register("expectedJoinDate")} type="date" className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm" />
        </div>
        <p className="text-xs text-red-500">{errors.expectedJoinDate?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow" />
          <input {...register("name")} placeholder="Full Name" className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm" />
        </div>
        <p className="text-xs text-red-500">{errors.name?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mobile Number</label>
        <div className="flex items-center rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
          <span className="flex items-center gap-1.5 flex-shrink-0 px-3 py-3 text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-200">
            <PhoneIcon className="h-3.5 w-3.5 text-emerald-500 drop-shadow" />+91
          </span>
          <input {...register("mobile")} placeholder="10-digit number" maxLength={10} className="flex-1 px-3 py-3 text-sm outline-none bg-white" />
        </div>
        <p className="text-xs text-red-500">{errors.mobile?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
        <div className="relative">
          <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 drop-shadow" />
          <input {...register("email")} placeholder="Email" className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
        <CustomDropdown options={GENDER_OPTIONS} value={watch("gender") ?? ""} onChange={(v) => setValue("gender", v, { shouldValidate: true })}
          placeholder="Select Gender" FallbackIcon={UserIcon}
          renderIcon={(opt, size) => <opt.Icon size={size} style={{ color: opt.color }} />} />
        <p className="text-xs text-red-500">{errors.gender?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 drop-shadow" />
          <input {...register("city")} placeholder="City" className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm" />
        </div>
        <p className="text-xs text-red-500">{errors.city?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Course Interested In</label>
        <CustomDropdown options={COURSE_OPTIONS} value={watch("course") ?? ""} onChange={(v) => setValue("course", v, { shouldValidate: true })}
          placeholder="Select Course" FallbackIcon={AcademicCapIcon}
          renderIcon={(opt, size) => <opt.Icon size={size} style={{ color: opt.color }} />} />
        <p className="text-xs text-red-500">{errors.course?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
        <CustomDropdown options={SOURCE_OPTIONS} value={watch("source") ?? ""} onChange={(v) => setValue("source", v, { shouldValidate: true })}
          placeholder="Select Source" FallbackIcon={ShareIcon}
          renderIcon={(opt, size) => <opt.Icon className="h-3.5 w-3.5" style={{ color: opt.color }} />} />
        <p className="text-xs text-red-500">{errors.source?.message}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <CustomDropdown options={STATUS_OPTIONS} value={watch("status") ?? ""} onChange={(v) => setValue("status", v, { shouldValidate: true })}
          placeholder="Select Status" FallbackIcon={BriefcaseIcon}
          renderIcon={(opt, size) => <opt.Icon className="h-3.5 w-3.5" style={{ color: opt.color }} />} />
        <p className="text-xs text-red-500">{errors.status?.message}</p>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes / Remarks</label>
        <div className="relative">
          <PencilSquareIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 drop-shadow" />
          <textarea {...register("notes")} placeholder="Notes / Remarks" rows={3} className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm" />
        </div>
      </div>
      <div className="sm:col-span-3 flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="w-full rounded-lg bg-[#C70000] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C70000]/30 hover:bg-[#a80000] active:scale-95 cursor-pointer transition-all duration-200">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-lg bg-[#023430] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#023430]/30 hover:bg-[#012825] active:scale-95 cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? "Saving…" : "Save Enquiry"}
        </button>
      </div>
    </form>
  );
}
