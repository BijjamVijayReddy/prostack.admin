"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

/* --- Schemas -------------------------------------------- */
const loginSchema = yup.object({
  identifier: yup.string().required("Username, email or mobile is required"),
  password:   yup.string().required("Password is required"),
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

/* --- Toast --------------------------------------------- */
function Toast({ message, type = "error", onClose }: {
  message: string; type?: "error" | "success"; onClose: () => void;
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

/* --- Spinner -------------------------------------------- */
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
    </svg>
  );
}

/* --- OTP Boxes ------------------------------------------ */
const OTP_LEN = 6;
function OtpBoxes({ value, onChange, disabled, hasError }: {
  value: string[]; onChange: (v: string[]) => void; disabled?: boolean; hasError?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[idx]) { const n = [...value]; n[idx] = ""; onChange(n); }
      else if (idx > 0) refs.current[idx - 1]?.focus();
    }
  };
  const handleChange = (idx: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const n = [...value]; n[idx] = digit; onChange(n);
    if (digit && idx < OTP_LEN - 1) refs.current[idx + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    e.preventDefault();
    const n = Array(OTP_LEN).fill("");
    pasted.split("").forEach((d, i) => { n[i] = d; });
    onChange(n);
    refs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
  };
  const border = hasError
    ? "border-red-500 focus:ring-red-500/40"
    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/30";
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: OTP_LEN }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`h-12 w-11 rounded-xl border bg-white/5 text-center text-lg font-bold text-white outline-none transition focus:ring-2 disabled:opacity-50 ${border}`}
        />
      ))}
    </div>
  );
}

/* --- Login Page ----------------------------------------- */
type Mode = "login" | "otp" | "find" | "reset-otp" | "reset";

export default function LoginPage() {
  const { loginWithToken } = useAuth();
  const router = useRouter();

  const [mode,         setMode]         = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  /* Login OTP state */
  const [loginOtpEmail,       setLoginOtpEmail]       = useState("");
  const [loginOtpMaskedEmail, setLoginOtpMaskedEmail] = useState("");
  const [loginOtpDigits, setLoginOtpDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [loginOtpError,  setLoginOtpError]  = useState("");
  const [loginCountdown, setLoginCountdown] = useState(0);
  const loginCredRef = useRef<{ identifier: string; password: string } | null>(null);

  /* Reset-password OTP state */
  const [resetFoundName,   setResetFoundName]   = useState("");
  const [resetEmail,       setResetEmail]        = useState("");
  const [resetMaskedEmail, setResetMaskedEmail] = useState("");
  const [resetOtpDigits,   setResetOtpDigits]   = useState<string[]>(Array(OTP_LEN).fill(""));
  const [resetOtpError,    setResetOtpError]    = useState("");
  const [resetCountdown,   setResetCountdown]   = useState(0);
  const [resetToken,       setResetToken]       = useState("");
  const resetIdentifierRef = useRef("");

  useEffect(() => { document.title = "ProStack - Login"; }, []);

  /* Countdown timers */
  useEffect(() => {
    if (loginCountdown <= 0) return;
    const t = setTimeout(() => setLoginCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [loginCountdown]);

  useEffect(() => {
    if (resetCountdown <= 0) return;
    const t = setTimeout(() => setResetCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCountdown]);

  /* Forms */
  const { register: regLogin, handleSubmit: handleLogin, setError: setLoginError, formState: { errors: loginErrors } } =
    useForm<LoginValues>({ resolver: yupResolver(loginSchema) });

  const { register: regFind, handleSubmit: handleFind, formState: { errors: findErrors }, reset: resetFind } =
    useForm<FindValues>({ resolver: yupResolver(findSchema) });

  const { register: regReset, handleSubmit: handleReset, formState: { errors: resetErrors }, reset: resetResetForm } =
    useForm<ResetValues>({ resolver: yupResolver(resetSchema) });

  /* ── Login handlers ── */
  const requestLoginOtp = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json() as { mfaRequired?: boolean; email?: string; maskedEmail?: string; message?: string };
    console.log("[login response]", json);
    if (res.ok && json.mfaRequired) {
      setLoginOtpEmail(json.email ?? "");
      setLoginOtpMaskedEmail(json.maskedEmail ?? "");
      return true;
    }
    if (res.status === 401) setToast({ message: "Invalid credentials. Please try again.", type: "error" });
    else setToast({ message: json.message ?? "Unable to reach server. Please try again later.", type: "error" });
    return false;
  }, []);

  const onLogin = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      loginCredRef.current = { identifier: data.identifier, password: data.password };
      const ok = await requestLoginOtp(data.identifier, data.password);
      if (ok) {
        setLoginOtpDigits(Array(OTP_LEN).fill("")); setLoginOtpError(""); setLoginCountdown(30); setMode("otp");
      } else {
        setLoginError("identifier", { message: " " }); setLoginError("password", { message: " " });
      }
    } catch { setToast({ message: "Unable to reach server. Please try again later.", type: "error" }); }
    setIsLoading(false);
  };

  const onLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = loginOtpDigits.join("");
    if (otp.length < OTP_LEN) { setLoginOtpError("Please enter the complete 6-digit OTP."); return; }
    setIsLoading(true); setLoginOtpError("");
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginOtpEmail, otp }),
      });
      const json = await res.json() as { token?: string; message?: string };
      if (res.ok && json.token) { await loginWithToken(json.token); router.replace("/"); }
      else setLoginOtpError(json.message ?? "Invalid OTP. Please try again.");
    } catch { setLoginOtpError("Unable to reach server. Please try again later."); }
    setIsLoading(false);
  };

  const onLoginOtpResend = async () => {
    if (loginCountdown > 0 || !loginCredRef.current) return;
    setIsLoading(true);
    try {
      const ok = await requestLoginOtp(loginCredRef.current.identifier, loginCredRef.current.password);
      if (ok) { setLoginOtpDigits(Array(OTP_LEN).fill("")); setLoginOtpError(""); setLoginCountdown(30); setToast({ message: "OTP resent to your email.", type: "success" }); }
    } catch { setToast({ message: "Unable to resend OTP.", type: "error" }); }
    setIsLoading(false);
  };

  /* ── Reset-password handlers ── */
  const onFind = async (data: FindValues) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/find-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier }),
      });
      const json = await res.json() as { found?: boolean; name?: string; email?: string; maskedEmail?: string; message?: string };
      console.log("[find-user response]", json);
      if (res.ok && json.found) {
        resetIdentifierRef.current = data.identifier;
        setResetFoundName(json.name ?? "");
        setResetEmail(json.email ?? "");
        setResetMaskedEmail(json.maskedEmail ?? "");
        setResetOtpDigits(Array(OTP_LEN).fill(""));
        setResetOtpError("");
        setResetCountdown(30);
        setMode("reset-otp");
      } else {
        setToast({ message: json.message ?? "Account not found.", type: "error" });
      }
    } catch { setToast({ message: "Unable to reach server. Please try again later.", type: "error" }); }
    setIsLoading(false);
  };

  const onResetOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = resetOtpDigits.join("");
    if (otp.length < OTP_LEN) { setResetOtpError("Please enter the complete 6-digit OTP."); return; }
    setIsLoading(true); setResetOtpError("");
    try {
      const res  = await fetch(`${API_BASE}/api/auth/reset-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp }),
      });
      const json = await res.json() as { verified?: boolean; resetToken?: string; message?: string };
      if (res.ok && json.verified && json.resetToken) {
        setResetToken(json.resetToken);
        setMode("reset");
      } else {
        setResetOtpError(json.message ?? "Invalid OTP. Please try again.");
      }
    } catch { setResetOtpError("Unable to reach server. Please try again later."); }
    setIsLoading(false);
  };

  const onResetOtpResend = async () => {
    if (resetCountdown > 0) return;
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/find-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: resetIdentifierRef.current }),
      });
      const json = await res.json() as { found?: boolean; message?: string };
      if (res.ok && json.found) {
        setResetOtpDigits(Array(OTP_LEN).fill("")); setResetOtpError(""); setResetCountdown(30);
        setToast({ message: "OTP resent to your email.", type: "success" });
      } else {
        setToast({ message: json.message ?? "Could not resend OTP.", type: "error" });
      }
    } catch { setToast({ message: "Unable to resend OTP.", type: "error" }); }
    setIsLoading(false);
  };

  const onReset = async (data: ResetValues) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword: data.newPassword }),
      });
      const json = await res.json() as { message?: string };
      if (res.ok) {
        setToast({ message: "Password reset successfully! You can now sign in.", type: "success" });
        resetResetForm(); resetFind(); setMode("login");
      } else {
        setToast({ message: json.message ?? "Reset failed. Please try again.", type: "error" });
      }
    } catch { setToast({ message: "Unable to reach server. Please try again later.", type: "error" }); }
    setIsLoading(false);
  };

  const goBack = () => { setMode("login"); resetFind(); resetResetForm(); };

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:ring-2 ${
      hasError ? "border-red-500 focus:ring-red-500/40" : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/30"
    }`;

  /* ── Title/subtitle per mode ── */
  const headings: Record<Mode, { title: string; sub: string }> = {
    "login":     { title: "Welcome back",    sub: "Sign in to your ProStack account" },
    "otp":       { title: "Check your email", sub: `OTP sent to ${loginOtpEmail || loginOtpMaskedEmail || "your registered email"}` },
    "find":      { title: "Reset Password",  sub: "Enter your username, email or mobile to continue" },
    "reset-otp": { title: "Check your email", sub: `OTP sent to ${resetEmail || resetMaskedEmail || "your registered email"}` },
    "reset":     { title: "New Password",    sub: "OTP verified. Set a new password for your account." },
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative min-h-screen w-full bg-[#060C1A] flex flex-col items-center justify-center p-4 py-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl p-8 transition-all duration-300">

          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 overflow-hidden">
              <Image src="/proStacklogo.png" alt="ProStack Logo" width={48} height={48} className="object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">{headings[mode].title}</h1>
              <p className="mt-1 text-sm text-gray-400">{headings[mode].sub}</p>
            </div>
          </div>

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin(onLogin)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Username / Email / Mobile</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...regLogin("identifier")} type="text" autoComplete="username"
                    placeholder="Enter username, email or mobile"
                    className={inputCls(!!loginErrors.identifier)} />
                </div>
                {loginErrors.identifier?.message?.trim() && (
                  <p className="text-xs text-red-400 mt-0.5">{loginErrors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...regLogin("password")} type={showPassword ? "text" : "password"} autoComplete="current-password"
                    placeholder="Enter your password" className={`${inputCls(!!loginErrors.password)} pr-11`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer" tabIndex={-1}>
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {loginErrors.password?.message?.trim() && (
                  <p className="text-xs text-red-400 mt-0.5">{loginErrors.password.message}</p>
                )}
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode("find")} className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer">Forgot password?</button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full rounded-xl bg-[#023430] py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#012825] active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Sending OTP...</span> : "Sign In"}
              </button>

              <div className="mt-5 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <Link href="/signup" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition hover:opacity-80" style={{ color: "#f7b205" }}>
                  <UserPlusIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "#f7b205" }} />
                  <span>New to ProStack? Register your admin account here</span>
                </Link>
              </div>
            </form>
          )}

          {/* ── LOGIN OTP ── */}
          {mode === "otp" && (
            <form onSubmit={onLoginOtpSubmit} className="space-y-6" noValidate>
              <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
                <EnvelopeIcon className="h-5 w-5 shrink-0 text-indigo-400" />
                <div className="min-w-0">
                  <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">OTP sent to</p>
                  <p className="text-sm font-bold text-white break-all">{loginOtpEmail || loginOtpMaskedEmail || "your registered email"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider text-center">Enter 6-digit OTP</label>
                <OtpBoxes value={loginOtpDigits} onChange={setLoginOtpDigits} disabled={isLoading} hasError={!!loginOtpError} />
                {loginOtpError && <p className="text-xs text-red-400 text-center">{loginOtpError}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full rounded-xl bg-[#023430] py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#012825] active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Verifying...</span> : "Verify OTP"}
              </button>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <button type="button" onClick={() => { setMode("login"); setLoginOtpDigits(Array(OTP_LEN).fill("")); setLoginOtpError(""); }}
                  className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                  <ArrowLeftIcon className="h-3.5 w-3.5" />Back
                </button>
                <button type="button" onClick={onLoginOtpResend} disabled={loginCountdown > 0 || isLoading}
                  className="text-indigo-400 hover:text-indigo-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {loginCountdown > 0 ? `Resend in ${loginCountdown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ── FIND ── */}
          {mode === "find" && (
            <form onSubmit={handleFind(onFind)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Username / Email / Mobile Number</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...regFind("identifier")} type="text" autoComplete="off"
                    placeholder="Enter your username, email or mobile"
                    className={inputCls(!!findErrors.identifier)} />
                </div>
                {findErrors.identifier && <p className="text-xs text-red-400 mt-0.5">{findErrors.identifier.message}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Searching...</span> : "Find My Account"}
              </button>
              <button type="button" onClick={goBack}
                className="flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer pt-1">
                <ArrowLeftIcon className="h-3.5 w-3.5" />Back to Sign In
              </button>
            </form>
          )}

          {/* ── RESET OTP ── */}
          {mode === "reset-otp" && (
            <form onSubmit={onResetOtpSubmit} className="space-y-6" noValidate>
              <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
                <EnvelopeIcon className="h-5 w-5 shrink-0 text-indigo-400" />
                <div className="min-w-0">
                  <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">OTP sent to</p>
                  <p className="text-sm font-bold text-white break-all">{resetEmail || resetMaskedEmail || "your registered email"}</p>
                </div>
              </div>

              {resetFoundName && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Account found</p>
                    <p className="text-sm text-white font-medium">{resetFoundName}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider text-center">Enter 6-digit OTP</label>
                <OtpBoxes value={resetOtpDigits} onChange={setResetOtpDigits} disabled={isLoading} hasError={!!resetOtpError} />
                {resetOtpError && <p className="text-xs text-red-400 text-center">{resetOtpError}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Verifying...</span> : "Verify OTP"}
              </button>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <button type="button" onClick={() => { setMode("find"); setResetOtpDigits(Array(OTP_LEN).fill("")); setResetOtpError(""); }}
                  className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                  <ArrowLeftIcon className="h-3.5 w-3.5" />Back
                </button>
                <button type="button" onClick={onResetOtpResend} disabled={resetCountdown > 0 || isLoading}
                  className="text-indigo-400 hover:text-indigo-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {resetCountdown > 0 ? `Resend in ${resetCountdown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === "reset" && (
            <form onSubmit={handleReset(onReset)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <KeyIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...regReset("newPassword")} type={showNew ? "text" : "password"} placeholder="Min. 6 characters"
                    className={`${inputCls(!!resetErrors.newPassword)} pr-11`} />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer" tabIndex={-1}>
                    {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {resetErrors.newPassword && <p className="text-xs text-red-400 mt-0.5">{resetErrors.newPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...regReset("confirmPassword")} type={showConfirm ? "text" : "password"} placeholder="Re-enter new password"
                    className={`${inputCls(!!resetErrors.confirmPassword)} pr-11`} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer" tabIndex={-1}>
                    {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {resetErrors.confirmPassword && <p className="text-xs text-red-400 mt-0.5">{resetErrors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Resetting...</span> : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-600">
          &copy; {new Date().getFullYear()} ProStack. All rights reserved.
        </p>
      </div>

      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </>
  );
}