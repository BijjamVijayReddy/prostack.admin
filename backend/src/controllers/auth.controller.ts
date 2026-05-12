import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import OtpRecord from "../models/OtpRecord";
import { generateOtp, hashOtp, verifyOtp, maskEmail, sendEmailOtp, sendAdminApprovalRequestEmail, sendUserApprovedEmail, sendUserRejectedEmail } from "../services/resend.service";

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
    approvalStatus: "pending",
    approvalToken: crypto.randomBytes(32).toString("hex"),
  });

  // Notify super-admin for approval
  const adminEmail = process.env.ADMIN_EMAIL;
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5001";
  if (adminEmail && user.approvalToken) {
    const approveUrl = `${backendUrl}/api/auth/approve/${user.approvalToken}`;
    const rejectUrl  = `${backendUrl}/api/auth/reject/${user.approvalToken}`;
    sendAdminApprovalRequestEmail(
      adminEmail,
      { firstName: user.firstName ?? "", lastName: user.lastName ?? "", email: user.email ?? "", username: user.username ?? "", mobileNumber: user.mobileNumber },
      approveUrl,
      rejectUrl
    ).catch((e) => console.error("[Approval Email] Failed:", e));
  } else {
    console.warn("[Approval] ADMIN_EMAIL env var not set — skipping approval notification email.");
  }

  res.status(202).json({
    pending: true,
    message: "Registration received. Your account is pending super-admin approval. You will receive an email once approved.",
  });
};

// GET /api/auth/approve/:token
export const approveUser = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params as { token: string };
  const user = await User.findOne({ approvalToken: token });

  if (!user) {
    res.status(200).send(htmlPage("Invalid or Expired Link", "This approval link is invalid or has already been used.", "#dc2626"));
    return;
  }
  if (user.approvalStatus === "approved") {
    res.status(200).send(htmlPage("Already Approved", `${user.firstName} ${user.lastName}'s account is already approved.`, "#16a34a"));
    return;
  }

  user.approvalStatus = "approved";
  user.approvalToken  = undefined;
  await user.save();

  sendUserApprovedEmail({
    firstName: user.firstName ?? "", lastName: user.lastName ?? "",
    email: user.email ?? "", username: user.username ?? "", mobileNumber: user.mobileNumber,
  }).catch((e) => console.error("[Approval Email] Failed:", e));

  res.status(200).send(htmlPage(
    "✅ Account Approved",
    `${user.firstName} ${user.lastName} (@${user.username}) has been approved. They will receive a confirmation email shortly.`,
    "#16a34a"
  ));
};

// GET /api/auth/reject/:token
export const rejectUser = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params as { token: string };
  const user = await User.findOne({ approvalToken: token });

  if (!user) {
    res.status(200).send(htmlPage("Invalid or Expired Link", "This rejection link is invalid or has already been used.", "#dc2626"));
    return;
  }
  if (user.approvalStatus === "rejected") {
    res.status(200).send(htmlPage("Already Rejected", `${user.firstName} ${user.lastName}'s account was already rejected.`, "#dc2626"));
    return;
  }

  user.approvalStatus = "rejected";
  user.approvalToken  = undefined;
  await user.save();

  sendUserRejectedEmail({
    firstName: user.firstName ?? "", lastName: user.lastName ?? "",
    email: user.email ?? "", username: user.username ?? "", mobileNumber: user.mobileNumber,
  }).catch((e) => console.error("[Rejection Email] Failed:", e));

  res.status(200).send(htmlPage(
    "❌ Account Rejected",
    `${user.firstName} ${user.lastName} (@${user.username}) has been rejected. They will receive a notification email.`,
    "#dc2626"
  ));
};

function htmlPage(title: string, message: string, color: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="background:#fff;border-radius:16px;padding:48px 40px;max-width:480px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
    <h1 style="color:${color};font-size:24px;margin:0 0 16px;">${title}</h1>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">${message}</p>
    <p style="color:#9ca3af;font-size:12px;margin:0;">You can close this tab.</p>
  </div>
</body></html>`;
}

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

  const recipientName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.email.split("@")[0];

  try {
    await sendEmailOtp(user.email, otp, recipientName);
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
