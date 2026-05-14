
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

/* ─────────────────────────────────────────────────────────────────────────
   CERTIFICATE EMAIL
   ───────────────────────────────────────────────────────────────────────── */

export interface CertificateEmailPayload {
  studentName:    string;
  studentEmail:   string;
  course:         string;
  stream:         string;
  certificateId:  string;
  startMonthYear: string;
  endMonthYear:   string;
  completionDate: string;
  personalMessage?: string;
  /** Base64-encoded PDF (no data-URI prefix) */
  pdfBase64:      string;
}

/** Send course completion certificate email with PDF attachment via Resend */
export async function sendCertificateEmail(payload: CertificateEmailPayload): Promise<void> {
  const {
    studentName, studentEmail, course, stream, certificateId,
    startMonthYear, endMonthYear, completionDate, personalMessage, pdfBase64,
  } = payload;

  const defaultMsg = `Congratulations on completing the ${course} course! 🎉\nPlease find your certificate attached.`;
  const message = (personalMessage?.trim()) || defaultMsg;
  const messageHtml = message.replace(/\n/g, "<br>");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(26,37,87,0.12);">

        <!-- Top accent bar -->
        <tr><td style="height:5px;background:linear-gradient(90deg,#1a2557,#c9a227,#1a2557);"></td></tr>

        <!-- Header -->
        <tr>
          <td style="background:#1a2557;padding:28px 36px 24px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a22780;">Pro Stack Academy</p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;">Certificate of Completion</h1>
            <p style="margin:10px 0 0;font-size:12px;color:#8fb5ff;">Certificate ID: <strong>${certificateId}</strong></p>
          </td>
        </tr>

        <!-- Congratulations banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#c9a227,#e8d070,#c9a227);padding:18px 36px;text-align:center;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#1a2557;">🎓 Congratulations, ${studentName}!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px 24px;">
            <p style="margin:0 0 20px;font-size:15px;color:#222;line-height:1.8;">${messageHtml}</p>

            <!-- Certificate details card -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr><td style="padding:14px 20px;background:#1a2557;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#c9a227;letter-spacing:2px;text-transform:uppercase;">Certificate Details</p>
              </td></tr>
              <tr><td style="padding:20px;">
                <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#374151;width:100%;">
                  <tr>
                    <td style="padding:5px 0;font-weight:600;width:45%;">Course</td>
                    <td style="padding:5px 0;font-weight:700;color:#1a2557;">${course}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-weight:600;">Program</td>
                    <td style="padding:5px 0;">${stream}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-weight:600;">Duration</td>
                    <td style="padding:5px 0;">${startMonthYear} to ${endMonthYear}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-weight:600;">Issue Date</td>
                    <td style="padding:5px 0;">${completionDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-weight:600;">Certificate ID</td>
                    <td style="padding:5px 0;font-weight:700;color:#c9a227;">${certificateId}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#4b5563;line-height:1.8;">
              Your certificate has been attached to this email as a PDF. You can download and save it for your records.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.8;">
              We are incredibly proud of your dedication and hard work. Keep growing and all the best for your future endeavors!
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:8px;">
              <span style="display:inline-block;background:#1a2557;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                📎 Certificate attached as PDF
              </span>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a2557;">Pro Stack Academy</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">#98, Ground Floor, RJ Garden, Marathahalli, Bengaluru – 560037</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">prostackacademy@gmail.com</p>
          </td>
        </tr>

        <!-- Bottom accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#1a2557,#c9a227,#1a2557);"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await getResend().emails.send({
    from:    "ProStack Academy <noreply@prostack-admin.com>",
    to:      studentEmail,
    cc:      "bijjamvijayreddy@gmail.com",
    subject: `🎓 Your ${course} Completion Certificate – Pro Stack Academy`,
    html,
    attachments: [
      {
        filename:    `Certificate_${studentName.replace(/\s+/g, "_")}_${certificateId.replace(/\//g, "-")}.pdf`,
        content:     pdfBase64,
        contentType: "application/pdf",
      },
    ],
  });

  if (error) {
    console.error("[Resend] Failed to send certificate email:", error);
    throw new Error("Failed to send certificate email.");
  }

  console.log(`[Resend] Certificate email sent to ${maskEmail(studentEmail)}`);
  await logEmail("receipt", studentEmail);
}
