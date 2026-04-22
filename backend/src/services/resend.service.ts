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
