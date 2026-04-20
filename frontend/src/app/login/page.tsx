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
  UserPlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

/* â”€â”€â”€ Schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const loginSchema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});
type LoginValues = yup.InferType<typeof loginSchema>;

const findSchema = yup.object({
  identifier: yup.string().required("Please enter your username, email or mobile number"),
});
type FindValues = yup.InferType<typeof findSchema>;

const resetSchema = yup.object({
  newPassword:     yup.string().min(6, "Minimum 6 characters").required("New password is required"),
  confirmPassword: yup.string()
    .required("Please confirm your password")
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .defined(),
});
type ResetValues = yup.InferType<typeof resetSchema>;

/* â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  const bg   = type === "success" ? "bg-emerald-600" : "bg-red-600";
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

/* â”€â”€â”€ Spinner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
    </svg>
  );
}

/* â”€â”€â”€ Login Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type Mode = "login" | "find" | "reset";

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();

  const [mode,            setMode]            = useState<Mode>("login");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [foundIdentifier, setFoundIdentifier] = useState("");
  const [foundName,       setFoundName]       = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => { document.title = "ProStack - Login"; }, []);

  /* Login form */
  const {
    register: regLogin,
    handleSubmit: handleLogin,
    setError: setLoginError,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({ resolver: yupResolver(loginSchema) });

  /* Find-user form */
  const {
    register: regFind,
    handleSubmit: handleFind,
    formState: { errors: findErrors },
    reset: resetFind,
  } = useForm<FindValues>({ resolver: yupResolver(findSchema) });

  /* Reset-password form */
  const {
    register: regReset,
    handleSubmit: handleReset,
    formState: { errors: resetErrors },
    reset: resetResetForm,
  } = useForm<ResetValues>({ resolver: yupResolver(resetSchema) });

  /* â”€â”€ Handlers â”€â”€ */
  const onLogin = async (data: LoginValues) => {
    setIsLoading(true);
    const result = await login(data.username, data.password);
    if (result === "ok") {
      router.replace("/");
    } else if (result === "invalid") {
      setLoginError("username", { message: " " });
      setLoginError("password", { message: " " });
      setToast({ message: "Invalid username or password. Please try again.", type: "error" });
    } else {
      setToast({ message: "Unable to reach server. Please try again later.", type: "error" });
    }
    setIsLoading(false);
  };

  const onFind = async (data: FindValues) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/find-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier }),
      });
      const json = await res.json() as { found?: boolean; name?: string; message?: string };
      if (res.ok && json.found) {
        setFoundIdentifier(data.identifier);
        setFoundName(json.name ?? "User");
        setMode("reset");
      } else {
        setToast({ message: json.message ?? "Account not found.", type: "error" });
      }
    } catch {
      setToast({ message: "Unable to reach server. Please try again later.", type: "error" });
    }
    setIsLoading(false);
  };

  const onReset = async (data: ResetValues) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: foundIdentifier, newPassword: data.newPassword }),
      });
      const json = await res.json() as { message?: string };
      if (res.ok) {
        setToast({ message: "Password reset successfully! You can now sign in.", type: "success" });
        resetResetForm();
        resetFind();
        setMode("login");
      } else {
        setToast({ message: json.message ?? "Reset failed. Please try again.", type: "error" });
      }
    } catch {
      setToast({ message: "Unable to reach server. Please try again later.", type: "error" });
    }
    setIsLoading(false);
  };

  const goBack = () => {
    setMode("login");
    setFoundIdentifier("");
    setFoundName("");
    resetFind();
    resetResetForm();
  };

  /* â”€â”€ Shared input class helper â”€â”€ */
  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 ${
      hasError
        ? "border-red-500 focus:ring-red-500/40"
        : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/30"
    }`;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative min-h-screen w-full bg-[#060C1A] flex flex-col items-center justify-center p-4 py-10 overflow-hidden">

        {/* Grid */}
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
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl p-8 transition-all duration-300">

          {/* Logo + Brand */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 overflow-hidden">
              <Image src="/proStacklogo.png" alt="ProStack Logo" width={48} height={48} className="object-contain" />
            </div>
            <div className="text-center">
              {mode === "login" && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
                  <p className="mt-1 text-sm text-gray-400">Sign in to your ProStack account</p>
                </>
              )}
              {mode === "find" && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
                  <p className="mt-1 text-sm text-gray-400">Enter your username, email or mobile to continue</p>
                </>
              )}
              {mode === "reset" && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-white">New Password</h1>
                  <p className="mt-1 text-sm text-gray-400">Set a new password for your account</p>
                </>
              )}
            </div>
          </div>

          {/* â”€â”€ LOGIN MODE â”€â”€ */}
          {mode === "login" && (
            <form onSubmit={handleLogin(onLogin)} className="space-y-5" noValidate>

              {/* Identifier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Username / Email / Mobile</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...regLogin("username")}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter Username, Email or Mobile Number"
                    className={inputCls(!!loginErrors.username)}
                  />
                </div>
              </div>

              {/* Password + Forgot link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...regLogin("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`${inputCls(!!loginErrors.password)} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("find")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#023430] py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#012825] active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Signing in...</span> : "Sign In"}
              </button>
            </form>
          )}

          {/* â”€â”€ FIND USER MODE â”€â”€ */}
          {mode === "find" && (
            <form onSubmit={handleFind(onFind)} className="space-y-5" noValidate>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Username / Email / Mobile Number
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...regFind("identifier")}
                    type="text"
                    autoComplete="off"
                    placeholder="Enter your username, email or mobile"
                    className={inputCls(!!findErrors.identifier)}
                  />
                </div>
                {findErrors.identifier && (
                  <p className="text-xs text-red-400 mt-0.5">{findErrors.identifier.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Searching...</span> : "Find My Account"}
              </button>

              <button
                type="button"
                onClick={goBack}
                className="flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer pt-1"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to Sign In
              </button>
            </form>
          )}

          {/* â”€â”€ RESET PASSWORD MODE â”€â”€ */}
          {mode === "reset" && (
            <form onSubmit={handleReset(onReset)} className="space-y-5" noValidate>

              {/* Found user banner */}
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Account found</p>
                  <p className="text-sm text-white font-medium">{foundName}</p>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <KeyIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...regReset("newPassword")}
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className={`${inputCls(!!resetErrors.newPassword)} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="text-xs text-red-400 mt-0.5">{resetErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...regReset("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    className={`${inputCls(!!resetErrors.confirmPassword)} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-0.5">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Resetting...</span> : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => setMode("find")}
                className="flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer pt-1"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Try a different account
              </button>
            </form>
          )}

          {/* Bottom bar */}
          {mode === "login" && (
            <div className="mt-5 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                style={{ color: "#f7b205" }}
              >
                <UserPlusIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "#f7b205" }} />
                <span>New to ProStack? Register your admin account here</span>
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-600">
          Â© {new Date().getFullYear()} ProStack. All rights reserved.
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
