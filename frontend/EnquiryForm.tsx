import { useEffect } from "react";
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
  AcademicCapIcon,
  MegaphoneIcon,
  TagIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { enquirySchema } from "../enquiry.schema";
import { Enquiry } from "../enquiry.types";
import { fetchNextEnquiryNumber } from "../enquiry.api";

interface EnquiryFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<Enquiry>;
  isSubmitting?: boolean;
}

const SOURCES = ["Walk-in", "Phone", "Online", "Referral", "Social Media"];
const STATUSES = ["Pending", "Follow-up", "Converted", "Not Interested"];
const COURSES = ["Java Full Stack", "Python Full Stack", "MERN Stack", "React JS", "Java", "Python"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function EnquiryForm({ onSubmit, onCancel, defaultValues, isSubmitting }: EnquiryFormProps) {
  const isEdit = !!defaultValues?.enquiryNo;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
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

  // Auto-generate enquiry number for new enquiries
  useEffect(() => {
    if (isEdit) return;
    fetchNextEnquiryNumber()
      .then(({ enquiryNo }) => setValue("enquiryNo", enquiryNo))
      .catch(() => {/* keep blank if API fails */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive enquiryMonth reactively from enquiryDate
  const enquiryDateValue = watch("enquiryDate");
  useEffect(() => {
    if (!enquiryDateValue) return;
    const [y, m] = enquiryDateValue.split("-");
    if (y && m) setValue("enquiryMonth", `${y}-${m}`);
  }, [enquiryDateValue, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 sm:grid-cols-2"
    >
      {/* ENQUIRY NO — auto-generated, read-only */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Enquiry Number</label>
        <div className="relative">
          <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow" />
          <input
            {...register("enquiryNo")}
            readOnly
            placeholder="Auto-generated…"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm font-mono bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-red-500">{errors.enquiryNo?.message}</p>
      </div>

      {/* ENQUIRY DATE */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Enquiry Date</label>
        <div className="relative">
          <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 drop-shadow" />
          <input
            {...register("enquiryDate")}
            type="date"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          />
        </div>
        <p className="text-xs text-red-500">{errors.enquiryDate?.message}</p>
      </div>

      {/* EXPECTED JOIN DATE */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Expected Join Date</label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 drop-shadow" />
          <input
            {...register("expectedJoinDate")}
            type="date"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          />
        </div>
        <p className="text-xs text-red-500">{errors.expectedJoinDate?.message}</p>
      </div>

      {/* FULL NAME */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 drop-shadow" />
          <input
            {...register("name")}
            placeholder="Full Name"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          />
        </div>
        <p className="text-xs text-red-500">{errors.name?.message}</p>
      </div>

      {/* MOBILE */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mobile Number</label>
        <div className="flex items-center rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
          <span className="flex items-center gap-1.5 flex-shrink-0 px-3 py-3 text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-200">
            <PhoneIcon className="h-3.5 w-3.5 text-emerald-500 drop-shadow" />
            +91
          </span>
          <input
            {...register("mobile")}
            placeholder="10-digit number"
            maxLength={10}
            className="flex-1 px-3 py-3 text-sm outline-none bg-white"
          />
        </div>
        <p className="text-xs text-red-500">{errors.mobile?.message}</p>
      </div>

      {/* EMAIL */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
        <div className="relative">
          <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 drop-shadow" />
          <input
            {...register("email")}
            placeholder="Email"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          />
        </div>
        <p className="text-xs text-red-500">{errors.email?.message}</p>
      </div>

      {/* GENDER */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400 drop-shadow" />
          <select
            {...register("gender")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <p className="text-xs text-red-500">{errors.gender?.message}</p>
      </div>

      {/* CITY */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 drop-shadow" />
          <input
            {...register("city")}
            placeholder="City"
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          />
        </div>
        <p className="text-xs text-red-500">{errors.city?.message}</p>
      </div>

      {/* COURSE — dropdown */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Course Interested In</label>
        <div className="relative">
          <AcademicCapIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 drop-shadow" />
          <select
            {...register("course")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Select Course</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-red-500">{errors.course?.message}</p>
      </div>

      {/* SOURCE */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
        <div className="relative">
          <MegaphoneIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400 drop-shadow" />
          <select
            {...register("source")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          >
            <option value="">Select Source</option>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-red-500">{errors.source?.message}</p>
      </div>

      {/* STATUS */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <div className="relative">
          <TagIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 drop-shadow" />
          <select
            {...register("status")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          >
            <option value="">Select Status</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-red-500">{errors.status?.message}</p>
      </div>

      {/* NOTES */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes / Remarks</label>
        <div className="relative">
          <PencilSquareIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 drop-shadow" />
          <textarea
            {...register("notes")}
            placeholder="Notes / Remarks"
            rows={3}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-sm"
          />
        </div>
      </div>

      <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg bg-[#C70000] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C70000]/30 hover:bg-[#a80000] hover:shadow-[#C70000]/40 active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#023430] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#023430]/30 hover:bg-[#012825] hover:shadow-[#023430]/40 active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? "Saving…" : "Save Enquiry"}
        </button>
      </div>
    </form>
  );
}
