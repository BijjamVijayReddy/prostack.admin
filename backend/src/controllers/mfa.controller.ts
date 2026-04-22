import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OtpRecord from "../models/OtpRecord";
import User from "../models/User";
import { sendOtpViaMsg91 } from "../services/msg91.service";

const OTP_EXPIRY_MS  = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS   = 3;
const BCRYPT_ROUNDS  = 10;

/* ─── Helpers ────────────────────────────────────────────── */

/** Cryptographically-secure 6-digit OTP */
function generateOtp(): string {
  return (100000 + crypto.randomInt(900000)).toString();
}

function signToken(id: string, role: string): string {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "2h" } as jwt.SignOptions
  );
}

/** Replace any existing OTP for this email+purpose with a fresh one */
async function upsertOtp(
  email: string,
  purpose: "signup" | "login",
  otpHash: string,
  pendingUserData?: Record<string, unknown>
): Promise<void> {
  await OtpRecord.findOneAndDelete({ email, purpose });
  await OtpRecord.create({
    email,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0,
    ...(pendingUserData ? { pendingUserData } : {}),
  });
}

/* ─── POST /api/auth/signup/send-otp ────────────────────── */
export const signupSendOtp = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, mobileNumber, username, password } =
    req.body as Record<string, string | undefined>;

  if (!firstName || !lastName || !email || !mobileNumber || !username || !password) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters." });
    return;
  }

  const emailLower    = email.toLowerCase().trim();
  const mobileTrimmed = mobileNumber.trim();
  const usernameLower = username.toLowerCase().trim();

  // Reject if any unique field is already taken
  const existing = await User.findOne({
    $or: [
      { email: emailLower },
      { mobileNumber: mobileTrimmed },
      { username: usernameLower },
    ],
  });

  if (existing) {
    let field = "User";
    if (existing.email === emailLower)             field = "Email address";
    else if (existing.mobileNumber === mobileTrimmed) field = "Mobile number";
    else if (existing.username === usernameLower)   field = "Username";
    res.status(409).json({ message: `${field} is already registered.` });
    return;
  }

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

  await upsertOtp(emailLower, "signup", otpHash, {
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     emailLower,
    mobileNumber: mobileTrimmed,
    username:  usernameLower,
    password,                  // User pre-save hook will bcrypt this
  });

  try {
    await sendOtpViaMsg91(emailLower, otp, `${firstName} ${lastName}`);
  } catch (err) {
    console.error("[MSG91] Failed to send OTP email:", err);
    // Don't expose delivery errors to the client; OTP is still stored
  }

  res.status(200).json({
    message: "OTP sent to your email address. It is valid for 5 minutes.",
  });
};

/* ─── POST /api/auth/signup/verify-otp ──────────────────── */
export const signupVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required." });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const record     = await OtpRecord.findOne({ email: emailLower, purpose: "signup" });

  if (!record) {
    res.status(400).json({ message: "No pending OTP found. Please request a new one." });
    return;
  }

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    res.status(400).json({ message: "OTP has expired. Please request a new one." });
    return;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    return;
  }

  const isValid = await bcrypt.compare(String(otp).trim(), record.otpHash);

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    res.status(400).json({
      message:
        remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please request a new OTP.",
    });
    return;
  }

  // OTP is valid — create the user account
  const data = record.pendingUserData as {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    username: string;
    password: string;
  };

  // Guard against race condition (duplicate created between send-otp and verify)
  const duplicate = await User.findOne({
    $or: [
      { email: data.email },
      { mobileNumber: data.mobileNumber },
      { username: data.username },
    ],
  });

  if (duplicate) {
    await record.deleteOne();
    res.status(409).json({ message: "Account already exists. Please sign in." });
    return;
  }

  const user = await User.create({ ...data, isVerified: true, role: "admin" });
  await record.deleteOne();

  const token = signToken(String(user._id), user.role);

  res.status(201).json({
    message: "Account verified and created successfully.",
    token,
    user: {
      id:       user._id,
      username: user.username,
      email:    user.email,
      role:     user.role,
    },
  });
};

/* ─── POST /api/auth/mfa/login ──────────────────────────── */
export const mfaLogin = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required." });
    return;
  }

  const val  = username.trim();
  const user = await User.findOne({
    $or: [
      { username: val.toLowerCase() },
      { email:    val.toLowerCase() },
      { mobileNumber: val },
    ],
  });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: "Invalid credentials. Please try again." });
    return;
  }

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

  await upsertOtp(user.email, "login", otpHash);

  try {
    await sendOtpViaMsg91(user.email, otp, `${user.firstName} ${user.lastName}`);
  } catch (err) {
    console.error("[MSG91] Failed to send OTP email:", err);
  }

  // Mask email for display: j***@example.com
  const [localPart, domain] = user.email.split("@");
  const maskedEmail = `${localPart.slice(0, 1)}***@${domain}`;

  res.status(200).json({
    message:     "Credentials verified. OTP sent to your registered email.",
    email:       user.email,
    maskedEmail,
    mfaRequired: true,
  });
};

/* ─── POST /api/auth/mfa/login/verify-otp ───────────────── */
export const mfaLoginVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required." });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const record     = await OtpRecord.findOne({ email: emailLower, purpose: "login" });

  if (!record) {
    res.status(400).json({ message: "No active session. Please sign in again." });
    return;
  }

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    res.status(400).json({ message: "OTP expired. Please sign in again." });
    return;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    res.status(429).json({ message: "Too many failed attempts. Please sign in again." });
    return;
  }

  const isValid = await bcrypt.compare(String(otp).trim(), record.otpHash);

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    res.status(400).json({
      message:
        remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please sign in again.",
    });
    return;
  }

  const user = await User.findOne({ email: emailLower });
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
      username:    user.username,
      email:       user.email,
      role:        user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
};
