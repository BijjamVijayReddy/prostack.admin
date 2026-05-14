import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { IStudent } from "../models/Student";

export interface CertificateData {
  studentName: string;
  admissionNo: string;
  course: string;
  stream: string;
  startMonthYear: string;   // e.g. "February 2026"
  endMonthYear: string;     // e.g. "May 2026"
  certificateId: string;    // e.g. "PSA/FS/2026/0547"
  completionDate: string;   // e.g. "14 May 2026"
}

/** Derive a short 2-letter course code from stream/course string */
function courseCode(stream: string, course: string): string {
  const s = (stream || course).toUpperCase();
  if (s.includes("PYTHON")) return "PF";
  if (s.includes("JAVA"))   return "JF";
  if (s.includes("REACT"))  return "RC";
  if (s.includes("MERN"))   return "MN";
  if (s.includes("MEAN"))   return "MN";
  if (s.includes("DATA"))   return "DS";
  if (s.includes("CLOUD"))  return "CL";
  if (s.includes("DEVOPS")) return "DO";
  if (s.includes("ANDROID"))return "AD";
  if (s.includes("IOS"))    return "IS";
  if (s.includes("UI"))     return "UI";
  return "FS";
}

/** Build an auto certificate ID from an admissionNo + completion year */
export function buildCertificateId(admissionNo: string, stream: string, course: string, completionYear: number): string {
  const seqMatch = admissionNo.match(/^AD(\d{3})/);
  const seq = seqMatch ? parseInt(seqMatch[1], 10) : 1;
  const certNum = String(seq + 540).padStart(4, "0");
  const code = courseCode(stream, course);
  return `PSA/${code}/${completionYear}/${certNum}`;
}

/**
 * Generate a PDF completion certificate as a Buffer (A4 Landscape).
 */
export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  // Generate QR code PNG buffer (encodes the certificate ID)
  const qrBuffer = await QRCode.toBuffer(
    `https://prostack-admin.com/verify/${data.certificateId}`,
    { type: "png", width: 80, margin: 1, color: { dark: "#000000", light: "#ffffff" } }
  );

  return new Promise((resolve, reject) => {
    const PAGE_W = 841.89;
    const PAGE_H = 595.28;

    const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0, layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const NAVY   = "#1a2557";
    const GOLD   = "#c9a227";
    const L_GOLD = "#e8d070";
    const WHITE  = "#ffffff";
    const GRAY   = "#6b7280";
    const DARK   = "#111827";

    // ── White background ─────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(WHITE);

    // ── Navy corner triangles (top-left & bottom-right) ──────────
    const triSize = 160;
    // Top-left
    doc.save().polygon([0, 0], [triSize, 0], [0, triSize]).fill(NAVY).restore();
    // Bottom-right
    doc.save().polygon([PAGE_W, PAGE_H], [PAGE_W - triSize, PAGE_H], [PAGE_W, PAGE_H - triSize]).fill(NAVY).restore();
    // Top-right corner
    doc.save().polygon([PAGE_W, 0], [PAGE_W - triSize, 0], [PAGE_W, triSize]).fill(NAVY).restore();
    // Bottom-left corner
    doc.save().polygon([0, PAGE_H], [triSize, PAGE_H], [0, PAGE_H - triSize]).fill(NAVY).restore();

    // ── Gold outer border ─────────────────────────────────────────
    const brd = 18;
    doc.rect(brd, brd, PAGE_W - brd * 2, PAGE_H - brd * 2)
       .lineWidth(2.5).strokeColor(GOLD).stroke();
    // Inner thin border
    const brd2 = 26;
    doc.rect(brd2, brd2, PAGE_W - brd2 * 2, PAGE_H - brd2 * 2)
       .lineWidth(0.8).strokeColor(GOLD).stroke();

    // ── Logo (top-left over triangle) ────────────────────────────
    const logoPath = path.join(__dirname, "../../../frontend/public/proStacklogo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 32, 30, { width: 110, height: 36, fit: [110, 36] });
    } else {
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11).text("Pro Stack", 32, 40);
      doc.fillColor(L_GOLD).font("Helvetica").fontSize(9).text("Academy", 32, 54);
    }

    // ── Certificate ID (top-right) ────────────────────────────────
    doc.fillColor(WHITE).font("Helvetica").fontSize(9)
       .text(`Certificate ID:  ${data.certificateId}`, PAGE_W - 260, 42, { width: 220, align: "right" });

    // ── CERTIFICATE title ─────────────────────────────────────────
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(13)
       .text("C E R T I F I C A T E", 0, 80, { align: "center", width: PAGE_W });

    // ── "OF COMPLETION" ───────────────────────────────────────────
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(30)
       .text("OF COMPLETION", 0, 100, { align: "center", width: PAGE_W });

    // ── Gold horizontal rule with diamond ────────────────────────
    const ruleY = 148;
    doc.moveTo(120, ruleY).lineTo(PAGE_W - 120, ruleY).lineWidth(1.2).strokeColor(GOLD).stroke();
    // Diamond center
    const cx = PAGE_W / 2;
    doc.save().translate(cx, ruleY).rotate(45)
       .rect(-5, -5, 10, 10).fillColor(GOLD).fill().restore();

    // ── "This is to certify that" ─────────────────────────────────
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("This is to certify that", 0, 162, { align: "center", width: PAGE_W });

    // ── Student name (script style) ───────────────────────────────
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(38)
       .text(data.studentName, 0, 182, { align: "center", width: PAGE_W });

    // Underline for name
    const nameWidth = Math.min(doc.widthOfString(data.studentName) * 1.1, 340);
    const nameUnderY = 230;
    doc.moveTo(cx - nameWidth / 2, nameUnderY).lineTo(cx + nameWidth / 2, nameUnderY)
       .lineWidth(1).strokeColor(GOLD).stroke();

    // ── "has successfully completed the" ─────────────────────────
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("has successfully completed the", 0, 240, { align: "center", width: PAGE_W });

    // ── Course name ───────────────────────────────────────────────
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(22)
       .text(data.course, 0, 258, { align: "center", width: PAGE_W });

    // ── Stream ────────────────────────────────────────────────────
    doc.fillColor(GRAY).font("Helvetica").fontSize(12)
       .text(data.stream, 0, 286, { align: "center", width: PAGE_W });

    // ── Date range sentence ───────────────────────────────────────
    doc.fillColor(DARK).font("Helvetica").fontSize(10)
       .text(
         `This course was conducted from ${data.startMonthYear} to ${data.endMonthYear}.`,
         0, 308, { align: "center", width: PAGE_W }
       );
    doc.fillColor(DARK).font("Helvetica").fontSize(10)
       .text("We wish the student all the best for future endeavors.", 0, 322, { align: "center", width: PAGE_W });

    // ── Bottom section: Signature | Seal | Issue Date | QR ────────
    const bottomY = 360;

    // Signature block (left)
    const sigX = 120;
    // Signature line
    doc.moveTo(sigX, bottomY + 35).lineTo(sigX + 130, bottomY + 35)
       .lineWidth(0.8).strokeColor("#d1d5db").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10)
       .text("Mr. Bijjam Vijay", sigX, bottomY + 42);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text("Founder & CEO", sigX, bottomY + 56)
       .text("Pro Stack Academy", sigX, bottomY + 69);

    // ── Gold seal (center) ────────────────────────────────────────
    const sealX = PAGE_W / 2;
    const sealY = bottomY + 20;
    const sealR = 42;
    // Outer gold circle
    doc.circle(sealX, sealY, sealR).lineWidth(3).strokeColor(GOLD).stroke();
    doc.circle(sealX, sealY, sealR - 6).lineWidth(1).strokeColor(L_GOLD).stroke();
    // Ribbon arcs at bottom of seal
    doc.circle(sealX - 12, sealY + sealR + 6, 14).fillColor(NAVY).fill();
    doc.circle(sealX + 12, sealY + sealR + 6, 14).fillColor(NAVY).fill();
    // Seal text inside
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8)
       .text("COURSE", sealX - 18, sealY - 10);
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8)
       .text("COMPLETED", sealX - 24, sealY + 3);

    // ── Issue Date (right of seal) ────────────────────────────────
    const dateX = PAGE_W / 2 + 100;
    doc.moveTo(dateX, bottomY + 35).lineTo(dateX + 130, bottomY + 35)
       .lineWidth(0.8).strokeColor("#d1d5db").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10)
       .text(data.completionDate, dateX, bottomY + 42);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text("Issue Date", dateX, bottomY + 56);

    // ── QR Code (far right) ───────────────────────────────────────
    const qrX = PAGE_W - 120;
    const qrY = bottomY - 10;
    doc.image(qrBuffer, qrX, qrY, { width: 70, height: 70 });
    doc.fillColor("#16a34a").font("Helvetica").fontSize(8)
       .text("Scan to Verify", qrX, qrY + 72, { width: 70, align: "center" });

    doc.end();
  });
}

export interface ReceiptData {
  student: IStudent;
  amount: number;
  paymentMethod: string;
  invoiceNo: string;
  paymentDate: string;
  academyName?: string;
  academyPhone?: string;
  academyEmail?: string;
}

/**
 * Generate a PDF payment receipt as a Buffer.
 */
export async function generateReceipt(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const academyName  = data.academyName  ?? "Pro Stack Academy";
    const academyPhone = data.academyPhone ?? "+91 99999 99999";
    const academyEmail = data.academyEmail ?? "info@prostackacademy.com";

    const ORANGE = "#FF6B2C";
    const DARK   = "#0B1220";
    const GRAY   = "#6B7280";

    // ── Header bar ───────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill(DARK);
    doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold")
       .text(academyName, 50, 25);
    doc.fontSize(9).font("Helvetica").fillColor("#FFFFFF80")
       .text(`${academyPhone}  |  ${academyEmail}`, 50, 55);

    // ── Orange accent strip ───────────────────────────────────────
    doc.rect(0, 80, 595, 4).fill(ORANGE);

    // ── Invoice title ─────────────────────────────────────────────
    doc.moveDown(2);
    doc.fillColor(DARK).fontSize(18).font("Helvetica-Bold")
       .text("PAYMENT RECEIPT", 50, 110);
    doc.fontSize(10).font("Helvetica").fillColor(GRAY)
       .text(`Invoice No: ${data.invoiceNo}`, 50, 135)
       .text(`Date: ${data.paymentDate}`, 50, 150);

    // ── Divider ───────────────────────────────────────────────────
    doc.moveTo(50, 175).lineTo(545, 175).strokeColor("#E5E7EB").stroke();

    // ── Student info ──────────────────────────────────────────────
    const leftX = 50, rightX = 320;
    let y = 190;

    const row = (label: string, value: string, yPos: number) => {
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(label, leftX, yPos);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(DARK).text(value, leftX, yPos + 14);
    };
    const rowR = (label: string, value: string, yPos: number) => {
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(label, rightX, yPos);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(DARK).text(value, rightX, yPos + 14);
    };

    row("Student Name", data.student.name, y);
    rowR("Admission No", data.student.admissionNo, y);
    y += 45;
    row("Course", data.student.course, y);
    rowR("Batch / Stream", data.student.stream || "—", y);
    y += 45;
    row("Mobile", data.student.mobile, y);
    rowR("Payment Mode", data.paymentMethod, y);
    y += 55;

    // ── Orange payment box ────────────────────────────────────────
    doc.rect(50, y, 495, 70).fill(ORANGE);
    doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica")
       .text("AMOUNT PAID", 80, y + 12);
    doc.fontSize(28).font("Helvetica-Bold")
       .text(`₹ ${data.amount.toLocaleString("en-IN")}`, 80, y + 28);

    const totalFee     = data.student.totalFee     ?? 0;
    const totalPaid    = data.student.totalPaid    ?? 0;
    const pendingAmount = data.student.pendingAmount ?? 0;

    doc.fontSize(10).font("Helvetica").fillColor("#FFFFFF")
       .text(`Total Fee: ₹${totalFee.toLocaleString("en-IN")}`, 360, y + 14)
       .text(`Total Paid: ₹${totalPaid.toLocaleString("en-IN")}`, 360, y + 30)
       .text(`Balance Due: ₹${pendingAmount.toLocaleString("en-IN")}`, 360, y + 46);

    y += 90;

    // ── Footer ────────────────────────────────────────────────────
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#E5E7EB").stroke();
    y += 15;
    doc.fontSize(8).font("Helvetica").fillColor(GRAY)
       .text(
         "This is a computer-generated receipt and does not require a physical signature.",
         50, y, { align: "center", width: 495 }
       );

    doc.end();
  });
}
