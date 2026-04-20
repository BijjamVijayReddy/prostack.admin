import { Request, Response } from "express";
import { Student } from "../models/Student";
import { Enquiry } from "../models/Enquiry";
import { Placement } from "../models/Placement";

// ── Date helpers ───────────────────────────────────────────────────────────────
// Use local date string to avoid UTC-offset issues (e.g. IST UTC+5:30)
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// GET /api/dashboard/overview?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function getOverview(req: Request, res: Response) {
  try {
    const { start, end } = req.query as { start: string; end: string };
    if (!start || !end) {
      return res.status(400).json({ message: "start and end query params are required" });
    }

    // ── Previous period (same duration, immediately before start) ─────────────
    const startMs   = new Date(start).getTime();
    const endMs     = new Date(end).getTime();
    const duration  = endMs - startMs + 86_400_000; // inclusive
    const prevEnd   = toISO(new Date(startMs - 86_400_000));
    const prevStart = toISO(new Date(startMs - duration));

    const durationDays = Math.round(duration / 86_400_000);
    const useDaily     = durationDays <= 31;

    const year      = new Date(start).getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd   = `${year}-12-31`;
    const prevYear      = year - 1;
    const prevYearStart = `${prevYear}-01-01`;
    const prevYearEnd   = `${prevYear}-12-31`;

    // ── Parallel queries ──────────────────────────────────────────────────────
    const currentYear = new Date().getFullYear();

    const [
      totalStudents,
      prevTotalStudents,
      newAdmissions,
      prevNewAdmissions,
      studentsPlaced,
      prevStudentsPlaced,
      feeStudents,
      prevFeeStudents,
      trendStudents,
      trendEnquiries,
      allStudentCourses,
      // ── Order Summary ──
      feeStatusStudents,       // students admitted in range with payment fields
      enquiryStatusDocs,       // enquiries created in range with status
      allPlacements,           // all placements (for placement progress)
      allStudentsForPlacement, // all students passoutYear data
      allTimeActiveEnquiries,  // all-time pending+follow-up (for likely-to-join)
      allTimeConvertedEnquiries, // all-time converted (for conversion rate)
      allTimeClosedEnquiries,  // all-time not-interested (for conversion rate)
      prevEnquiryStatusDocs,   // enquiries in previous period
    ] = await Promise.all([
      // ── Total Students (year-scoped by joinedDate) ──
      Student.countDocuments({ joinedDate: { $gte: yearStart, $lte: yearEnd } }),
      Student.countDocuments({ joinedDate: { $gte: prevYearStart, $lte: prevYearEnd } }),
      Student.countDocuments({ joinedDate: { $gte: start, $lte: end } }),
      Student.countDocuments({ joinedDate: { $gte: prevStart, $lte: prevEnd } }),
      Placement.countDocuments({ joinedCompanyDate: { $gte: start, $lte: end } }),
      Placement.countDocuments({ joinedCompanyDate: { $gte: prevStart, $lte: prevEnd } }),
      Student.find({ joinedDate: { $gte: start, $lte: end } }, { totalFee: 1, totalPaid: 1 }).lean(),
      Student.find({ joinedDate: { $gte: prevStart, $lte: prevEnd } }, { totalFee: 1, totalPaid: 1 }).lean(),
      useDaily
        ? Student.find({ joinedDate: { $gte: start, $lte: end } }, { joinedDate: 1 }).lean()
        : Student.find({ joinedDate: { $gte: yearStart, $lte: yearEnd } }, { joinedDate: 1 }).lean(),
      useDaily
        ? Enquiry.find({ enquiryDate: { $gte: start, $lte: end } }, { enquiryDate: 1 }).lean()
        : Enquiry.find({ enquiryDate: { $gte: yearStart, $lte: yearEnd } }, { enquiryDate: 1 }).lean(),
      Student.find({ joinedDate: { $gte: start, $lte: end } }, { course: 1 }).lean(),
      // Order Summary queries
      Student.find({ joinedDate: { $gte: start, $lte: end } }, { totalFee: 1, totalPaid: 1, pendingAmount: 1 }).lean(),
      Enquiry.find({ enquiryDate: { $gte: start, $lte: end } }, { status: 1 }).lean(),
      Placement.countDocuments(),
      Student.find({}, { passoutYear: 1 }).lean(),
      Enquiry.countDocuments({ status: { $in: ["Pending", "Follow-up"] } }),
      Enquiry.countDocuments({ status: "Converted" }),
      Enquiry.countDocuments({ status: "Not Interested" }),
      Enquiry.find({ enquiryDate: { $gte: prevStart, $lte: prevEnd } }, { status: 1 }).lean(),
    ]);

    // ── Fee collection % ──────────────────────────────────────────────────────
    const totalFee  = feeStudents.reduce((s, st) => s + (st.totalFee  || 0), 0);
    const totalPaid = feeStudents.reduce((s, st) => s + (st.totalPaid || 0), 0);
    const feeCollectionPct = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;

    const prevTotalFee  = prevFeeStudents.reduce((s, st) => s + (st.totalFee  || 0), 0);
    const prevTotalPaid = prevFeeStudents.reduce((s, st) => s + (st.totalPaid || 0), 0);
    const prevFeeCollectionPct = prevTotalFee > 0 ? Math.round((prevTotalPaid / prevTotalFee) * 100) : 0;

    // ── Trend data ────────────────────────────────────────────────────────────
    let trendLabels:       string[];
    let trendAdmissions:   number[];
    let trendEnquiriesArr: number[];

    if (useDaily) {
      const dayMap: Record<string, { admissions: number; enquiries: number }> = {};
      const [sy, sm, sd] = start.split("-").map(Number);
      const [ey, em, ed] = end.split("-").map(Number);
      const cursor  = new Date(sy, sm - 1, sd);
      const endDate = new Date(ey, em - 1, ed);
      while (cursor <= endDate) {
        dayMap[toISO(cursor)] = { admissions: 0, enquiries: 0 };
        cursor.setDate(cursor.getDate() + 1);
      }

      trendStudents.forEach((s) => {
        const key = (s.joinedDate as string).slice(0, 10);
        if (dayMap[key]) dayMap[key].admissions++;
      });
      (trendEnquiries as any[]).forEach((e) => {
        const key = (e.enquiryDate as string).slice(0, 10);
        if (dayMap[key]) dayMap[key].enquiries++;
      });

      trendLabels       = Object.keys(dayMap).map(dayLabel);
      trendAdmissions   = Object.values(dayMap).map((v) => v.admissions);
      trendEnquiriesArr = Object.values(dayMap).map((v) => v.enquiries);
    } else {
      trendLabels       = MONTH_NAMES;
      trendAdmissions   = Array<number>(12).fill(0);
      trendEnquiriesArr = Array<number>(12).fill(0);
      trendStudents.forEach((s) => {
        const m = new Date((s.joinedDate as string).replace(/-/g, "/")).getMonth();
        if (m >= 0 && m < 12) trendAdmissions[m]++;
      });
      (trendEnquiries as any[]).forEach((e) => {
        const m = new Date((e.enquiryDate as string).replace(/-/g, "/")).getMonth();
        if (m >= 0 && m < 12) trendEnquiriesArr[m]++;
      });
    }

    // ── Course enrollment ─────────────────────────────────────────────────────
    const courseMap: Record<string, number> = {};
    allStudentCourses.forEach((s) => {
      const c = (s.course as string) || "Other";
      courseMap[c] = (courseMap[c] || 0) + 1;
    });
    const courseEnrollment = Object.entries(courseMap)
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count);

    // ── Fee Status (students admitted in range) ───────────────────────────────
    let feeFullyPaid = 0, feePartialPaid = 0, feeNotPaid = 0;
    let feeFullyPaidAmt = 0, feePartialPaidAmt = 0, feeNotPaidAmt = 0;
    feeStatusStudents.forEach((s: any) => {
      const paid    = s.totalPaid    || 0;
      const pending = s.pendingAmount || 0;
      const fee     = s.totalFee     || 0;
      if (pending === 0 && fee > 0) {
        feeFullyPaid++;
        feeFullyPaidAmt += paid;
      } else if (paid > 0 && pending > 0) {
        feePartialPaid++;
        feePartialPaidAmt += paid;
      } else {
        feeNotPaid++;
        feeNotPaidAmt += fee;
      }
    });
    const feeTotal = feeFullyPaid + feePartialPaid + feeNotPaid;

    // ── Enquiry Conversion (enquiries in range) ───────────────────────────────
    let enquiryConverted = 0, enquiryInProgress = 0, enquiryNotConverted = 0;
    (enquiryStatusDocs as any[]).forEach((e) => {
      if (e.status === "Converted")                              enquiryConverted++;
      else if (e.status === "Pending" || e.status === "Follow-up") enquiryInProgress++;
      else                                                        enquiryNotConverted++;
    });
    const enquiryTotal = enquiryConverted + enquiryInProgress + enquiryNotConverted;

    let prevEnquiryConverted = 0, prevEnquiryInProgress = 0, prevEnquiryNotConverted = 0;
    (prevEnquiryStatusDocs as any[]).forEach((e) => {
      if (e.status === "Converted")                              prevEnquiryConverted++;
      else if (e.status === "Pending" || e.status === "Follow-up") prevEnquiryInProgress++;
      else                                                        prevEnquiryNotConverted++;
    });
    const prevEnquiryTotal = prevEnquiryConverted + prevEnquiryInProgress + prevEnquiryNotConverted;

    // ── Placement Progress ────────────────────────────────────────────────────
    // Placed   = all placements (total records in DB)
    // In Process = students with passoutYear === current year (recent graduates)
    // Not Placed = all students - placed - inProcess
    const placementPlaced      = allPlacements as number;
    const placementInProcess   = (allStudentsForPlacement as any[]).filter(
      (s) => Number(s.passoutYear) === currentYear
    ).length;
    const placementNotPlaced   = Math.max(0, totalStudents - placementPlaced - placementInProcess);
    const placementTotalBasis  = totalStudents; // center number

    // ── Batch Categories (all students by passoutYear) ────────────────────────
    const allStudentsArr = allStudentsForPlacement as any[];
    const batchFreshers = allStudentsArr.filter((s) => Number(s.passoutYear) === currentYear).length;
    const batchRecent   = allStudentsArr.filter((s) => { const y = Number(s.passoutYear); return y >= 2022 && y < currentYear; }).length;
    const batchSenior   = allStudentsArr.filter((s) => Number(s.passoutYear) < 2022).length;

    res.json({
      year,
      totalStudents,
      prevTotalStudents,
      newAdmissions,
      prevNewAdmissions,
      studentsPlaced,
      prevStudentsPlaced,
      feeCollectionPct,
      prevFeeCollectionPct,
      trendLabels,
      trendAdmissions,
      trendEnquiries: trendEnquiriesArr,
      courseEnrollment,
      // Order Summary
      feeStatus: { total: feeTotal, fullyPaid: feeFullyPaid, partialPaid: feePartialPaid, notPaid: feeNotPaid, fullyPaidAmt: feeFullyPaidAmt, partialPaidAmt: feePartialPaidAmt, notPaidAmt: feeNotPaidAmt },
      enquiryStatus: { total: enquiryTotal, converted: enquiryConverted, inProgress: enquiryInProgress, notConverted: enquiryNotConverted, allTimeActive: allTimeActiveEnquiries as number, allTimeConverted: allTimeConvertedEnquiries as number, allTimeClosed: allTimeClosedEnquiries as number, prevTotal: prevEnquiryTotal, prevConverted: prevEnquiryConverted, prevInProgress: prevEnquiryInProgress, prevNotConverted: prevEnquiryNotConverted },
      placementStatus: { total: placementTotalBasis, placed: placementPlaced, inProcess: placementInProcess, notPlaced: placementNotPlaced },
      batchCategories: { freshers: batchFreshers, recent: batchRecent, senior: batchSenior },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? "Failed to fetch overview" });
  }
}

// GET /api/dashboard/batch-categories
export async function getBatchCategories(req: Request, res: Response) {
  try {
    const currentYear = new Date().getFullYear();
    const students = await Student.find({}, { passoutYear: 1 }).lean();
    const freshers = students.filter((s: any) => Number(s.passoutYear) === currentYear).length;
    const recent   = students.filter((s: any) => { const y = Number(s.passoutYear); return y >= 2022 && y < currentYear; }).length;
    const senior   = students.filter((s: any) => Number(s.passoutYear) < 2022).length;
    res.json({ freshers, recent, senior, currentYear });
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? "Failed to fetch batch categories" });
  }
}