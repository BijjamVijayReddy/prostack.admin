import { Request, Response } from "express";
import { Placement } from "../models/Placement";

// GET /api/placements
export async function getPlacements(req: Request, res: Response) {
  try {
    const raw = await Placement.find().sort({ createdAt: -1 }).lean();
    // Normalize: ensure jobOfferDate is always present in the response
    const placements = raw.map((p) => ({ jobOfferDate: "", ...p }));
    res.json({ placements });
  } catch {
    res.status(500).json({ message: "Failed to fetch placements" });
  }
}

// POST /api/placements
export async function createPlacement(req: Request, res: Response) {
  try {
    const body = { ...req.body, jobOfferDate: req.body.jobOfferDate ?? "" };
    const raw = await Placement.create(body);
    const placement = { jobOfferDate: "", ...raw.toObject() };
    res.status(201).json({ placement });
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? "Failed to create placement" });
  }
}

// PUT /api/placements/:id
export async function updatePlacement(req: Request, res: Response) {
  try {
    const update = { ...req.body, jobOfferDate: req.body.jobOfferDate ?? "" };
    const raw = await Placement.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!raw) return res.status(404).json({ message: "Placement not found" });
    const placement = { jobOfferDate: "", ...raw.toObject() };
    res.json({ placement });
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? "Failed to update placement" });
  }
}

// DELETE /api/placements/:id
export async function deletePlacement(req: Request, res: Response) {
  try {
    await Placement.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete placement" });
  }
}
