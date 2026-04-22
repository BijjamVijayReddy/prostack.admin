import { Router } from "express";
import { login, register, getMe, updateProfile, refreshToken, findUser, resetPassword } from "../controllers/auth.controller";
import { signupSendOtp, signupVerifyOtp, mfaLogin, mfaLoginVerifyOtp } from "../controllers/mfa.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ── MFA Signup ─────────────────────────────────────────────
router.post("/signup/send-otp",    signupSendOtp);
router.post("/signup/verify-otp",  signupVerifyOtp);

// ── MFA Login ──────────────────────────────────────────────
router.post("/mfa/login",              mfaLogin);
router.post("/mfa/login/verify-otp",   mfaLoginVerifyOtp);

// ── Legacy (password-only) ─────────────────────────────────
// Public
router.post("/login", login);
router.post("/register", register);
router.post("/find-user", findUser);
router.post("/reset-password", resetPassword);

// Protected
router.get("/me", protect, getMe);
router.post("/refresh", protect, refreshToken);
router.put("/profile", protect, updateProfile);

export default router;