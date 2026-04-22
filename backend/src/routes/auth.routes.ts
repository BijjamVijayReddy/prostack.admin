import { Router } from "express";
import { login, register, getMe, updateProfile, refreshToken, findUser, resetPassword, resetVerifyOtp } from "../controllers/auth.controller";
import { signupSendOtp, signupVerifyOtp, smsLogin, loginVerifyOtp } from "../controllers/mfa.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ── SMS MFA Signup ─────────────────────────────────────────
router.post("/signup/send-otp",   signupSendOtp);
router.post("/signup/verify-otp", signupVerifyOtp);

// ── SMS MFA Login ──────────────────────────────────────────
router.post("/login",            smsLogin);         // mobile + password → send OTP
router.post("/login/verify-otp", loginVerifyOtp);   // mobile + OTP → JWT

// ── Legacy admin utilities ─────────────────────────────────
router.post("/register",                   register);
router.post("/find-user",                  findUser);
router.post("/reset-password/verify-otp",  resetVerifyOtp);
router.post("/reset-password",             resetPassword);

// ── Protected ──────────────────────────────────────────────
router.get("/me",       protect, getMe);
router.post("/refresh", protect, refreshToken);
router.put("/profile",  protect, updateProfile);

export default router;