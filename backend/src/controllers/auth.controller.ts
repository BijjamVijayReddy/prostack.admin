import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import OtpRecord from "../models/OtpRecord";
import { generateOtp, hashOtp, verifyOtp, maskEmail, sendEmailOtp } from "../services/resend.service";

const signToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "2h" } as jwt.SignOptions
  );
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, mobileNumber, username, password } =
    req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobileNumber?: string;
      username?: string;
      password?: string;
    };

  if (!firstName || !lastName || !email || !mobileNumber || !username || !password) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  // Check uniqueness on email, mobileNumber, username
  const duplicate = await User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { mobileNumber: mobileNumber.trim() },
      { username: username.toLowerCase().trim() },
    ],
  });

  if (duplicate) {
    let field = "User";
    if (duplicate.email === email.toLowerCase().trim()) field = "Email address";
    else if (duplicate.mobileNumber === mobileNumber.trim()) field = "Mobile number";
    else if (duplicate.username === username.toLowerCase().trim()) field = "Username";

    res.status(409).json({ message: `${field} is already registered.` });
    return;
  }

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    mobileNumber: mobileNumber.trim(),
    username: username.toLowerCase().trim(),
    password,
    role: "admin",
  });

  const token = signToken(String(user._id), user.role);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ message: "Identifier and password are required." });
    return;
  }

  const val = username.trim();
  const user = await User.findOne({
    $or: [
      { username: val.toLowerCase() },
      { email: val.toLowerCase() },
      { mobileNumber: val },
    ],
  });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: "Invalid credentials. Please try again." });
    return;
  }

  // Record last login time
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(String(user._id), user.role);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
};

// GET /api/auth/me  (protected route — verifies token is still valid)
export const getMe = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select("-password");

  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.status(200).json({ user });
};

// POST /api/auth/refresh  (protected — issue a fresh 2-hour token)
export const refreshToken = async (
  req: Request & { userId?: string; userRole?: string },
  res: Response
): Promise<void> => {
  if (!req.userId || !req.userRole) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const token = signToken(req.userId, req.userRole);
  res.status(200).json({ token });
};

// PUT /api/auth/profile  (protected — update own profile)
export const updateProfile = async (
  req: Request & { userId?: string },
  res: Response
): Promise<void> => {
  const { firstName, lastName, email, mobileNumber, username, password } =
    req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobileNumber?: string;
      username?: string;
      password?: string;
    };

  if (!firstName || !lastName || !email || !mobileNumber || !username) {
    res.status(400).json({ message: "All fields except password are required." });
    return;
  }

  // Check uniqueness — exclude current user
  const duplicate = await User.findOne({
    _id: { $ne: req.userId },
    $or: [
      { email: email.toLowerCase().trim() },
      { mobileNumber: mobileNumber.trim() },
      { username: username.toLowerCase().trim() },
    ],
  });

  if (duplicate) {
    let field = "User";
    if (duplicate.email === email.toLowerCase().trim()) field = "Email address";
    else if (duplicate.mobileNumber === mobileNumber.trim()) field = "Mobile number";
    else if (duplicate.username === username.toLowerCase().trim()) field = "Username";
    res.status(409).json({ message: `${field} is already in use by another account.` });
    return;
  }

  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  user.firstName = firstName.trim();
  user.lastName = lastName.trim();
  user.email = email.toLowerCase().trim();
  user.mobileNumber = mobileNumber.trim();
  user.username = username.toLowerCase().trim();
  if (password && password.trim().length > 0) {
    user.password = password; // pre-save hook will hash it
  }

  await user.save();

  const updated = await User.findById(req.userId).select("-password");
  res.status(200).json({ user: updated });
};

// POST /api/auth/find-user  (public — check if identifier exists, then send OTP)
export const findUser = async (req: Request, res: Response): Promise<void> => {
  const { identifier } = req.body as { identifier?: string };
  if (!identifier || !identifier.trim()) {
    res.status(400).json({ message: "Identifier is required." });
    return;
  }
  const val = identifier.trim().toLowerCase();
  const user = await User.findOne({
    $or: [
      { username: val },
      { email: val },
      { mobileNumber: identifier.trim() },
    ],
  }).select("firstName lastName email");

  if (!user) {
    res.status(404).json({ found: false, message: "No account found with that username, email, or mobile number." });
    return;
  }

  if (!user.email) {
    res.status(400).json({ found: false, message: "No email address on file for this account. Please contact your administrator." });
    return;
  }

  // Generate OTP and store hash
  const otp     = generateOtp();
  const otpHash = await hashOtp(otp);
  await OtpRecord.findOneAndDelete({ email: user.email, purpose: "login" });
  await OtpRecord.create({
    email:     user.email,
    otpHash,
    purpose:   "login",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await sendEmailOtp(user.email, otp);
  } catch (err) {
    console.error("[Resend] Failed to send reset OTP:", err);
    res.status(502).json({ message: "Failed to send OTP email. Please try again." });
    return;
  }

  res.status(200).json({
    found:       true,
    name:        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    email:       user.email,
    maskedEmail: maskEmail(user.email),
  });
};

// POST /api/auth/reset-password/verify-otp  (verify OTP before allowing reset)
export const resetVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };
  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required." });
    return;
  }

  const emailTrimmed = email.trim().toLowerCase();
  const record = await OtpRecord.findOne({ email: emailTrimmed, purpose: "login" });

  if (!record) {
    res.status(400).json({ message: "No active OTP session. Please request a new one." });
    return;
  }
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    res.status(400).json({ message: "OTP expired. Please request a new one." });
    return;
  }

  const isValid = await verifyOtp(otp.trim(), record.otpHash!);
  if (!isValid) {
    res.status(400).json({ message: "Invalid OTP. Please try again." });
    return;
  }

  // Issue a short-lived reset token so the client can submit the new password
  const resetToken = jwt.sign(
    { email: emailTrimmed, purpose: "password-reset" },
    process.env.JWT_SECRET as string,
    { expiresIn: "10m" }
  );

  await record.deleteOne();
  res.status(200).json({ verified: true, resetToken });
};

// POST /api/auth/reset-password  (public — reset password using verified resetToken)
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { resetToken, newPassword } = req.body as { resetToken?: string; newPassword?: string };
  if (!resetToken || !newPassword || newPassword.trim().length < 6) {
    res.status(400).json({ message: "Reset token and a new password (min 6 chars) are required." });
    return;
  }

  let payload: { email: string; purpose: string };
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET as string) as { email: string; purpose: string };
  } catch {
    res.status(401).json({ message: "Reset token is invalid or expired. Please start over." });
    return;
  }

  if (payload.purpose !== "password-reset") {
    res.status(401).json({ message: "Invalid reset token." });
    return;
  }

  const user = await User.findOne({ email: payload.email });
  if (!user) {
    res.status(404).json({ message: "Account not found." });
    return;
  }

  user.password = newPassword.trim();
  await user.save();
  res.status(200).json({ message: "Password reset successfully." });
};