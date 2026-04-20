import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getOverview, getBatchCategories } from "../controllers/dashboard.controller";

const router = Router();

router.get("/overview", protect, getOverview);
router.get("/batch-categories", protect, getBatchCategories);

export default router;