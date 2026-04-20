import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getOverview } from "../controllers/dashboard.controller";

const router = Router();

router.get("/overview", protect, getOverview);

export default router;
