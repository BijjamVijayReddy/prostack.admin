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
  const qrBuffer = await QRCode.toBuffer(
    `https://prostackacademy.com/verify/${data.certificateId}`,
    { type: "png", width: 100, margin: 1, color: { dark: "#000000", light: "#ffffff" } }
  );

  return new Promise((resolve, reject) => {
    const W  = 841.89;
    const H  = 595.28;
    const cx = W / 2;

    const doc = new PDFDocument({ size: [W, H], margin: 0, layout: "landscape" });
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

    // ── Background ────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(WHITE);

    // ── Navy corner triangles (all 4 corners) ─────────────────────
    const TRI = 165;
    doc.save().polygon([0,0],[TRI,0],[0,TRI]).fill(NAVY).restore();
    doc.save().polygon([W,0],[W-TRI,0],[W,TRI]).fill(NAVY).restore();
    doc.save().polygon([0,H],[TRI,H],[0,H-TRI]).fill(NAVY).restore();
    doc.save().polygon([W,H],[W-TRI,H],[W,H-TRI]).fill(NAVY).restore();

    // ── Gold double border ─────────────────────────────────────────
    const B1 = 16, B2 = 25;
    doc.rect(B1, B1, W-B1*2, H-B1*2).lineWidth(2.5).strokeColor(GOLD).stroke();
    doc.rect(B2, B2, W-B2*2, H-B2*2).lineWidth(0.8).strokeColor(GOLD).stroke();

    // ── Logo (top-left over triangle) ─────────────────────────────
    const lp1 = path.join(process.cwd(), "frontend", "public", "proStacklogo.png");
    const lp2 = path.join(__dirname, "../../../frontend/public/proStacklogo.png");
    const lp  = fs.existsSync(lp1) ? lp1 : fs.existsSync(lp2) ? lp2 : null;
    if (lp) {
      doc.image(lp, 30, 25, { fit: [118, 38] });
    } else {
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(13).text("Pro Stack", 33, 30);
      doc.fillColor(GOLD2).font("Helvetica").fontSize(9).text("Academy", 33, 46);
    }

    // ── Certificate ID (top-right) ─────────────────────────────────
    doc.fillColor(WHITE).font("Helvetica").fontSize(9)
       .text(`Certificate ID:  ${data.certificateId}`, W - 272, 37, { width: 238, align: "right" });

    // ─────────────────────────────────────────────────────────────
    // MAIN CONTENT  (centred)
    // ─────────────────────────────────────────────────────────────

    // "C E R T I F I C A T E"
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(15)
       .text("C  E  R  T  I  F  I  C  A  T  E", 0, 68, { align: "center", width: W });

    // "OF COMPLETION"
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(36)
       .text("OF COMPLETION", 0, 86, { align: "center", width: W });

    // ── Gold decoration line "— ◆ —" ─────────────────────────────
    const dY    = 138;
    const lineS = 148;          // line start x (left)
    const lineE = W - 148;      // line end x (right)
    const gap   = 52;           // half-gap around the center diamond

    doc.moveTo(lineS, dY).lineTo(cx - gap, dY).lineWidth(1.2).strokeColor(GOLD).stroke();
    doc.moveTo(cx + gap, dY).lineTo(lineE, dY).lineWidth(1.2).strokeColor(GOLD).stroke();
    // Left dot
    doc.circle(cx - gap - 10, dY, 2.5).fillColor(GOLD).fill();
    // Center diamond
    doc.save().translate(cx, dY).rotate(45)
       .rect(-6, -6, 12, 12).fillColor(GOLD).fill().restore();
    // Right dot
    doc.circle(cx + gap + 10, dY, 2.5).fillColor(GOLD).fill();

    // "This is to certify that"
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("This is to certify that", 0, 154, { align: "center", width: W });

    // ── Student Name ──────────────────────────────────────────────
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(40)
       .text(data.studentName, 0, 170, { align: "center", width: W });

    // Name underline (gold, centred, proportional to name width)
    const nameW = Math.min(doc.widthOfString(data.studentName) * 1.05, 380);
    doc.moveTo(cx - nameW / 2, 222)
       .lineTo(cx + nameW / 2, 222)
       .lineWidth(1.3).strokeColor(GOLD).stroke();

    // "has successfully completed the"
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("has successfully completed the", 0, 232, { align: "center", width: W });

    // Course name
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24)
       .text(data.course, 0, 250, { align: "center", width: W });

    // Stream / programme
    doc.fillColor(GRAY).font("Helvetica").fontSize(13)
       .text(data.stream, 0, 284, { align: "center", width: W });

    // Date range
    doc.fillColor(DARK).font("Helvetica").fontSize(10.5)
       .text(
         `This course was conducted from ${data.startMonthYear} to ${data.endMonthYear}.`,
         0, 308, { align: "center", width: W }
       );
    doc.fillColor(DARK).font("Helvetica").fontSize(10.5)
       .text("We wish the student all the best for future endeavors.", 0, 323, { align: "center", width: W });

    // ─────────────────────────────────────────────────────────────
    // BOTTOM SECTION:  Signature | Seal | Issue Date | QR Code
    // ─────────────────────────────────────────────────────────────
    const sigLineY = 468;   // y of the horizontal signature / date underline
    const sigX     = 105;   // left edge of signature block
    const dateX    = 570;   // left edge of issue-date block
    const sealCX   = 415;   // centre-x of seal
    const sealCY   = 447;   // centre-y of seal
    const sealR    = 44;

    // ── Signature ─────────────────────────────────────────────────
    // Cursive-looking signature text above the line
    doc.fillColor(DARK).font("Times-BoldItalic").fontSize(18)
       .text("Bijjam Vijay", sigX, sigLineY - 38, { width: 155 });
    // Underline
    doc.moveTo(sigX, sigLineY).lineTo(sigX + 150, sigLineY)
       .lineWidth(0.7).strokeColor("#9ca3af").stroke();
    // Caption
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10)
       .text("Mr. Bijjam Vijay", sigX, sigLineY + 8);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text("Founder & CEO",    sigX, sigLineY + 22)
       .text("Pro Stack Academy", sigX, sigLineY + 35);

    // ── Gold ornate seal ──────────────────────────────────────────
    // Outer serrated ring (spike rays)
    const SPIKES = 28;
    for (let i = 0; i < SPIKES; i++) {
      const a  = (i / SPIKES) * Math.PI * 2;
      const x1 = sealCX + sealR * Math.cos(a);
      const y1 = sealCY + sealR * Math.sin(a);
      const x2 = sealCX + (sealR - 9) * Math.cos(a);
      const y2 = sealCY + (sealR - 9) * Math.sin(a);
      doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(2).strokeColor(GOLD).stroke();
    }
    // Outer gold ring
    doc.circle(sealCX, sealCY, sealR).lineWidth(3).strokeColor(GOLD).stroke();
    // Inner ring
    doc.circle(sealCX, sealCY, sealR - 7).lineWidth(1).strokeColor(GOLD2).stroke();
    // Navy filled disc
    doc.circle(sealCX, sealCY, sealR - 10).fillColor(NAVY).fill();
    // Seal text
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8.5)
       .text("COURSE",    sealCX - 18, sealCY - 14, { width: 36, align: "center" });
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(7.5)
       .text("COMPLETED", sealCX - 22, sealCY + 0, { width: 44, align: "center" });
    doc.fillColor(GOLD).font("Helvetica").fontSize(9)
       .text("★", sealCX - 5, sealCY + 13);

    // Ribbon tails below seal
    const rbW  = 20;
    const rbH  = 26;
    const rbY0 = sealCY + sealR - 3;
    // Left ribbon
    doc.save().polygon(
      [sealCX - rbW,     rbY0],
      [sealCX - 3,       rbY0],
      [sealCX - 3,       rbY0 + rbH],
      [sealCX - rbW / 2, rbY0 + rbH - 7]
    ).fillColor(NAVY).fill().restore();
    // Right ribbon
    doc.save().polygon(
      [sealCX + 3,       rbY0],
      [sealCX + rbW,     rbY0],
      [sealCX + rbW / 2, rbY0 + rbH - 7],
      [sealCX + 3,       rbY0 + rbH]
    ).fillColor(NAVY).fill().restore();

    // ── Issue Date ────────────────────────────────────────────────
    doc.moveTo(dateX, sigLineY).lineTo(dateX + 135, sigLineY)
       .lineWidth(0.7).strokeColor("#9ca3af").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(11)
       .text(data.completionDate, dateX, sigLineY + 8, { width: 135 });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text("Issue Date", dateX, sigLineY + 24, { width: 135 });

    // ── QR Code ───────────────────────────────────────────────────
    const qrSz = 72;
    const qrX  = W - 108 - qrSz;
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