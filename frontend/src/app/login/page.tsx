"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

/* --- Schemas -------------------------------------------- */
const loginSchema = yup.object({
  identifier: yup.string().required("Username, Email or Mobile is Required"),
});
type LoginValues = yup.InferType<typeof loginSchema>;

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
  const border = hasError ? "border-2 border-red-500" : "border-2 border-orange-400";
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
          className={`h-12 w-11 rounded-xl bg-gray-50 text-center text-lg font-bold text-gray-900 outline-none focus:outline-none transition focus:bg-white disabled:opacity-50 ${border}`}
        />
      ))}
    </div>
  );
}

/* --- Login Page ----------------------------------------- */
type Mode = "login" | "otp";

export default function LoginPage() {
  const { loginWithToken } = useAuth();
  const router = useRouter();

  const [mode,      setMode]      = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [loginOtpEmail,       setLoginOtpEmail]       = useState("");
  const [loginOtpMaskedEmail, setLoginOtpMaskedEmail] = useState("");
  const [loginOtpDigits, setLoginOtpDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [loginOtpError,  setLoginOtpError]  = useState("");
  const [loginCountdown, setLoginCountdown] = useState(0);
  const loginIdentifierRef = useRef<string>("");

  useEffect(() => { document.title = "ProStack - Login"; }, []);

  useEffect(() => {
    if (loginCountdown <= 0) return;
    const t = setTimeout(() => setLoginCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [loginCountdown]);

  const { register: regLogin, handleSubmit: handleLogin, setError: setLoginError, formState: { errors: loginErrors } } =
    useForm<LoginValues>({ resolver: yupResolver(loginSchema) });

  const requestLoginOtp = useCallback(async (identifier: string): Promise<boolean> => {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const json = await res.json() as { mfaRequired?: boolean; email?: string; maskedEmail?: string; message?: string };
    if (res.ok && json.mfaRequired) {
      setLoginOtpEmail(json.email ?? "");
      setLoginOtpMaskedEmail(json.maskedEmail ?? "");
      return true;
    }
    setToast({ message: json.message ?? "Unable to reach server. Please try again later.", type: "error" });
    return false;
  }, []);

  const onLogin = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      loginIdentifierRef.current = data.identifier;
      const ok = await requestLoginOtp(data.identifier);
      if (ok) {
        setLoginOtpDigits(Array(OTP_LEN).fill("")); setLoginOtpError(""); setLoginCountdown(30); setMode("otp");
      } else {
        setLoginError("identifier", { message: " " });
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
      const json = await res.json() as { token?: string; message?: string; approvalStatus?: string };
      if (res.ok && json.token) {
        await loginWithToken(json.token);
        router.replace("/");
      } else if (res.status === 403 && json.approvalStatus === "pending") {
        setLoginOtpError("");
        setMode("login");
        setToast({ message: "⏳ Your account is pending super-admin approval. You will be notified by email once approved.", type: "error" });
      } else if (res.status === 403 && json.approvalStatus === "rejected") {
        setLoginOtpError("");
        setMode("login");
        setToast({ message: "❌ Your account registration was not approved. Please contact your administrator.", type: "error" });
      } else {
        setLoginOtpError(json.message ?? "Invalid OTP. Please try again.");
      }
    } catch { setLoginOtpError("Unable to reach server. Please try again later."); }
    setIsLoading(false);
  };

  const onLoginOtpResend = async () => {
    if (loginCountdown > 0) return;
    setIsLoading(true);
    try {
      const ok = await requestLoginOtp(loginIdentifierRef.current);
      if (ok) { setLoginOtpDigits(Array(OTP_LEN).fill("")); setLoginOtpError(""); setLoginCountdown(30); setToast({ message: "OTP resent to your email.", type: "success" }); }
    } catch { setToast({ message: "Unable to resend OTP.", type: "error" }); }
    setIsLoading(false);
  };

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:outline-none transition focus:bg-white ${
      hasError ? "border-2 border-red-500" : "border border-gray-200"
    }`;

  const headings: Record<Mode, { title: string; sub: string }> = {
    login: { title: "Welcome Back Admin", sub: "Sign in to your ProStack account" },
    otp:   { title: "Check your Email",   sub: `OTP sent to ${loginOtpEmail || loginOtpMaskedEmail || "your registered email"}` },
  };

  const features = [
    { Icon: AcademicCapIcon,        title: "Student Management",  desc: "Organize and track student data efficiently."       },
    { Icon: BriefcaseIcon,          title: "Placement Tracking",  desc: "Monitor placement drives and student progress."    },
    { Icon: ChatBubbleLeftRightIcon, title: "Enquiry Management", desc: "Manage and convert enquiries seamlessly."          },
  ];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="h-screen w-full flex flex-row-reverse  overflow-hidden" style={{background:"#f0f0f0"}} >

        {/* ── FORM PANEL (right) ── */}
        <div className="flex flex-col justify-center w-full lg:w-[42%] px-8 py-6 lg:px-12  overflow-y-auto" style={{background:"#f0f0f0"}}>
          <div className="w-full max-w-[400px] mx-auto">

            {/* Logo */}
            <div className="flex items-center gap-3 mb-7">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-orange-500">
                <Image src="/proStacklogo.png" alt="ProStack" width={30} height={30} className="object-contain" />
              </div>
              <span className="text-base font-bold text-gray-800 tracking-wide">ProStack</span>
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{headings[mode].title}</h1>
              <p className="mt-1.5 text-sm text-gray-500">{headings[mode].sub}</p>
            </div>

            {/* ── LOGIN ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin(onLogin)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Username / Email / Mobile</label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                    <input {...regLogin("identifier")} type="text" autoComplete="username"
                      placeholder="Enter username, Email or Mobile"
                      className={inputCls(!!loginErrors.identifier)} />
                  </div>
                  {loginErrors.identifier?.message?.trim() && (
                    <p className="text-xs text-red-500 mt-0.5">{loginErrors.identifier.message}</p>
                  )}
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Sending OTP...</span> : "Sign In"}
                </button>

                <div className="flex items-center justify-center rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3">
                  <Link href="/signup" className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-600 transition">
                    <UserPlusIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>New to ProStack? Register your admin account here</span>
                  </Link>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Forgot your login details?{" "}
                  <a href="mailto:bijjamvijayreddy@gmail.com" className="text-orange-500 hover:text-orange-600 transition font-extrabold">
                    Contact your administrator
                  </a>
                </p>
              </form>
            )}

            {/* ── LOGIN OTP ── */}
            {mode === "otp" && (
              <form onSubmit={onLoginOtpSubmit} className="space-y-6" noValidate>
                <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                  <EnvelopeIcon className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="min-w-0">
                    <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">OTP sent to</p>
                    <p className="text-sm font-bold text-gray-900 break-all">{loginOtpEmail || loginOtpMaskedEmail || "your registered email"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Enter 6-digit OTP</label>
                  <OtpBoxes value={loginOtpDigits} onChange={setLoginOtpDigits} disabled={isLoading} hasError={!!loginOtpError} />
                  {loginOtpError && <p className="text-xs text-red-500 text-center">{loginOtpError}</p>}
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Verifying...</span> : "Verify OTP"}
                </button>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <button type="button" onClick={() => { setMode("login"); setLoginOtpDigits(Array(OTP_LEN).fill("")); setLoginOtpError(""); }}
                    className="flex items-center gap-1 hover:text-gray-800 transition cursor-pointer">
                    <ArrowLeftIcon className="h-3.5 w-3.5" />Back
                  </button>
                  <button type="button" onClick={onLoginOtpResend} disabled={loginCountdown > 0 || isLoading}
                    className="text-orange-500 hover:text-orange-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {loginCountdown > 0 ? `Resend in ${loginCountdown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-xs text-gray-400 text-center">
              &copy; {new Date().getFullYear()} ProStack. All rights reserved.
            </p>
          </div>
        </div>

        {/* ── ILLUSTRATION PANEL (left) ── */}
        <div className="hidden lg:flex flex-col w-[58%] relative overflow-hidden px-7 pt-5 pb-4"
          style={{ background: "linear-gradient(160deg, #fff7ed 0%, #ffedd5 70%, #fed7aa 100%)" }}>

          {/* Dot grid – top right */}
          <div className="absolute top-6 right-8 pointer-events-none">
            <svg width="90" height="68" viewBox="0 0 90 68">
              {Array.from({ length: 12 }, (_, i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                return <circle key={i} cx={col * 22 + 11} cy={row * 22 + 11} r="3.5" fill="#f97316" opacity="0.45" />;
              })}
            </svg>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <svg viewBox="0 0 700 100" preserveAspectRatio="none" className="w-full h-24">
              <path d="M0,50 C175,100 525,0 700,50 L700,100 L0,100 Z" fill="#f97316" opacity="0.12"/>
              <path d="M0,70 C200,20 500,90 700,40 L700,100 L0,100 Z" fill="#f97316" opacity="0.08"/>
            </svg>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-orange-500">
              <Image src="/proStacklogo.png" alt="ProStack" width={26} height={26} className="object-contain" />
            </div>
            <span className="text-sm font-bold text-gray-800 tracking-wide">ProStack</span>
          </div>

          {/* Heading */}
          <div className="mb-3">
            <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">
              Smart Admin.<br />Stronger Management.
            </h2>
            <p className="mt-1.5 text-xs text-gray-600 max-w-sm leading-relaxed">
              ProStack gives you the power to manage students, placements,
              and enquiries in one seamless platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2 mb-3">
            {features.map(({ Icon, title, desc }, i) => (
              <div key={title} className="flex items-center gap-2.5 animate-fade-up" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{title}</p>
                  <p className="text-[11px] text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard mockup */}
          <div className="relative flex-1 min-h-0">
            <div className="animate-float3d">
            <svg viewBox="0 0 480 265" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[80%] drop-shadow-2xl">
              <defs>
                <filter id="loginCardShadow" x="-5%" y="-5%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#00000018"/>
                </filter>
              </defs>
              {/* Main white card */}
              <rect x="0" y="0" width="400" height="265" rx="16" fill="white" filter="url(#loginCardShadow)"/>
              {/* Header dots */}
              <circle cx="20" cy="18" r="4.5" fill="#fca5a5"/>
              <circle cx="33" cy="18" r="4.5" fill="#fde68a"/>
              <circle cx="46" cy="18" r="4.5" fill="#86efac"/>
              <rect x="62" y="12" width="72" height="11" rx="5" fill="#e5e7eb"/>
              {/* Stat – Students */}
              <rect x="10" y="36" width="114" height="54" rx="8" fill="#f9fafb" stroke="#f0f0f0" strokeWidth="1"/>
              <rect x="18" y="44" width="52" height="6" rx="3" fill="#9ca3af"/>
              <rect x="18" y="56" width="70" height="11" rx="5" fill="#111827"/>
              <rect x="18" y="73" width="44" height="6" rx="3" fill="#fca5a5"/>
              {/* Stat – Placements */}
              <rect x="132" y="36" width="114" height="54" rx="8" fill="#f9fafb" stroke="#f0f0f0" strokeWidth="1"/>
              <rect x="140" y="44" width="52" height="6" rx="3" fill="#9ca3af"/>
              <rect x="140" y="56" width="60" height="11" rx="5" fill="#111827"/>
              <rect x="140" y="73" width="44" height="6" rx="3" fill="#4ade80"/>
              {/* Stat – Enquiries */}
              <rect x="254" y="36" width="136" height="54" rx="8" fill="#f9fafb" stroke="#f0f0f0" strokeWidth="1"/>
              <rect x="262" y="44" width="52" height="6" rx="3" fill="#9ca3af"/>
              <rect x="262" y="56" width="60" height="11" rx="5" fill="#111827"/>
              <rect x="262" y="73" width="44" height="6" rx="3" fill="#4ade80"/>
              {/* Placement Overview */}
              <rect x="10" y="100" width="232" height="156" rx="10" fill="#f9fafb" stroke="#f0f0f0" strokeWidth="1"/>
              <rect x="20" y="110" width="110" height="8" rx="4" fill="#9ca3af"/>
              <rect x="22"  y="222" width="14" height="24" rx="4" fill="#d1fae5"/>
              <rect x="42"  y="202" width="14" height="44" rx="4" fill="#f97316"/>
              <rect x="62"  y="214" width="14" height="32" rx="4" fill="#fed7aa"/>
              <rect x="82"  y="188" width="14" height="58" rx="4" fill="#f97316"/>
              <rect x="102" y="208" width="14" height="38" rx="4" fill="#fed7aa"/>
              <rect x="122" y="178" width="14" height="68" rx="4" fill="#f97316"/>
              <rect x="142" y="204" width="14" height="42" rx="4" fill="#fed7aa"/>
              <rect x="162" y="192" width="14" height="54" rx="4" fill="#f97316"/>
              <rect x="182" y="218" width="14" height="28" rx="4" fill="#fed7aa"/>
              <rect x="202" y="196" width="14" height="50" rx="4" fill="#f97316"/>
              <line x1="10" y1="246" x2="242" y2="246" stroke="#e5e7eb" strokeWidth="1"/>
              {/* Recent Enquiries */}
              <rect x="252" y="100" width="138" height="156" rx="10" fill="#f9fafb" stroke="#f0f0f0" strokeWidth="1"/>
              <rect x="262" y="110" width="90" height="8" rx="4" fill="#9ca3af"/>
              {[
                { y: 130, color: "#fde68a" },
                { y: 156, color: "#a5b4fc" },
                { y: 182, color: "#86efac" },
                { y: 208, color: "#fca5a5" },
              ].map(({ y, color }, i) => (
                <g key={i}>
                  <circle cx={269} cy={y + 6} r="9" fill={color}/>
                  <rect x={283} y={y + 1} width={88} height="7" rx="3" fill="#d1d5db"/>
                  <rect x={283} y={y + 12} width={60} height="5" rx="2" fill="#e5e7eb"/>
                </g>
              ))}
              {/* Plant pot */}
              <rect x="420" y="220" width="32" height="22" rx="5" fill="#d4a06a"/>
              <rect x="416" y="215" width="40" height="8" rx="4" fill="#c49058"/>
              <ellipse cx="436" cy="217" rx="17" ry="5" fill="#5c3d11"/>
              {/* Plant stem */}
              <path d="M436 215 Q436 195 436 175" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
              {/* Plant leaves */}
              <path d="M436 200 Q420 188 414 194 Q424 204 436 200Z" fill="#16a34a"/>
              <path d="M436 190 Q452 178 458 184 Q448 194 436 190Z" fill="#22c55e"/>
              <path d="M436 210 Q422 202 418 207 Q426 214 436 210Z" fill="#16a34a"/>
              <path d="M436 178 Q450 168 456 174 Q446 182 436 178Z" fill="#4ade80"/>
            </svg>
            </div>

            {/* Success Rate floating card */}
            <div className="absolute bottom-4 right-4 bg-white rounded-2xl shadow-xl px-3 py-2 w-36 border border-gray-100 animate-float-card">
              <p className="text-[10px] text-gray-500 font-medium">Success Rate</p>
              <p className="text-xl font-extrabold text-gray-900 leading-tight">85%</p>
              <svg viewBox="0 0 130 32" className="w-full my-1.5">
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffedd5"/>
                    <stop offset="100%" stopColor="#ffedd500"/>
                  </linearGradient>
                </defs>
                <polyline
                  points="0,28 18,20 36,24 54,10 72,16 90,6 110,12 130,8"
                  fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                />
                <polygon
                  points="0,28 18,20 36,24 54,10 72,16 90,6 110,12 130,8 130,32 0,32"
                  fill="url(#waveGrad)"
                />
              </svg>
              <p className="text-[10px] text-orange-500 font-semibold">↑ 15% from last month</p>
            </div>
          </div>

          {/* Bottom badges */}
          <div className="flex gap-6 pt-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ShieldCheckIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Secure &amp; Reliable</p>
                <p className="text-[10px] text-gray-500">Your data is safe with us.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <BoltIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Fast &amp; Efficient</p>
                <p className="text-[10px] text-gray-500">Built for performance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes float3d {
          0%,100% { transform: perspective(900px) rotateX(3deg) rotateY(-4deg) translateY(0px); }
          33%      { transform: perspective(900px) rotateX(-1deg) rotateY(4deg) translateY(-10px); }
          66%      { transform: perspective(900px) rotateX(4deg) rotateY(1deg) translateY(-5px); }
        }
        .animate-float3d { animation: float3d 8s ease-in-out infinite; will-change: transform; }
        @keyframes float-card {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50%      { transform: translateY(-10px) rotate(1deg); }
        }
        .animate-float-card { animation: float-card 4s ease-in-out infinite; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
      `}</style>
    </>
  );
}
