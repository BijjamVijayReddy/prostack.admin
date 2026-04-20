import { Router } from "express";
import { login, register, getMe, updateProfile, refreshToken, findUser, resetPassword } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

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