"use client";

import { useEffect } from "react";
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
} from "@heroicons/react/24/outline";

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

      {/* ADMISSION NO — auto-generated, read-only */}
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
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400 drop-shadow" />
          <select
            {...register("gender")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
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
        <div className="relative">
          <AcademicCapIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 drop-shadow" />
          <select
            {...register("course")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
            defaultValue=""
          >
            <option value="" disabled>Select Course</option>
            <option value="Java Full Stack">Java Full Stack</option>
            <option value="Python Full Stack">Python Full Stack</option>
            <option value="MERN Stack">MERN Stack</option>
            <option value="React JS">React JS</option>
            <option value="Java">Java</option>
            <option value="Python">Python</option>
          </select>
        </div>
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
        <div className="relative">
          <BriefcaseIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 drop-shadow" />
          <select
            {...register("placementStatus")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          >
            <option value="Not Placed">Not Placed</option>
            <option value="Placed">Placed</option>
          </select>
        </div>
        <p className="text-xs text-red-500">{errors.placementStatus?.message}</p>
      </div>

      {/* JOINED DATE — defaults to today, admin can change */}
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
            className="w-full rounded-lg border pl-7 pr-3 py-3 text-base"
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
            className="w-full rounded-lg border pl-7 pr-3 py-3 text-base"
          />
        </div>
        <p className="text-xs text-red-500">{errors.totalPaid?.message}</p>
      </div>

      {/* PENDING — auto-calculated, read-only */}
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

      {/* RECEIPT NO — auto-generated, read-only */}
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

      {/* DUE DATE — enabled only when there is a pending amount */}
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
        <div className="relative">
          <CreditCardIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 drop-shadow" />
          <select
            {...register("paymentMode")}
            className="w-full rounded-lg border pl-9 pr-3 py-3 text-base"
          >
            <option value="">Select Payment Mode</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Card</option>
            <option>Cheque</option>
          </select>
        </div>
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


