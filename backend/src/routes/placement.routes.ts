import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
} from "../controllers/placement.controller";

const router = Router();

router.get("/", protect, getPlacements);
router.post("/", protect, createPlacement);
router.put("/:id", protect, updatePlacement);
router.delete("/:id", protect, deletePlacement);

export default router;