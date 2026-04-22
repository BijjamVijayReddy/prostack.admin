import axios from "axios";

const OTP_EXPIRY_MINUTES = 5;

/**
 * Send a one-time password to the given email address via MSG91's
 * Transactional Email API.
 *
 * Required env vars:
 *  - MSG91_AUTH_KEY   — your MSG91 auth key
 *  - MSG91_FROM_EMAIL — verified sender address (default: noreply@prostack.app)
 *  - MSG91_DOMAIN     — verified sending domain  (default: prostack.app)
 *
 * When MSG91_AUTH_KEY is absent (e.g. local development), the OTP is
 * printed to the console so you can still test the full flow.
 */
export async function sendOtpViaMsg91(
  email: string,
  otp: string,
  recipientName = "User"
): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    // Development fallback — never log OTPs in production
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[MSG91-DEV] OTP for ${email}: ${otp}\n`);
    }
    return;
  }

  await axios.post(
    "https://control.msg91.com/api/v5/email/send",
    {
      recipients: [{ to: [{ email, name: recipientName }] }],
      from: { email: process.env.MSG91_FROM_EMAIL ?? "noreply@prostack.app" },
      domain: process.env.MSG91_DOMAIN ?? "prostack.app",
      mail_type_id: "1",
      subject: "Your ProStack Verification Code",
      body: buildOtpEmailHtml(otp, OTP_EXPIRY_MINUTES),
    },
    {
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    }
  );
}

function buildOtpEmailHtml(otp: string, expiryMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060C1A;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#0d1526;border-radius:16px;border:1px solid rgba(99,102,241,0.2);">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#6366f1;"></div>
      <span style="color:#6366f1;font-weight:700;font-size:16px;letter-spacing:0.5px;">PROSTACK</span>
    </div>

    <h2 style="color:#f9fafb;margin:0 0 8px;font-size:20px;font-weight:700;">
      Verify your identity
    </h2>
    <p style="color:#9ca3af;margin:0 0 28px;font-size:14px;line-height:1.6;">
      Enter this code to complete your verification.
      It expires in <strong style="color:#e5e7eb;">${expiryMinutes} minutes</strong>.
    </p>

    <div style="text-align:center;padding:28px 20px;background:rgba(99,102,241,0.08);border-radius:14px;border:1px solid rgba(99,102,241,0.25);margin-bottom:24px;">
      <span style="font-size:44px;font-weight:800;letter-spacing:18px;color:#6366f1;font-variant-numeric:tabular-nums;">
        ${otp}
      </span>
    </div>

    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
      If you did not request this code, please ignore this email.
      Your account remains secure.
    </p>

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;color:#374151;font-size:11px;">
        &copy; ${new Date().getFullYear()} ProStack. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}
