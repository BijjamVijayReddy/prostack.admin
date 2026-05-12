"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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

type FormValues = yup.InferType<typeof schema>;

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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
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
      const json = await res.json() as { message?: string; pending?: boolean };

      if (res.ok || res.status === 202) {
        setPendingApproval(true);
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
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500">
          {opts.icon}
        </span>
        <input
          {...register(name)}
          type={opts.type ?? "text"}
          autoComplete={opts.autoComplete}
          placeholder={opts.placeholder}
          className={`w-full rounded-xl border bg-gray-50 py-3 pl-10 ${opts.suffix ? "pr-11" : "pr-4"} text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:bg-white
            ${errors[name]
              ? "border-red-400 focus:ring-red-400/20"
              : "border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
            }`}
        />
        {opts.suffix}
      </div>
      {errors[name] && (
        <p className="text-xs text-red-500 mt-0.5">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-screen w-full flex" style={{ background: "#f1f5f9" }}>

        {/* ── LEFT: Form Panel ── */}
        <div className="flex flex-col justify-center w-full lg:w-[45%] px-8 py-10 lg:px-14 overflow-y-auto" style={{ background: "#f0f0f0" }}>
          <div className="w-full max-w-[400px] mx-auto">

            {/* Logo + Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center" style={{ background: "#ea580c" }}>
                <Image src="/proStacklogo.png" alt="ProStack" width={30} height={30} className="object-contain" />
              </div>
              <span className="text-base font-bold text-gray-800 tracking-wide">ProStack</span>
            </div>

            {/* ── Pending Approval Screen ── */}
            {pendingApproval ? (
              <div className="flex flex-col items-center text-center gap-5">
                <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="h-10 w-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Registration Submitted!</h2>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Your account is <strong className="text-orange-500">pending super-admin approval</strong>. You will receive an email once your account is reviewed.
                  </p>
                </div>
                <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-left space-y-2">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">What happens next?</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600"><span className="text-orange-400 font-bold mt-0.5">1.</span><span>The super-admin receives your registration details by email.</span></div>
                  <div className="flex items-start gap-2 text-sm text-gray-600"><span className="text-orange-400 font-bold mt-0.5">2.</span><span>They click <strong>Approve</strong> or <strong>Reject</strong> in the email.</span></div>
                  <div className="flex items-start gap-2 text-sm text-gray-600"><span className="text-orange-400 font-bold mt-0.5">3.</span><span>You get an email notification with the result.</span></div>
                  <div className="flex items-start gap-2 text-sm text-gray-600"><span className="text-orange-400 font-bold mt-0.5">4.</span><span>If approved, you can sign in immediately.</span></div>
                </div>
                <Link href="/login" className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            ) : (
            <>
            <div className="mb-7">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create your account</h1>
              <p className="mt-2 text-sm text-gray-500">Register as a ProStack admin</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                ),
              })}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
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

            <div className="mt-5 flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Already have an account? Sign in
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-400 text-center">
              © {new Date().getFullYear()} ProStack. All rights reserved.
            </p>
            </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Illustration Panel ── */}
        <div className="hidden lg:flex flex-col justify-center items-center w-[55%] relative overflow-hidden sticky top-0 h-screen" style={{ background: "linear-gradient(145deg, #f97316 0%, #ea580c 45%, #c2410c 100%)" }}>
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/50 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />
          <div className="animate-float3d">
          <svg viewBox="0 0 540 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[460px] max-w-[85%] drop-shadow-2xl">
            <ellipse cx="270" cy="468" rx="180" ry="10" fill="rgba(79,70,229,0.10)" />
            <rect x="60" y="30" width="240" height="380" rx="20" fill="white" stroke="#e8ebff" strokeWidth="1" />
            <rect x="60" y="30" width="240" height="50" rx="20" fill="#f5f7ff" />
            <rect x="60" y="60" width="240" height="20" fill="#f5f7ff" />
            <rect x="150" y="48" width="80" height="8" rx="4" fill="#c7d2fe" />
            <circle cx="180" cy="132" r="40" fill="#eef2ff" />
            <circle cx="180" cy="116" r="16" fill="#c7d2fe" />
            <ellipse cx="180" cy="154" rx="24" ry="18" fill="#c7d2fe" />
            <circle cx="208" cy="158" r="14" fill="#4f46e5" />
            <rect x="201" y="156" width="14" height="4" rx="2" fill="white" />
            <rect x="206" y="151" width="4" height="14" rx="2" fill="white" />
            <rect x="84" y="188" width="192" height="32" rx="8" fill="#f5f7ff" stroke="#e8ebff" strokeWidth="1" />
            <rect x="100" y="200" width="80" height="8" rx="4" fill="#c7d2fe" />
            <rect x="84" y="230" width="192" height="32" rx="8" fill="#f5f7ff" stroke="#e8ebff" strokeWidth="1" />
            <rect x="100" y="242" width="100" height="8" rx="4" fill="#c7d2fe" />
            <rect x="84" y="272" width="192" height="32" rx="8" fill="#f5f7ff" stroke="#e8ebff" strokeWidth="1" />
            <rect x="100" y="284" width="64" height="8" rx="4" fill="#c7d2fe" />
            <rect x="84" y="314" width="192" height="32" rx="8" fill="#f5f7ff" stroke="#e8ebff" strokeWidth="1" />
            <rect x="100" y="326" width="72" height="8" rx="4" fill="#c7d2fe" />
            <rect x="84" y="360" width="192" height="36" rx="10" fill="#4f46e5" />
            <rect x="138" y="374" width="84" height="8" rx="4" fill="white" />
            <rect x="322" y="50" width="160" height="76" rx="14" fill="white" stroke="#e8ebff" strokeWidth="1" />
            <circle cx="356" cy="88" r="20" fill="#dbeafe" />
            <circle cx="356" cy="80" r="8" fill="#93c5fd" />
            <ellipse cx="356" cy="100" rx="13" ry="10" fill="#93c5fd" />
            <rect x="385" y="77" width="80" height="8" rx="4" fill="#e8ebff" />
            <rect x="385" y="93" width="56" height="7" rx="3.5" fill="#e8ebff" />
            <circle cx="469" cy="54" r="12" fill="#4ade80" />
            <path d="M463 54 L467 58 L475 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="322" y="148" width="160" height="76" rx="14" fill="white" stroke="#e8ebff" strokeWidth="1" />
            <circle cx="356" cy="186" r="20" fill="#fce7f3" />
            <circle cx="356" cy="178" r="8" fill="#f9a8d4" />
            <ellipse cx="356" cy="198" rx="13" ry="10" fill="#f9a8d4" />
            <rect x="385" y="175" width="80" height="8" rx="4" fill="#e8ebff" />
            <rect x="385" y="191" width="56" height="7" rx="3.5" fill="#e8ebff" />
            <circle cx="469" cy="152" r="12" fill="#4ade80" />
            <path d="M463 152 L467 156 L475 148" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="322" y="246" width="160" height="76" rx="14" fill="white" stroke="#e8ebff" strokeWidth="1" />
            <circle cx="356" cy="284" r="20" fill="#fef3c7" />
            <circle cx="356" cy="276" r="8" fill="#fcd34d" />
            <ellipse cx="356" cy="296" rx="13" ry="10" fill="#fcd34d" />
            <rect x="385" y="273" width="80" height="8" rx="4" fill="#e8ebff" />
            <rect x="385" y="289" width="56" height="7" rx="3.5" fill="#e8ebff" />
            <circle cx="469" cy="250" r="12" fill="#a78bfa" />
            <rect x="463" y="248" width="12" height="4" rx="2" fill="white" />
            <line x1="300" y1="88" x2="322" y2="88" stroke="#c7d2fe" strokeWidth="2" strokeDasharray="4 3" />
            <line x1="300" y1="186" x2="322" y2="186" stroke="#c7d2fe" strokeWidth="2" strokeDasharray="4 3" />
            <line x1="300" y1="284" x2="322" y2="284" stroke="#c7d2fe" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          </div>
          <div className="mt-8 text-center px-14 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-2xl font-bold text-white">Join your team</h2>
            <p className="mt-2 text-sm text-orange-100 leading-relaxed max-w-sm mx-auto">
              Create your ProStack admin account and start managing students, placements and enquiries today.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes float3d {
          0%,100% { transform: perspective(900px) rotateX(3deg) rotateY(-4deg) translateY(0px); }
          33%      { transform: perspective(900px) rotateX(-1deg) rotateY(4deg) translateY(-10px); }
          66%      { transform: perspective(900px) rotateX(4deg) rotateY(1deg) translateY(-5px); }
        }
        .animate-float3d { animation: float3d 8s ease-in-out infinite; will-change: transform; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
      `}</style>
    </>
  );
}
