import axios from "axios";

const TEMPLATE_ID  = "69e86bdf1321e5c56301e0f2";
const OTP_API_BASE = "https://control.msg91.com/api/v5/otp";

function toFullMobile(mobile: string): string {
  return `91${mobile}`;
}

function getAuthKey(): string | undefined {
  return process.env.MSG91_AUTH_KEY;
}

/**
 * Send an SMS OTP to the given 10-digit mobile number via MSG91.
 *
 * Required env var:
 *  - MSG91_AUTH_KEY — your MSG91 auth key
 *
 * When MSG91_AUTH_KEY is absent (local dev), logs a placeholder to console.
 */
export async function sendSmsOtp(mobile: string): Promise<void> {
  const authKey = getAuthKey();

  if (!authKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[MSG91-DEV] OTP SMS would be sent to +91${mobile}\n`);
    }
    return;
  }

  await axios.post(
    OTP_API_BASE,
    {
      mobile:      toFullMobile(mobile),
      template_id: TEMPLATE_ID,
    },
    {
      headers: {
        authkey:        authKey,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    }
  );
}

/**
 * Verify an OTP entered by the user against MSG91.
 * Returns true when MSG91 confirms the OTP is valid.
 *
 * In dev mode (no authKey), always returns true so the flow can be tested end-to-end.
 */
export async function verifySmsOtp(mobile: string, otp: string): Promise<boolean> {
  const authKey = getAuthKey();

  if (!authKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[MSG91-DEV] OTP verification skipped for +91${mobile} (otp=${otp})`);
      return true;
    }
    return false;
  }

  const res = await axios.get(`${OTP_API_BASE}/verify`, {
    params: {
      mobile: toFullMobile(mobile),
      otp,
    },
    headers: { authkey: authKey },
    timeout: 10_000,
  });

  // MSG91 returns { type: "success", ... } on successful verification
  return (res.data as { type?: string })?.type === "success";
}