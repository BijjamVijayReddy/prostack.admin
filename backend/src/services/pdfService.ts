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
 * Generate a PDF completion certificate as a Buffer (landscape, 900×636).
 */
export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(
    `https://prostackacademy.com/verify/${data.certificateId}`,
    { type: "png", width: 120, margin: 1, color: { dark: "#000000", light: "#ffffff" } }
  );

  return new Promise((resolve, reject) => {
    const W  = 900;
    const H  = 636;
    const cx = W / 2;  // 450

    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const NAVY  = "#1a2557";
    const GOLD  = "#c9a227";
    const GOLD2 = "#e8d070";
    const WHITE = "#ffffff";
    const GRAY  = "#6b7280";
    const DARK  = "#1f2937";

    // ── White background ──────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(WHITE);

    // ── Navy corner triangles ─────────────────────────────────────
    const TRI = 180;
    doc.save().polygon([0,0],[TRI,0],[0,TRI]).fill(NAVY).restore();
    doc.save().polygon([W,0],[W-TRI,0],[W,TRI]).fill(NAVY).restore();
    doc.save().polygon([0,H],[TRI,H],[0,H-TRI]).fill(NAVY).restore();
    doc.save().polygon([W,H],[W-TRI,H],[W,H-TRI]).fill(NAVY).restore();

    // ── Octagonal gold borders ────────────────────────────────────
    // KEY FIX: two borders must have DIFFERENT diagonal sums (T1 ≠ T2).
    // A point (bx, by) lies on the diagonal of the TL triangle when bx+by = T.
    // Outer border: T1 = TRI-1 (≈ on the navy hypotenuse, 1pt inside white)
    // Inner border: T2 = TRI+12 (shifted ~8.5pt inward, since gap/√2 = 12/1.414)
    const B1  = 14;           // outer border straight-edge inset from page edge
    const T1  = TRI - 1;      // outer diagonal sum = 179  →  (14, 165)→(165, 14)
    const oc1 = T1 - B1;      // 165

    const B2  = 24;           // inner border straight-edge inset
    const T2  = TRI + 12;     // inner diagonal sum = 192  →  (24, 168)→(168, 24)
    const oc2 = T2 - B2;      // 168

    // Outer thick border (sits right at the navy-white edge)
    doc
      .moveTo(B1, oc1).lineTo(oc1, B1)
      .lineTo(W - oc1, B1).lineTo(W - B1, oc1)
      .lineTo(W - B1, H - oc1).lineTo(W - oc1, H - B1)
      .lineTo(oc1, H - B1).lineTo(B1, H - oc1)
      .closePath().lineWidth(2.5).strokeColor(GOLD).stroke();

    // Inner thin border (~8.5pt inward from outer)
    doc
      .moveTo(B2, oc2).lineTo(oc2, B2)
      .lineTo(W - oc2, B2).lineTo(W - B2, oc2)
      .lineTo(W - B2, H - oc2).lineTo(W - oc2, H - B2)
      .lineTo(oc2, H - B2).lineTo(B2, H - oc2)
      .closePath().lineWidth(0.9).strokeColor(GOLD).stroke();

    // ── Faint diagonal watermark ──────────────────────────────────
    doc.save();
    doc.translate(cx, H / 2);
    doc.rotate(-32);
    doc.fillColor(NAVY, 0.055).font("Helvetica-Bold").fontSize(58)
       .text("PRO STACK ACADEMY", -285, -36, { width: 570, align: "center", lineBreak: false });
    doc.restore();

    // ── Logo (top-left, over navy corner) ─────────────────────────
    const lp1 = path.join(process.cwd(), "frontend", "public", "proStacklogo.png");
    const lp2 = path.join(__dirname, "../../../frontend/public/proStacklogo.png");
    const lp  = fs.existsSync(lp1) ? lp1 : fs.existsSync(lp2) ? lp2 : null;
    if (lp) {
      doc.image(lp, 32, 26, { fit: [122, 42] });
    } else {
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(13).text("Pro Stack", 35, 30);
      doc.fillColor(GOLD2).font("Helvetica").fontSize(9).text("Academy", 35, 47);
    }

    // ── Certificate ID (top-right, over navy corner) ──────────────
    doc.fillColor(WHITE).font("Helvetica").fontSize(9)
       .text(`Certificate ID:  ${data.certificateId}`, W - 250, 38, { width: 235, align: "right" });

    // ─────────────────────────────────────────────────────────────
    // MAIN CONTENT  (centred)
    // ─────────────────────────────────────────────────────────────

    // "CERTIFICATE" — large navy heading (matches reference)
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(50)
       .text("CERTIFICATE", 0, 68, { align: "center", width: W });

    // "— OF COMPLETION —" gold subtitle with horizontal rules
    const ocY = 132;
    const hlf = 152;
    doc.moveTo(cx - hlf - 8, ocY + 10).lineTo(cx - 78, ocY + 10)
       .lineWidth(1.4).strokeColor(GOLD).stroke();
    doc.moveTo(cx + 78, ocY + 10).lineTo(cx + hlf + 8, ocY + 10)
       .lineWidth(1.4).strokeColor(GOLD).stroke();
    doc.circle(cx - hlf - 3, ocY + 10, 2.5).fillColor(GOLD).fill();
    doc.circle(cx + hlf + 3, ocY + 10, 2.5).fillColor(GOLD).fill();
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(17)
       .text("OF COMPLETION", 0, ocY, { align: "center", width: W });

    // "This is to certify that"
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("This is to certify that", 0, 163, { align: "center", width: W });

    // ── Student name ──────────────────────────────────────────────
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(42)
       .text(data.studentName, 0, 179, { align: "center", width: W });

    // Gold underline proportional to name length
    doc.font("Times-BoldItalic").fontSize(42);
    const nameW = Math.min(doc.widthOfString(data.studentName) * 1.1, 440);
    doc.moveTo(cx - nameW / 2, 233)
       .lineTo(cx + nameW / 2, 233)
       .lineWidth(1.4).strokeColor(GOLD).stroke();

    // "has successfully completed the"
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("has successfully completed the", 0, 244, { align: "center", width: W });

    // Course name
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24)
       .text(data.course, 0, 262, { align: "center", width: W });

    // Stream / programme
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(13)
       .text(data.stream, 0, 297, { align: "center", width: W });

    // Date range
    doc.fillColor(DARK).font("Helvetica").fontSize(10.5)
       .text(
         `This course was conducted from ${data.startMonthYear} to ${data.endMonthYear}.`,
         0, 322, { align: "center", width: W }
       );
    doc.fillColor(DARK).font("Helvetica").fontSize(10.5)
       .text("We wish the student all the best for future endeavors.", 0, 338, { align: "center", width: W });

    // ─────────────────────────────────────────────────────────────
    // BOTTOM SECTION:  Signature | Seal | Issue Date | QR Code
    // ─────────────────────────────────────────────────────────────
    const sigLineY = 530;
    const sigX     = 80;
    const dateX    = 568;
    const sealCX   = cx;       // 450
    const sealCY   = 478;
    const sealR    = 56;
    const discR    = sealR - 22;   // 34 — navy inner disc radius

    // ── Signature block ───────────────────────────────────────────
    doc.fillColor(DARK).font("Times-BoldItalic").fontSize(20)
       .text("Bijjam Vijay", sigX, sigLineY - 46, { width: 168 });
    doc.moveTo(sigX, sigLineY).lineTo(sigX + 164, sigLineY)
       .lineWidth(0.8).strokeColor("#9ca3af").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10)
       .text("Mr. Bijjam Vijay", sigX, sigLineY + 9);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text("Founder & CEO",     sigX, sigLineY + 23)
       .text("Pro Stack Academy", sigX, sigLineY + 36);

    // ── Ornate gold medallion seal ────────────────────────────────
    // 1. Alternating spike ring (coin-edge serration, 48 spikes)
    const SPIKES = 48;
    for (let i = 0; i < SPIKES; i++) {
      const a  = (i / SPIKES) * Math.PI * 2;
      const r1 = i % 2 === 0 ? sealR + 3 : sealR - 1;
      const r2 = sealR - 9;
      doc.moveTo(sealCX + r1 * Math.cos(a), sealCY + r1 * Math.sin(a))
         .lineTo(sealCX + r2 * Math.cos(a), sealCY + r2 * Math.sin(a))
         .lineWidth(2).strokeColor(GOLD).stroke();
    }
    // 2. Outer gold ring
    doc.circle(sealCX, sealCY, sealR).lineWidth(3).strokeColor(GOLD).stroke();
    // 3. Second ring
    doc.circle(sealCX, sealCY, sealR - 9).lineWidth(1.5).strokeColor(GOLD).stroke();
    // 4. Laurel dot ring (36 dots)
    const LDOTS = 36;
    for (let i = 0; i < LDOTS; i++) {
      const a = (i / LDOTS) * Math.PI * 2;
      const r = sealR - 14;
      doc.circle(sealCX + r * Math.cos(a), sealCY + r * Math.sin(a), 1.9)
         .fillColor(GOLD2).fill();
    }
    // 5. Inner accent ring
    doc.circle(sealCX, sealCY, sealR - 18).lineWidth(0.8).strokeColor(GOLD2).stroke();
    // 6. Navy filled disc
    doc.circle(sealCX, sealCY, discR).fillColor(NAVY).fill();
    // 7. Text inside disc
    doc.fillColor(GOLD).font("Helvetica").fontSize(8)
       .text("★  ★  ★", sealCX - 22, sealCY - discR + 6, { width: 44, align: "center" });
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9)
       .text("COURSE",    sealCX - 22, sealCY - 14, { width: 44, align: "center" });
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(7.5)
       .text("COMPLETED", sealCX - 27, sealCY + 1,  { width: 54, align: "center" });

    // 8. Ribbon tails
    const rbW  = 20;
    const rbH  = 32;
    const rbY0 = sealCY + sealR;
    doc.save().polygon(
      [sealCX - rbW,     rbY0],
      [sealCX - 3,       rbY0],
      [sealCX - 3,       rbY0 + rbH],
      [sealCX - rbW / 2, rbY0 + rbH - 8]
    ).fillColor(NAVY).fill().restore();
    doc.save().polygon(
      [sealCX + 3,       rbY0],
      [sealCX + rbW,     rbY0],
      [sealCX + rbW / 2, rbY0 + rbH - 8],
      [sealCX + 3,       rbY0 + rbH]
    ).fillColor(NAVY).fill().restore();

    // ── Issue Date ────────────────────────────────────────────────
    doc.moveTo(dateX, sigLineY).lineTo(dateX + 140, sigLineY)
       .lineWidth(0.8).strokeColor("#9ca3af").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(12)
       .text(data.completionDate, dateX, sigLineY + 9, { width: 140 });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text("Issue Date", dateX, sigLineY + 26, { width: 140 });

    // ── QR Code ───────────────────────────────────────────────────
    const qrSz = 76;
    const qrX  = W - 100 - qrSz;   // 724 — clear of right corner triangle
    const qrY  = sealCY - qrSz / 2 - 2;
    doc.image(qrBuffer, qrX, qrY, { width: qrSz, height: qrSz });
    doc.fillColor("#16a34a").font("Helvetica").fontSize(8)
       .text("Scan to Verify", qrX, qrY + qrSz + 4, { width: qrSz, align: "center" });

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
