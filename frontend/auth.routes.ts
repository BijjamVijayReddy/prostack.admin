import { Router } from "express";
import { login, register, getMe, updateProfile, refreshToken } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Public
router.post("/login", login);
router.post("/register", register);

// Protected
router.get("/me", protect, getMe);
router.post("/refresh", protect, refreshToken);
router.put("/profile", protect, updateProfile);

export default router;
