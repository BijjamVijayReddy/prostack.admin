import { Request, Response } from "express";
import { Student } from "../models/Student";

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
    const student = await Student.create(req.body);
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
