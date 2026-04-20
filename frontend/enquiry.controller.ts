import { Request, Response } from "express";
import { Enquiry } from "../models/Enquiry";

// GET /api/enquiries/next-number
export async function getNextEnquiryNumber(req: Request, res: Response) {
  try {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);

    const count = await Enquiry.countDocuments({
      enquiryNo: { $regex: `^EN\\d{3}${mm}${yy}$` },
    });

    const seq = String(count + 1).padStart(3, "0");
    const enquiryNo = `EN${seq}${mm}${yy}`;

    res.json({ enquiryNo });
  } catch {
    res.status(500).json({ message: "Failed to generate enquiry number" });
  }
}

// GET /api/enquiries
export async function getEnquiries(req: Request, res: Response) {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).lean();
    res.json({ enquiries });
  } catch {
    res.status(500).json({ message: "Failed to fetch enquiries" });
  }
}

// POST /api/enquiries
export async function createEnquiry(req: Request, res: Response) {
  try {
    const exists = await Enquiry.findOne({ enquiryNo: req.body.enquiryNo });
    if (exists) {
      return res.status(409).json({ message: "Enquiry number already exists" });
    }
    if (req.body.mobile) {
      const dupMobile = await Enquiry.findOne({ mobile: req.body.mobile });
      if (dupMobile) return res.status(409).json({ message: `Mobile number ${req.body.mobile} is already registered with another enquiry.` });
    }
    if (req.body.email) {
      const dupEmail = await Enquiry.findOne({ email: req.body.email });
      if (dupEmail) return res.status(409).json({ message: `Email ${req.body.email} is already registered with another enquiry.` });
    }
    const enquiry = await Enquiry.create(req.body);
    res.status(201).json({ enquiry });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Enquiry number already exists" });
    }
    res.status(500).json({ message: "Failed to create enquiry" });
  }
}

// PUT /api/enquiries/:id
export async function updateEnquiry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (req.body.enquiryNo) {
      const conflict = await Enquiry.findOne({
        enquiryNo: req.body.enquiryNo,
        _id: { $ne: id },
      });
      if (conflict) {
        return res.status(409).json({ message: "Enquiry number already exists" });
      }
    }
    if (req.body.mobile) {
      const dup = await Enquiry.findOne({ mobile: req.body.mobile, _id: { $ne: id } });
      if (dup) return res.status(409).json({ message: `Mobile number ${req.body.mobile} is already registered with another enquiry.` });
    }
    if (req.body.email) {
      const dup = await Enquiry.findOne({ email: req.body.email, _id: { $ne: id } });
      if (dup) return res.status(409).json({ message: `Email ${req.body.email} is already registered with another enquiry.` });
    }
    const enquiry = await Enquiry.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ enquiry });
  } catch {
    res.status(500).json({ message: "Failed to update enquiry" });
  }
}

// DELETE /api/enquiries/:id
export async function deleteEnquiry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ message: "Enquiry deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete enquiry" });
  }
}
