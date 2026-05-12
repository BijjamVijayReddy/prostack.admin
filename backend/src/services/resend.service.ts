
import { Resend } from "resend";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { EmailLog } from "../models/EmailLog";

// Lazily initialised — server starts fine without RESEND_API_KEY in local dev
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set.");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function logEmail(type: "otp" | "receipt", recipient: string) {
  try { await EmailLog.create({ type, recipient, sentAt: new Date() }); }
  catch (e) { console.error("[EmailLog] Failed to log:", e); }
}

/** Generate a random 6-digit OTP string */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/** Hash OTP with bcrypt for secure storage */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/** Compare plain OTP against stored hash */
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/** Mask email: vi***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

/** Send login OTP email via Resend */
export async function sendEmailOtp(email: string, otp: string, name?: string): Promise<void> {
  const recipientName = name?.trim() || email.split("@")[0] || "there";

  const { error } = await getResend().emails.send({
    from: "ProStack <noreply@prostack-admin.com>",
    to:   email,
    subject: "Your ProStack Login OTP Code",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;margin:0;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:#0d1b3d;padding:28px 24px 20px;color:#ffffff;text-align:center;">
              <p style="margin:0;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#8fb5ff;">ProStack Secure Login</p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;line-height:1.1;">Your OTP is ready</h1>
            </td>
          </tr>

          

          <tr>
            <td style="padding:24px 28px 12px;color:#1f2937;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">Hi ${recipientName},</p>
              <p style="margin:16px 0 0;font-size:16px;line-height:1.7;color:#111827;">Use the one-time password below to sign in to your ProStack account. This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px;">
              <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:16px;padding:22px 18px;text-align:center;letter-spacing:10px;font-size:38px;font-weight:700;color:#1d4ed8;">${otp}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px;color:#4b5563;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;">
                You can copy this code into the login screen to complete authentication.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.8;">If you didn’t request this code, please ignore the email or contact support immediately.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:14px;padding:16px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="font-size:13px;color:#6b7280;line-height:1.6;">Email</td>
                  <td style="text-align:right;font-size:13px;color:#111827;font-weight:700;">${maskEmail(email)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6b7280;line-height:1.6;">Expires in</td>
                  <td style="text-align:right;font-size:13px;color:#111827;font-weight:700;">10 minutes</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:20px 28px 28px;color:#6b7280;font-size:13px;line-height:1.7;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 10px;">Need help? Reply to this email or contact the ProStack support team.</p>
              <p style="margin:0;">This code is for login verification only. Please do not share it with anyone.</p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] Failed to send OTP email:", error);
    throw new Error("Failed to send OTP email.");
  }

  console.log(`[Resend] OTP sent to ${maskEmail(email)}`);
  await logEmail("otp", email);
}

export interface ReceiptEmailPayload {
  studentName:    string;
  studentEmail:   string;
  course:         string;
  receiptNo:      string;
  totalFee:       number;
  totalPaid:      number;
  pendingAmount:  number;
  dueDate?:       string;
  /** Base64-encoded PDF (no data-URI prefix) */
  pdfBase64?:     string;
}

function fmtInr(n: number): string {
  return `₹ ${n.toLocaleString("en-IN")} /-`;
}

function fmtDate(d?: string): string {
  if (!d) return "NA";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** Send payment receipt confirmation email via Resend, with optional PDF attachment */
export async function sendPaymentReceiptEmail(payload: ReceiptEmailPayload): Promise<void> {
  const { studentName, studentEmail, course, receiptNo, totalFee, totalPaid, pendingAmount, dueDate, pdfBase64 } = payload;
  const isPending = pendingAmount > 0;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:28px 36px 16px;border-bottom:2px solid #cc3300;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#cc3300;">Pro Stack Academy</p>
            <p style="margin:4px 0 0;font-size:12px;color:#888;">#98, Ground Floor, RJ Garden, Chinnappanahalli, Marathahalli, Bengaluru – 560037</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 36px;">
            <p style="margin:0 0 16px;font-size:15px;color:#222;">Dear <strong>${studentName}</strong>,</p>

            <p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.7;">
              We are Happy to <strong>Welcome you to Pro Stack Academy!</strong> You've taken an Important Step Toward Enhancing your Skills, and we're Excited to have you on Board. Our team is dedicated to Providing you with the Best Possible Learning Experience, and We're Here to Support you Throughout your Journey.
            </p>

            <p style="margin:0 0 20px;font-size:14px;color:#444;">
              Please Find Attached the Payment Invoice for the <strong style="color:#cc3300;">${course} course</strong>.
            </p>

            <!-- Transaction details -->
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#cc3300;">Details of your transaction:</p>
            <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#333;">
              <tr><td style="padding:3px 0;font-weight:600;">Invoice No</td><td style="padding:3px 12px;">:</td><td style="padding:3px 0;font-weight:700;color:#cc3300;">${receiptNo}</td></tr>
              <tr><td style="padding:3px 0;font-weight:600;">Total Amount</td><td style="padding:3px 12px;">:</td><td style="padding:3px 0;font-weight:600;">${fmtInr(totalFee)}</td></tr>
              <tr><td style="padding:3px 0;font-weight:600;">Paid Amount</td><td style="padding:3px 12px;">:</td><td style="padding:3px 0;font-weight:600;">${fmtInr(totalPaid)}</td></tr>
              <tr><td style="padding:3px 0;font-weight:600;">Pending Amount</td><td style="padding:3px 12px;">:</td><td style="padding:3px 0;font-weight:600;color:${isPending ? "#cc3300" : "#333"};">${isPending ? fmtInr(pendingAmount) : "₹ NA/-"}</td></tr>
              <tr><td style="padding:3px 0;font-weight:600;">Due Date</td><td style="padding:3px 12px;">:</td><td style="padding:3px 0;font-weight:600;color:${isPending && dueDate ? "#cc3300" : "#333"};">${isPending && dueDate ? fmtDate(dueDate) : "NA"}</td></tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#555;">If you have any Questions or need Further Assistance, Please do not Hesitate to Contact Us.</p>
            <p style="margin:4px 0 20px;font-size:13px;color:#555;">--</p>
            <p style="margin:0;font-size:13px;color:#333;font-weight:600;">Thanks and regards,</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #eee;padding:20px 36px;">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#333;">ADMIN</p>
            <p style="margin:0 0 2px;font-size:12px;color:#555;"><span style="font-weight:700;color:#cc3300;">(M):</span>+91 9591 61 91 91</p>
            <p style="margin:0 0 10px;font-size:12px;color:#555;"><span style="font-weight:700;color:#cc3300;">(M):</span>+91 9557 740 960</p>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#cc3300;">Pro Stack Academy</p>
            <p style="margin:0 0 2px;font-size:11px;color:#777;">#98, Ground Floor, RJ Garden, Chinnappanahalli, R.J.Gardens, Sanjay Nagar,</p>
            <p style="margin:0 0 6px;font-size:11px;color:#777;">Marathahalli, Bengaluru, Karnataka 560037.</p>
            <a href="https://prostackacademy.com" style="font-size:11px;color:#cc3300;">https://prostackacademy.com</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const attachments = pdfBase64
    ? [{ filename: `Receipt_${receiptNo}.pdf`, content: pdfBase64 }]
    : [];

  const { error } = await getResend().emails.send({
    from:        "ProStack <noreply@prostack-admin.com>",
    to:          studentEmail,
    cc:"bijjamvijayreddy@gmail.com",
    subject:     `${course} Payment Invoice From Prostack - Admin`,
    html,
    attachments,
  });

  if (error) {
    console.error("[Resend] Failed to send receipt email:", error);
    throw new Error("Failed to send receipt email.");
  }

  console.log(`[Resend] Receipt email sent to ${maskEmail(studentEmail)}`);
  await logEmail("receipt", studentEmail);
}

/* ─── Admin Approval Emails ──────────────────────────────── */

export interface ApprovalUserInfo {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  mobileNumber: string;
}

/** Email to super-admin: new signup awaiting approval */
export async function sendAdminApprovalRequestEmail(
  adminEmail: string,
  user: ApprovalUserInfo,
  approveUrl: string,
  rejectUrl: string
): Promise<void> {
  const { error } = await getResend().emails.send({
    from: "ProStack <noreply@prostack-admin.com>",
    to: adminEmail,
    subject: `New Admin Registration – ${user.firstName} ${user.lastName} is awaiting approval`,
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
    <tr><td style="background:#f97316;padding:28px 24px 20px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff7ed;">ProStack Admin</p>
      <h1 style="margin:10px 0 0;font-size:26px;font-weight:700;color:#ffffff;">New Registration Request</h1>
    </td></tr>
    <tr><td style="padding:28px 32px 20px;color:#374151;">
      <p style="margin:0 0 18px;font-size:15px;">A new user has registered and is awaiting your approval:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Full Name</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${user.firstName} ${user.lastName}</td></tr>
        <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Username</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">@${user.username}</td></tr>
        <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${user.email}</td></tr>
        <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Mobile</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;">${user.mobileNumber}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 32px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Click one of the buttons below to approve or reject this registration:</p>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px;">
          <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;">✅ Approve</a>
        </td>
        <td>
          <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;">❌ Reject</a>
        </td>
      </tr></table>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">These links are single-use. Clicking them will immediately update the user's status.</p>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">ProStack Admin Panel · This email was sent automatically.</td></tr>
  </table>
</div>`,
  });
  if (error) console.error("[Resend] Failed to send admin approval email:", error);
}

/** Email to user: account approved */
export async function sendUserApprovedEmail(user: ApprovalUserInfo): Promise<void> {
  const { error } = await getResend().emails.send({
    from: "ProStack <noreply@prostack-admin.com>",
    to: user.email,
    subject: "🎉 Your ProStack account has been approved!",
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
    <tr><td style="background:#16a34a;padding:28px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#dcfce7;">ProStack</p>
      <h1 style="margin:10px 0 0;font-size:28px;font-weight:700;color:#ffffff;">Account Approved! 🎉</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi <strong>${user.firstName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Great news! Your ProStack admin account has been <strong style="color:#16a34a;">approved</strong> by the super admin. You can now log in using your registered credentials.</p>
      <a href="${process.env.FRONTEND_URL ?? "http://localhost:3000"}/login" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;">Sign In to ProStack →</a>
      <table style="margin-top:24px;width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Username</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">@${user.username}</td></tr>
        <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Email</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;">${user.email}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">ProStack Admin Panel · Welcome to the team!</td></tr>
  </table>
</div>`,
  });
  if (error) console.error("[Resend] Failed to send approval email to user:", error);
}

/** Email to user: account rejected */
export async function sendUserRejectedEmail(user: ApprovalUserInfo): Promise<void> {
  const { error } = await getResend().emails.send({
    from: "ProStack <noreply@prostack-admin.com>",
    to: user.email,
    subject: "Your ProStack registration request was not approved",
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
    <tr><td style="background:#dc2626;padding:28px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fee2e2;">ProStack</p>
      <h1 style="margin:10px 0 0;font-size:28px;font-weight:700;color:#ffffff;">Registration Not Approved</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi <strong>${user.firstName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">We're sorry, but your ProStack admin account registration has been <strong style="color:#dc2626;">rejected</strong> by the super admin. If you believe this is an error, please contact your administrator directly.</p>
      <a href="mailto:${process.env.ADMIN_EMAIL ?? "admin@prostack.com"}" style="display:inline-block;background:#6b7280;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;">Contact Administrator</a>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">ProStack Admin Panel</td></tr>
  </table>
</div>`,
  });
  if (error) console.error("[Resend] Failed to send rejection email to user:", error);
}
