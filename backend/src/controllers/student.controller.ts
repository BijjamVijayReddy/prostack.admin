import { Request, Response } from "express";
import { Student } from "../models/Student";
import { sendPaymentReceiptEmail } from "../services/resend.service";

// GET /api/students/next-number
// Returns the next auto-generated admissionNo and receiptNo for the current month
export async function getNextNumber(req: Request, res: Response) {
  try {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);

    // Count students whose admissionNo matches AD{3 digits}{MM}{YY}
    const count = await Student.countDocuments({
      admissionNo: { $regex: `^AD\\d{3}${mm}${yy}$` },
    });

    const seq = String(count + 1).padStart(3, "0");
    const admissionNo = `AD${seq}${mm}${yy}`;
    const receiptNo = `REC${seq}${mm}${yy}`;

    res.json({ admissionNo, receiptNo });
  } catch {
    res.status(500).json({ message: "Failed to generate number" });
  }
}

// GET /api/students
export async function getStudents(req: Request, res: Response) {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).lean();
    res.json({ students });
  } catch {
    res.status(500).json({ message: "Failed to fetch students" });
  }
}

// POST /api/students
export async function createStudent(req: Request, res: Response) {
  try {
    const exists = await Student.findOne({ admissionNo: req.body.admissionNo });
    if (exists) {
      return res.status(409).json({ message: "Admission number already exists" });
    }
    if (req.body.mobile) {
      const dupMobile = await Student.findOne({ mobile: req.body.mobile });
      if (dupMobile) return res.status(409).json({ message: `Mobile number ${req.body.mobile} is already registered with another student.` });
    }
    if (req.body.email) {
      const dupEmail = await Student.findOne({ email: req.body.email });
      if (dupEmail) return res.status(409).json({ message: `Email ${req.body.email} is already registered with another student.` });
    }
    // Derive isRecoverable from studentStatus
    const body = { ...req.body };
    body.isRecoverable = body.studentStatus !== "Inactive";
    const student = await Student.create(body);
    res.status(201).json({ student });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Admission number already exists" });
    }
    res.status(500).json({ message: "Failed to create student" });
  }
}

// PUT /api/students/:id
export async function updateStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // If admissionNo changed, check uniqueness
    if (req.body.admissionNo) {
      const conflict = await Student.findOne({
        admissionNo: req.body.admissionNo,
        _id: { $ne: id },
      });
      if (conflict) {
        return res.status(409).json({ message: "Admission number already exists" });
      }
    }
    if (req.body.mobile) {
      const dup = await Student.findOne({ mobile: req.body.mobile, _id: { $ne: id } });
      if (dup) return res.status(409).json({ message: `Mobile number ${req.body.mobile} is already registered with another student.` });
    }
    if (req.body.email) {
      const dup = await Student.findOne({ email: req.body.email, _id: { $ne: id } });
      if (dup) return res.status(409).json({ message: `Email ${req.body.email} is already registered with another student.` });
    }
    const student = await Student.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    // Sync isRecoverable whenever studentStatus changes
    if (req.body.studentStatus !== undefined) {
      student.isRecoverable = req.body.studentStatus !== "Inactive";
      await student.save();
    }
    res.json({ student });
  } catch {
    res.status(500).json({ message: "Failed to update student" });
  }
}

// DELETE /api/students/:id
export async function deleteStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete student" });
  }
}

// POST /api/students/:id/send-receipt
export async function sendReceipt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { pdfBase64 } = req.body as { pdfBase64?: string };

    const student = await Student.findById(id).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.email) {
      return res.status(400).json({ message: "Student has no email address on file." });
    }

    const receiptNo = student.receiptNo || `PS-${student.admissionNo.replace(/\D/g, "").slice(-6)}`;

    await sendPaymentReceiptEmail({
      studentName:   student.name,
      studentEmail:  student.email,
      course:        student.course,
      receiptNo,
      totalFee:      student.totalFee,
      totalPaid:     student.totalPaid,
      pendingAmount: student.pendingAmount,
      dueDate:       student.dueDate,
      pdfBase64,
    });

    res.json({ message: "Receipt email sent successfully." });
  } catch (err: any) {
    console.error("[sendReceipt]", err);
    res.status(502).json({ message: err.message ?? "Failed to send receipt email." });
  }
}