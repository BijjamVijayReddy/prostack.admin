"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const schema = yup.object({
  firstName:    yup.string().required("First name is required"),
  lastName:     yup.string().required("Last name is required"),
  email:        yup.string().email("Enter a valid email").required("Email is required"),
  mobileNumber: yup.string().matches(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number").required("Mobile number is required"),
  username:     yup.string().min(3, "Minimum 3 characters").required("Username is required"),
  password:     yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  username: string;
  password: string;
};

/* ─── Toast ─────────────────────────────────────────────── */
function Toast({
  message,
  type = "error",
  onClose,
}: {
  message: string;
  type?: "error" | "success";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "success" ? "bg-emerald-600" : "bg-red-600";
  const Icon = type === "success" ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 rounded-2xl ${bg} px-5 py-4 text-white shadow-2xl animate-slide-in max-w-sm`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button onClick={onClose} className="ml-auto shrink-0 opacity-70 hover:opacity-100 transition cursor-pointer">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Signup Page ─────────────────────────────────────────── */
export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => { document.title = "ProStack - Create Account"; }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { message?: string };

      if (res.ok) {
        setToast({ message: "Account created! Redirecting to login…", type: "success" });
        setTimeout(() => router.replace("/login"), 1800);
      } else if (res.status === 409) {
        const msg = json.message ?? "";
        if (msg.toLowerCase().includes("email"))        setError("email",        { message: msg });
        else if (msg.toLowerCase().includes("mobile"))  setError("mobileNumber", { message: msg });
        else if (msg.toLowerCase().includes("username")) setError("username",    { message: msg });
        else setToast({ message: msg, type: "error" });
      } else {
        setToast({ message: json.message ?? "Registration failed. Please try again.", type: "error" });
      }
    } catch {
      setToast({ message: "Unable to reach server. Please try again later.", type: "error" });
    }
    setIsLoading(false);
  };

  const field = (
    label: string,
    name: keyof FormValues,
    opts: {
      type?: string;
      placeholder: string;
      icon: React.ReactNode;
      suffix?: React.ReactNode;
      autoComplete?: string;
    }
  ) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
          {opts.icon}
        </span>
        <input
          {...register(name)}
          type={opts.type ?? "text"}
          autoComplete={opts.autoComplete}
          placeholder={opts.placeholder}
          className={`w-full rounded-xl border bg-white/5 py-3 pl-10 ${opts.suffix ? "pr-11" : "pr-4"} text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2
            ${errors[name]
              ? "border-red-500 focus:ring-red-500/40"
              : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/30"
            }`}
        />
        {opts.suffix}
      </div>
      {errors[name] && (
        <p className="text-xs text-red-400 mt-0.5">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative min-h-screen w-full bg-[#060C1A] flex flex-col items-center justify-center p-4 py-10 overflow-hidden">

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        {/* Card */}
        <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl p-8">

          {/* Logo + Brand */}
          <div className="mb-7 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 overflow-hidden">
              <Image src="/proStacklogo.png" alt="ProStack Logo" width={48} height={48} className="object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
              <p className="mt-1 text-sm text-gray-400">Register as a ProStack admin</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              {field("First Name", "firstName", { placeholder: "First name", icon: <UserIcon className="h-4 w-4" /> })}
              {field("Last Name",  "lastName",  { placeholder: "Last name",  icon: <UserIcon className="h-4 w-4" /> })}
            </div>

            {field("Email", "email", {
              type: "email",
              placeholder: "you@example.com",
              icon: <EnvelopeIcon className="h-4 w-4" />,
              autoComplete: "email",
            })}

            {field("Mobile Number", "mobileNumber", {
              placeholder: "10-digit mobile number",
              icon: <PhoneIcon className="h-4 w-4" />,
              autoComplete: "tel",
            })}

            {field("Username", "username", {
              placeholder: "Choose a username",
              icon: <UserIcon className="h-4 w-4" />,
              autoComplete: "username",
            })}

            {field("Password", "password", {
              type: showPassword ? "text" : "password",
              placeholder: "Min. 6 characters",
              icon: <LockClosedIcon className="h-4 w-4" />,
              autoComplete: "new-password",
              suffix: (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              ),
            })}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.98] cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-5 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-600">
          © {new Date().getFullYear()} ProStack. All rights reserved.
        </p>
      </div>

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
