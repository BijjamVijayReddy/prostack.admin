import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import OtpRecord from "../models/OtpRecord";
import User from "../models/User";
import { generateOtp, hashOtp, verifyOtp, maskEmail, sendEmailOtp } from "../services/resend.service";

const PENDING_TTL_MS = 10 * 60 * 1000;

function signToken(id: string, role: string): string {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "2h" } as jwt.SignOptions
  );
}

async function upsertRecord(
  mobile: string,
  purpose: "signup" | "login",
  pendingUserData?: Record<string, unknown>
): Promise<void> {
  await OtpRecord.findOneAndDelete({ mobile, purpose });
  await OtpRecord.create({
    mobile,
    purpose,
    expiresAt: new Date(Date.now() + PENDING_TTL_MS),
    ...(pendingUserData ? { pendingUserData } : {}),
  });
}

/* POST /api/auth/signup/send-otp */
export const signupSendOtp = async (req: Request, res: Response): Promise<void> => {
  const { mobile, password } = req.body as Record<string, string | undefined>;

  if (!mobile || !password) {
    res.status(400).json({ message: "Mobile number and password are required." });
    return;
  }
  if (!/^[0-9]{10}$/.test(mobile)) {
    res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters." });
    return;
  }

  const mobileTrimmed = mobile.trim();
  const existing = await User.findOne({ mobileNumber: mobileTrimmed });
  if (existing) {
    res.status(409).json({ message: "Mobile number is already registered." });
    return;
  }

  await upsertRecord(mobileTrimmed, "signup", {
    mobile:   mobileTrimmed,
    password, // plain — User.create() pre-save hook will hash it
  });

  // Generate OTP and store hash in the record
  const otp     = (await import("../services/resend.service")).generateOtp();
  const otpHash = (await import("../services/resend.service")).hashOtp;
  const record  = await OtpRecord.findOne({ mobile: mobileTrimmed, purpose: "signup" });
  if (record) {
    record.otpHash = await otpHash(otp);
    await record.save();
  }
  // In production, log to server console so admin can see it
  console.log(`[Signup OTP] mobile=${mobileTrimmed} otp=${otp}`);

  res.status(200).json({
    message:      "OTP generated. Check server logs (or use your SMS service).",
    mobile:       mobileTrimmed,
    maskedMobile: `+91 ******${mobileTrimmed.slice(-4)}`,
  });
};

/* POST /api/auth/signup/verify-otp */
export const signupVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { mobile, otp } = req.body as { mobile?: string; otp?: string };

  if (!mobile || !otp) {
    res.status(400).json({ message: "Mobile number and OTP are required." });
    return;
  }

  const mobileTrimmed = mobile.trim();
  const record = await OtpRecord.findOne({ mobile: mobileTrimmed, purpose: "signup" });

  if (!record) {
    res.status(400).json({ message: "No pending OTP found. Please request a new one." });
    return;
  }
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    res.status(400).json({ message: "Session expired. Please request a new OTP." });
    return;
  }

  let isValid = false;
  try {
    const { verifyOtp: verify } = await import("../services/resend.service");
    isValid = record.otpHash ? await verify(otp.trim(), record.otpHash) : false;
  } catch (err) {
    console.error("[Signup] OTP verification error:", err);
    res.status(502).json({ message: "OTP verification failed. Please try again." });
    return;
  }

  if (!isValid) {
    res.status(400).json({ message: "Invalid OTP. Please try again." });
    return;
  }

  const data = record.pendingUserData as { mobile: string; password: string };
  const duplicate = await User.findOne({ mobileNumber: data.mobile });
  if (duplicate) {
    await record.deleteOne();
    res.status(409).json({ message: "Account already exists. Please sign in." });
    return;
  }

  const user = await User.create({
    mobileNumber: data.mobile,
    password:     data.password,
    isVerified:   true,
    role:         "admin",
  });
  await record.deleteOne();

  const token = signToken(String(user._id), user.role);

  res.status(201).json({
    message: "Account verified and created successfully.",
    token,
    user: { id: user._id, mobile: user.mobileNumber, role: user.role },
  });
};

/* POST /api/auth/login */
export const smsLogin = async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier || !password) {
    res.status(400).json({ message: "Username/email/mobile and password are required." });
    return;
  }

  const id = identifier.trim();
  const user = await User.findOne({
    $or: [
      { mobileNumber: id },
      { email: id },
      { username: id },
    ],
  });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: "Invalid credentials. Please try again." });
    return;
  }

  if (!user.email) {
    res.status(400).json({ message: "No email address on file. Please contact your administrator." });
    return;
  }

  // Generate OTP, hash and store it
  const otp     = generateOtp();
  const otpHash = await hashOtp(otp);

  await OtpRecord.findOneAndDelete({ email: user.email, purpose: "login" });
  await OtpRecord.create({
    email:    user.email,
    otpHash,
    purpose:  "login",
    expiresAt: new Date(Date.now() + PENDING_TTL_MS),
  });

  try {
    await sendEmailOtp(user.email, otp);
  } catch (err) {
    console.error("[Resend] Failed to send login OTP email:", err);
    res.status(502).json({ message: "Failed to send OTP email. Please try again." });
    return;
  }

  res.status(200).json({
    mfaRequired:  true,
    maskedEmail:  maskEmail(user.email),
    email:        user.email,
  });
};

/* POST /api/auth/login/verify-otp */
export const loginVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required." });
    return;
  }

  const emailTrimmed = email.trim().toLowerCase();
  const record = await OtpRecord.findOne({ email: emailTrimmed, purpose: "login" });

  if (!record) {
    res.status(400).json({ message: "No active session. Please sign in again." });
    return;
  }
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    res.status(400).json({ message: "OTP expired. Please sign in again." });
    return;
  }

  const isValid = await verifyOtp(otp.trim(), record.otpHash!);
  if (!isValid) {
    res.status(400).json({ message: "Invalid OTP. Please try again." });
    return;
  }

  const user = await User.findOne({ email: emailTrimmed });
  if (!user) {
    await record.deleteOne();
    res.status(404).json({ message: "Account not found." });
    return;
  }

  user.lastLoginAt = new Date();
  await user.save();
  await record.deleteOne();

  const token = signToken(String(user._id), user.role);

  res.status(200).json({
    message: "Login successful.",
    token,
    user: {
      id:          user._id,
      mobileNumber: user.mobileNumber,
      firstName:   user.firstName   ?? "",
      lastName:    user.lastName    ?? "",
      email:       user.email       ?? "",
      username:    user.username    ?? "",
      role:        user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
};