import { Resend } from "resend";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY);

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
export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: "ProStack <noreply@prostack-admin.com>",
    to:   email,
    subject: "Your ProStack Login OTP",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#060C1A;color:#fff;border-radius:16px;">
        <h2 style="margin:0 0 8px;color:#fff;">ProStack Login OTP</h2>
        <p style="color:#9ca3af;margin:0 0 24px;">Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#fff;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:12px;margin:24px 0 0;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] Failed to send OTP email:", error);
    throw new Error("Failed to send OTP email.");
  }

  console.log(`[Resend] OTP sent to ${maskEmail(email)}`);
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

  const { error } = await resend.emails.send({
    from:        "ProStack <noreply@prostack-admin.com>",
    to:          studentEmail,
    subject:     `${course} Payment Invoice From Prostack - Admin`,
    html,
    attachments,
  });

  if (error) {
    console.error("[Resend] Failed to send receipt email:", error);
    throw new Error("Failed to send receipt email.");
  }

  console.log(`[Resend] Receipt email sent to ${maskEmail(studentEmail)}`);
}
