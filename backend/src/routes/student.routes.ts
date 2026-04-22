import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getStudents,
  getStudentById,
  getNextNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  sendReceipt,
} from "../controllers/student.controller";

const router = Router();

router.get("/next-number", protect, getNextNumber);
router.get("/", protect, getStudents);
router.get("/:id", protect, getStudentById);
router.post("/", protect, createStudent);
router.put("/:id", protect, updateStudent);
router.delete("/:id", protect, deleteStudent);
router.post("/:id/send-receipt", protect, sendReceipt);

export default router;