import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import OtpRecord from "../models/OtpRecord";
import User from "../models/User";
import { sendSmsOtp, verifySmsOtp } from "../services/msg91.service";

const PENDING_TTL_MS = 10 * 60 * 1000;

function signToken(id: string, role: string): string {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "2h" } as jwt.SignOptions
  );
}

function maskMobile(mobile: string): string {
  return `+91 ******${mobile.slice(-4)}`;
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

  try {
    await sendSmsOtp(mobileTrimmed);
  } catch (err) {
    console.error("[MSG91] Failed to send signup OTP SMS:", err);
  }

  res.status(200).json({
    message:      "OTP sent to your mobile number. It is valid for 5 minutes.",
    mobile:       mobileTrimmed,
    maskedMobile: maskMobile(mobileTrimmed),
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
    isValid = await verifySmsOtp(mobileTrimmed, otp.trim());
  } catch (err) {
    console.error("[MSG91] OTP verification error:", err);
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

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(String(user._id), user.role);

  res.status(200).json({
    token,
    user: {
      id:          user._id,
      mobileNumber: user.mobileNumber,
      email:       user.email,
      username:    user.username,
      firstName:   user.firstName,
      lastName:    user.lastName,
      role:        user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
};

/* POST /api/auth/login/verify-otp */
export const loginVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { mobile, otp } = req.body as { mobile?: string; otp?: string };

  if (!mobile || !otp) {
    res.status(400).json({ message: "Mobile number and OTP are required." });
    return;
  }

  const mobileTrimmed = mobile.trim();
  const record = await OtpRecord.findOne({ mobile: mobileTrimmed, purpose: "login" });

  if (!record) {
    res.status(400).json({ message: "No active session. Please sign in again." });
    return;
  }
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    res.status(400).json({ message: "OTP expired. Please sign in again." });
    return;
  }

  let isValid = false;
  try {
    isValid = await verifySmsOtp(mobileTrimmed, otp.trim());
  } catch (err) {
    console.error("[MSG91] OTP verification error:", err);
    res.status(502).json({ message: "OTP verification failed. Please try again." });
    return;
  }

  if (!isValid) {
    res.status(400).json({ message: "Invalid OTP. Please try again." });
    return;
  }

  const user = await User.findOne({ mobileNumber: mobileTrimmed });
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
      mobile:      user.mobileNumber,
      firstName:   user.firstName   ?? "",
      lastName:    user.lastName    ?? "",
      email:       user.email       ?? "",
      username:    user.username    ?? "",
      role:        user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
};