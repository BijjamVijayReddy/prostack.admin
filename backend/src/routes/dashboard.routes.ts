import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getOverview, getBatchCategories, getPendingStudents,getEmailQuota } from "../controllers/dashboard.controller";

const router = Router();

router.get("/overview", protect, getOverview);
router.get("/batch-categories", protect, getBatchCategories);
router.get("/pending-students", protect, getPendingStudents);
router.get("/email-quota", protect, getEmailQuota);
export default router;