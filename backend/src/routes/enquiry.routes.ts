import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getEnquiries,
  getNextEnquiryNumber,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/enquiry.controller";

const router = Router();

router.get("/next-number", protect, getNextEnquiryNumber);
router.get("/", protect, getEnquiries);
router.post("/", protect, createEnquiry);
router.put("/:id", protect, updateEnquiry);
router.delete("/:id", protect, deleteEnquiry);

export default router;