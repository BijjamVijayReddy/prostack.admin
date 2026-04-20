"use client";

import { useRef, useState } from "react";
import { UserCircleIcon, CameraIcon } from "@heroicons/react/24/outline";
import { Placement } from "../placment.types";

const COURSES = [
  "Java Full Stack",
  "Python Full Stack",
  "MERN Stack",
  "React JS",
  "Java",
  "Python",
  "Data Science",
  "Cloud Computing",
  "Others",
];

type FormValues = Omit<Placement, "_id" | "createdAt" | "updatedAt">;

interface Props {
  initial?: Partial<FormValues>;
  saving?: boolean;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

const empty: FormValues = {
  photo: null,
  firstName: "",
  secondName: "",
  courseTaken: "",
  joinedInstitutionDate: "",
  joinedCompanyDate: "",
  jobOfferDate: "",
  companyName: "",
  packageLakhs: 0,
  reviewGiven: "Not Given",
  howGotJob: "Institution",
  documentsRequired: "No",
  bgvRequired: "No",
  consentSocialMedia: false,
};

export function PlacementForm({ initial, saving, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormValues>({
    ...empty,
    ...initial,
    // Ensure jobOfferDate is never undefined — JSON.stringify silently drops undefined fields
    jobOfferDate: initial?.jobOfferDate ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const photoRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handlePhoto(file: File) {
    const reader = new FileReader();
    reader.onloadend = () => set("photo", reader.result as string);
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormValues, string>> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.secondName.trim()) e.secondName = "Last name is required";
    if (!form.courseTaken) e.courseTaken = "Course is required";
    if (!form.joinedInstitutionDate) e.joinedInstitutionDate = "Institution join date is required";
    if (!form.joinedCompanyDate) e.joinedCompanyDate = "Company join date is required";
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.packageLakhs || form.packageLakhs <= 0) e.packageLakhs = "Enter a valid package";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";
  const errorCls = "mt-1 text-[11px] text-red-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* PHOTO */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          {form.photo ? (
            <img src={form.photo} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-indigo-200" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
              <UserCircleIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 cursor-pointer shadow"
            title="Upload photo"
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          <p className="font-medium text-gray-700">Upload Photo</p>
          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · Max 2 MB</p>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
        />
      </div>

      {/* ROW: First + Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name <span className="text-red-400">*</span></label>
          <input className={inputCls} placeholder="e.g. Ravi" value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)} />
          {errors.firstName && <p className={errorCls}>{errors.firstName}</p>}
        </div>
        <div>
          <label className={labelCls}>Last Name <span className="text-red-400">*</span></label>
          <input className={inputCls} placeholder="e.g. Kumar" value={form.secondName}
            onChange={(e) => set("secondName", e.target.value)} />
          {errors.secondName && <p className={errorCls}>{errors.secondName}</p>}
        </div>
      </div>

      {/* Course */}
      <div>
        <label className={labelCls}>Course Taken <span className="text-red-400">*</span></label>
        <select className={inputCls} value={form.courseTaken}
          onChange={(e) => set("courseTaken", e.target.value)}>
          <option value="">— Select Course —</option>
          {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.courseTaken && <p className={errorCls}>{errors.courseTaken}</p>}
      </div>

      {/* ROW: Dates */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Joined Institution Date <span className="text-red-400">*</span></label>
          <input type="date" className={inputCls} value={form.joinedInstitutionDate}
            onChange={(e) => set("joinedInstitutionDate", e.target.value)} />
          {errors.joinedInstitutionDate && <p className={errorCls}>{errors.joinedInstitutionDate}</p>}
        </div>
        <div>
          <label className={labelCls}>Joined Company Date <span className="text-red-400">*</span></label>
          <input type="date" className={inputCls} value={form.joinedCompanyDate}
            onChange={(e) => set("joinedCompanyDate", e.target.value)} />
          {errors.joinedCompanyDate && <p className={errorCls}>{errors.joinedCompanyDate}</p>}
        </div>
        <div>
          <label className={labelCls}>Job Offer Date <span className="text-red-400">*</span></label>
          <input type="date" className={inputCls} value={form.jobOfferDate}
            onChange={(e) => set("jobOfferDate", e.target.value)} />
          {errors.jobOfferDate && <p className={errorCls}>{errors.jobOfferDate}</p>}
        </div>
      </div>

      {/* ROW: Company + Package */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Company Name <span className="text-red-400">*</span></label>
          <input className={inputCls} placeholder="e.g. Infosys" value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)} />
          {errors.companyName && <p className={errorCls}>{errors.companyName}</p>}
        </div>
        <div>
          <label className={labelCls}>Package (in Lakhs) <span className="text-red-400">*</span></label>
          <input type="number" min="0" step="0.1" className={inputCls} placeholder="e.g. 4.5"
            value={form.packageLakhs || ""}
            onChange={(e) => set("packageLakhs", parseFloat(e.target.value) || 0)} />
          {errors.packageLakhs && <p className={errorCls}>{errors.packageLakhs}</p>}
        </div>
      </div>

      {/* ROW: Review + How Got Job */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Review</label>
          <select className={inputCls} value={form.reviewGiven}
            onChange={(e) => set("reviewGiven", e.target.value as FormValues["reviewGiven"])}>
            <option value="Not Given">Not Given</option>
            <option value="Given">Given</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>How Got Job</label>
          <select className={inputCls} value={form.howGotJob}
            onChange={(e) => set("howGotJob", e.target.value as FormValues["howGotJob"])}>
            <option value="Institution">Institution</option>
            <option value="Referral">Referral</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Naukari">Naukari</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      {/* ROW: Documents + BGV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Documents Required?</label>
          <select className={inputCls} value={form.documentsRequired}
            onChange={(e) => set("documentsRequired", e.target.value as "Yes" | "No")}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>BGV Required?</label>
          <select className={inputCls} value={form.bgvRequired}
            onChange={(e) => set("bgvRequired", e.target.value as "Yes" | "No")}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>

      {/* Consent Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.consentSocialMedia}
          onChange={(e) => set("consentSocialMedia", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <span className="text-sm text-gray-700">Consent to upload on social media</span>
      </label>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg bg-[#C70000] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C70000]/30 hover:bg-[#a80000] hover:shadow-[#C70000]/40 active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:active:scale-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#023430] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#023430]/30 hover:bg-[#012825] active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </>
          ) : "Submit"}
        </button>
      </div>
    </form>
  );
}