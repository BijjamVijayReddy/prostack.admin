"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useAuth, AuthUser } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const schema = yup.object({
  firstName: yup.string().trim().required("First name is required"),
  lastName: yup.string().trim().required("Last name is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  mobileNumber: yup
    .string()
    .trim()
    .matches(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number")
    .required("Mobile number is required"),
  username: yup.string().trim().min(4, "At least 4 characters").required("Username is required"),
  password: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .min(8, "At least 8 characters"),
  confirmPassword: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .test("match", "Passwords do not match", function (val) {
      const pwd = this.parent.password;
      if (!pwd) return true;
      return pwd === val;
    }),
});

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  username: string;
  password?: string;
  confirmPassword?: string;
};

type ToastState = { message: string; type: "success" | "error" } | null;

/* â”€â”€â”€ Floating Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FloatingToast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-start gap-3 rounded-2xl px-5 py-4 text-white shadow-2xl max-w-sm animate-slide-in ${
        isSuccess ? "bg-emerald-600" : "bg-red-600"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isSuccess ? (
          <CheckCircleIcon className="h-5 w-5" />
        ) : (
          <ExclamationCircleIcon className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          {isSuccess ? "Changes saved successfully" : "Update failed"}
        </p>
        <p className="mt-0.5 text-xs opacity-85 leading-snug">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* â”€â”€â”€ Field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Field({
  icon: Icon,
  label,
  error,
  iconColor = "text-gray-400",
  showIcon = true,
  children,
}: {
  icon: React.ElementType;
  label: string;
  error?: string;
  iconColor?: string;
  showIcon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        {showIcon && <Icon className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 drop-shadow ${iconColor}`} />}
        {children}
      </div>
      {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white py-3 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-200"
      : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"
  }`;

/* â”€â”€â”€ ProfileModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export function ProfileModal({ open, onClose, onSaved }: Props) {
  const { user, getToken, setUser } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (user && open) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        username: user.username,
        password: "",
        confirmPassword: "",
      });
      setToast(null);
    }
  }, [user, open, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setToast(null);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          mobileNumber: data.mobileNumber,
          username: data.username,
          ...(data.password ? { password: data.password } : {}),
        }),
      });

      const body = await res.json() as { user?: AuthUser & { _id?: string }; message?: string };

      if (res.ok && body.user) {
        const u = body.user;
        setUser({ ...u, id: u._id ?? u.id ?? "" });
        onSaved?.("Your profile details have been updated and saved to the database.");
        onClose();
      } else if (res.status === 409) {
        setToast({
          message: body.message ?? "A conflict was detected. Please check your email, mobile or username.",
          type: "error",
        });
      } else {
        setToast({
          message: body.message ?? "An unexpected error occurred. Please try again.",
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "Unable to connect to the server. Please check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";

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

  const lastUpdated = fmtUpdated(user?.updatedAt);

  return (
    <>
      {/* Floating toast outside the Dialog so it always renders on top */}
      {toast && (
        <FloatingToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Dialog open={open} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow">
                  {initials}
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold text-gray-900">
                    My Profile
                  </Dialog.Title>
                  <p className="text-xs text-gray-400 capitalize">{user?.role ?? "admin"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1" style={{ boxShadow: "0 2px 8px 0 rgba(99,102,241,0.25)" }}>
                    <ClockIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-medium text-indigo-500 whitespace-nowrap">
                      Last updated: <span className="font-semibold text-indigo-700">{lastUpdated}</span>
                    </span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">

                  <Field icon={UserIcon} iconColor="text-indigo-400" label="First Name" error={errors.firstName?.message}>
                    <input
                      {...register("firstName")}
                      type="text"
                      placeholder="First name"
                      className={inputClass(!!errors.firstName)}
                    />
                  </Field>

                  <Field icon={UserIcon} iconColor="text-indigo-400" label="Last Name" error={errors.lastName?.message}>
                    <input
                      {...register("lastName")}
                      type="text"
                      placeholder="Last name"
                      className={inputClass(!!errors.lastName)}
                    />
                  </Field>

                  <Field icon={EnvelopeIcon} iconColor="text-blue-400" label="Email Address" error={errors.email?.message}>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="email@example.com"
                      className={inputClass(!!errors.email)}
                    />
                  </Field>

                  <Field icon={PhoneIcon} iconColor="text-emerald-500" label="Mobile Number" error={errors.mobileNumber?.message} showIcon={false}>
                    <div className="flex items-center rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
                      <span className="flex items-center gap-1.5 flex-shrink-0 px-3 py-3 text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-200">
                        <PhoneIcon className="h-3.5 w-3.5 text-emerald-500 drop-shadow" />
                        +91
                      </span>
                      <input
                        {...register("mobileNumber")}
                        type="tel"
                        placeholder="10-digit number"
                        maxLength={10}
                        className="flex-1 px-3 py-3 text-sm text-gray-800 outline-none bg-white"
                      />
                    </div>
                  </Field>

                  <Field icon={UserIcon} iconColor="text-violet-400" label="Username" error={errors.username?.message}>
                    <input
                      {...register("username")}
                      type="text"
                      placeholder="username"
                      className={inputClass(!!errors.username)}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Change Password <span className="normal-case font-normal">(leave blank to keep current)</span>
                    </p>
                    <div className="h-px bg-gray-100" />
                  </div>

                  <Field icon={LockClosedIcon} iconColor="text-amber-500" label="New Password" error={errors.password?.message}>
                    <input
                      {...register("password")}
                      type={showPwd ? "text" : "password"}
                      placeholder="Leave blank to keep current"
                      className={`${inputClass(!!errors.password)} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer" tabIndex={-1}>
                      {showPwd ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </Field>

                  <Field icon={LockClosedIcon} iconColor="text-amber-500" label="Confirm Password" error={errors.confirmPassword?.message}>
                    <input
                      {...register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      className={`${inputClass(!!errors.confirmPassword)} pr-10`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer" tabIndex={-1}>
                      {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </Field>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button type="button" onClick={onClose}
                    className="rounded-lg bg-[#C70000] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C70000]/30 hover:bg-[#a80000] hover:shadow-[#C70000]/40 active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="rounded-lg bg-[#023430] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#023430]/30 hover:bg-[#012825] active:scale-95 active:shadow-sm cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
                    {isLoading ? "Savingâ€¦" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </>
  );
}
