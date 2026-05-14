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
  startMonthYear: string;
  endMonthYear: string;
  certificateId: string;
  completionDate: string;
}

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

export function buildCertificateId(admissionNo: string, stream: string, course: string, completionYear: number): string {
  const seqMatch = admissionNo.match(/^AD(\d{3})/);
  const seq = seqMatch ? parseInt(seqMatch[1], 10) : 1;
  const certNum = String(seq + 540).padStart(4, "0");
  const code = courseCode(stream, course);
  return `PSA/${code}/${completionYear}/${certNum}`;
}

export async function generateCertificate(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const W  = 595;
    const H  = 842;
    const cx = W / 2;

    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const NAVY   = "#1a2557";
    const NAVY2  = "#243070";
    const LTBLUE = "#dce8f5";
    const CORAL  = "#e05c30";
    const GOLD   = "#c9a227";
    const GOLD2  = "#e8d070";
    const WHITE  = "#ffffff";
    const GRAY   = "#6b7280";
    const DARK   = "#1f2937";

    doc.rect(0, 0, W, H).fill(WHITE);

    const bandH    = 170;
    const curveDip = 50;

    doc.save();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, bandH)
       .bezierCurveTo(W * 0.75, bandH + curveDip * 2, W * 0.25, bandH + curveDip * 2, 0, bandH)
       .closePath().fill(NAVY);
    doc.restore();

    const arc2Top = bandH - 4;
    const arc2H   = 28;
    doc.save();
    doc.moveTo(0, arc2Top)
       .bezierCurveTo(W * 0.25, arc2Top + curveDip * 2, W * 0.75, arc2Top + curveDip * 2, W, arc2Top)
       .lineTo(W, arc2Top + arc2H)
       .bezierCurveTo(W * 0.75, arc2Top + arc2H + curveDip * 2, W * 0.25, arc2Top + arc2H + curveDip * 2, 0, arc2Top + arc2H)
       .closePath().fill(LTBLUE);
    doc.restore();

    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(40)
       .text("CERTIFICATE", 0, 38, { align: "center", width: W });
    doc.fillColor(GOLD2).font("Helvetica-Oblique").fontSize(22)
       .text("of Completion", 0, 86, { align: "center", width: W });

    const sealCX = W - 80;
    const sealCY = 110;
    const sealR  = 54;
    const discR  = sealR - 18;

    for (let i = 0; i < 48; i++) {
      const a  = (i / 48) * Math.PI * 2;
      const r1 = i % 2 === 0 ? sealR + 4 : sealR;
      const r2 = sealR - 8;
      doc.moveTo(sealCX + r1 * Math.cos(a), sealCY + r1 * Math.sin(a))
         .lineTo(sealCX + r2 * Math.cos(a), sealCY + r2 * Math.sin(a))
         .lineWidth(1.8).strokeColor(GOLD).stroke();
    }
    doc.circle(sealCX, sealCY, sealR).lineWidth(3).strokeColor(GOLD).stroke();
    doc.circle(sealCX, sealCY, sealR - 8).lineWidth(1.2).strokeColor(GOLD2).stroke();
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2;
      const r = sealR - 13;
      doc.circle(sealCX + r * Math.cos(a), sealCY + r * Math.sin(a), 1.6).fillColor(GOLD2).fill();
    }
    doc.circle(sealCX, sealCY, sealR - 17).lineWidth(0.8).strokeColor(GOLD).stroke();
    doc.circle(sealCX, sealCY, discR).fillColor(NAVY).fill();

    const lp1 = path.join(process.cwd(), "frontend", "public", "proStacklogo.png");
    const lp2 = path.join(__dirname, "../../../frontend/public/proStacklogo.png");
    const lp  = fs.existsSync(lp1) ? lp1 : fs.existsSync(lp2) ? lp2 : null;
    if (lp) {
      doc.save();
      doc.circle(sealCX, sealCY, discR - 2).clip();
      doc.image(lp, sealCX - discR + 4, sealCY - discR + 4, { fit: [(discR - 4) * 2, (discR - 4) * 2] });
      doc.restore();
    } else {
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8)
         .text("Pro Stack", sealCX - 20, sealCY - 14, { width: 40, align: "center" });
      doc.fillColor(WHITE).font("Helvetica").fontSize(7)
         .text("Academy", sealCX - 20, sealCY + 1, { width: 40, align: "center" });
    }
    doc.fillColor(GOLD).font("Helvetica").fontSize(7.5)
       .text("  ★  ★  ★", sealCX - 21, sealCY + discR - 4, { width: 42, align: "center" });

    const rbW  = 16;
    const rbH  = 30;
    const rbY0 = sealCY + sealR - 1;
    doc.save().polygon([sealCX - rbW, rbY0],[sealCX - 2, rbY0],[sealCX - 2, rbY0 + rbH],[sealCX - rbW / 2, rbY0 + rbH - 7]).fillColor(NAVY2).fill().restore();
    doc.save().polygon([sealCX + 2, rbY0],[sealCX + rbW, rbY0],[sealCX + rbW / 2, rbY0 + rbH - 7],[sealCX + 2, rbY0 + rbH]).fillColor(NAVY2).fill().restore();

    doc.fillColor(GRAY).font("Helvetica").fontSize(7.5)
       .text(`ID: ${data.certificateId}`, sealCX - 55, rbY0 + rbH + 4, { width: 110, align: "center" });

    const bodyTop = bandH + curveDip * 2 + arc2H + 14;
    doc.moveTo(60, bodyTop).lineTo(W - 60, bodyTop).lineWidth(0.8).strokeColor(GOLD).stroke();

    doc.fillColor(GRAY).font("Helvetica").fontSize(10)
       .text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 0, bodyTop + 14, { align: "center", width: W });

    doc.fillColor(CORAL).font("Times-BoldItalic").fontSize(38)
       .text(data.studentName, 0, bodyTop + 34, { align: "center", width: W });

    doc.font("Times-BoldItalic").fontSize(38);
    const nameW    = Math.min(doc.widthOfString(data.studentName) * 1.08, 380);
    const nameLineY = bodyTop + 34 + 46;
    doc.moveTo(cx - nameW / 2, nameLineY).lineTo(cx + nameW / 2, nameLineY).lineWidth(1.2).strokeColor(GOLD).stroke();

    const paraY = nameLineY + 18;
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text("For the exceptional performance that has led to the successful completion of", 60, paraY, { align: "center", width: W - 120 });
    const line2Y = paraY + 20;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(11)
       .text(`${data.course}`, 60, line2Y, { align: "center", width: W - 120 });
    doc.fillColor(DARK).font("Helvetica").fontSize(11)
       .text(`conducted at Pro Stack between ${data.startMonthYear} to ${data.endMonthYear}`, 60, line2Y + 18, { align: "center", width: W - 120 });

    doc.save();
    doc.translate(cx, H * 0.55);
    doc.rotate(-30);
    doc.fillColor(NAVY, 0.05).font("Helvetica-Bold").fontSize(52)
       .text("PRO STACK", -200, -30, { width: 400, align: "center", lineBreak: false });
    doc.fillColor(NAVY, 0.05).font("Helvetica-Bold").fontSize(52)
       .text("ACADEMY", -200, 30, { width: 400, align: "center", lineBreak: false });
    doc.restore();

    const sigY  = H - 168;
    const sig1X = 80;
    const sig2X = W - 220;

    doc.fillColor(DARK).font("Times-BoldItalic").fontSize(16)
       .text("Manikanth reddy", sig1X, sigY, { width: 160 });
    doc.moveTo(sig1X, sigY + 26).lineTo(sig1X + 155, sigY + 26).lineWidth(0.8).strokeColor("#9ca3af").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9.5)
       .text("Course Trainer", sig1X, sigY + 32);

    doc.fillColor(DARK).font("Times-BoldItalic").fontSize(16)
       .text("venkat", sig2X, sigY, { width: 140 });
    doc.moveTo(sig2X, sigY + 26).lineTo(sig2X + 135, sigY + 26).lineWidth(0.8).strokeColor("#9ca3af").stroke();
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9.5)
       .text("Authorized signatory", sig2X, sigY + 32);

    doc.rect(0, H - 58, W, 58).fill(NAVY);

    if (lp) {
      doc.image(lp, W - 132, H - 50, { fit: [118, 38] });
    } else {
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11).text("Pro Stack", W - 130, H - 46);
      doc.fillColor(GOLD2).font("Helvetica").fontSize(8).text("Academy", W - 130, H - 32);
    }

    doc.fillColor(WHITE).font("Helvetica").fontSize(9)
       .text(`Issued: ${data.completionDate}`, 18, H - 38, { width: 180 });

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

    doc.rect(0, 0, 595, 80).fill(DARK);
    doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text(academyName, 50, 25);
    doc.fontSize(9).font("Helvetica").fillColor("#FFFFFF80")
       .text(`${academyPhone}  |  ${academyEmail}`, 50, 55);

    doc.rect(0, 80, 595, 4).fill(ORANGE);

    doc.moveDown(2);
    doc.fillColor(DARK).fontSize(18).font("Helvetica-Bold").text("PAYMENT RECEIPT", 50, 110);
    doc.fontSize(10).font("Helvetica").fillColor(GRAY)
       .text(`Invoice No: ${data.invoiceNo}`, 50, 135)
       .text(`Date: ${data.paymentDate}`, 50, 150);

    doc.moveTo(50, 175).lineTo(545, 175).strokeColor("#E5E7EB").stroke();

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

    doc.rect(50, y, 495, 70).fill(ORANGE);
    doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica").text("AMOUNT PAID", 80, y + 12);
    doc.fontSize(28).font("Helvetica-Bold").text(`Rs. ${data.amount.toLocaleString("en-IN")}`, 80, y + 28);

    const totalFee      = data.student.totalFee      ?? 0;
    const totalPaid     = data.student.totalPaid     ?? 0;
    const pendingAmount = data.student.pendingAmount ?? 0;

    doc.fontSize(10).font("Helvetica").fillColor("#FFFFFF")
       .text(`Total Fee: Rs.${totalFee.toLocaleString("en-IN")}`, 360, y + 14)
       .text(`Total Paid: Rs.${totalPaid.toLocaleString("en-IN")}`, 360, y + 30)
       .text(`Balance Due: Rs.${pendingAmount.toLocaleString("en-IN")}`, 360, y + 46);

    y += 90;

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
