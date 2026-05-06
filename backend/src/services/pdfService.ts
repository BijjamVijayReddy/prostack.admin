import PDFDocument from "pdfkit";
import { IStudent } from "../models/Student";

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
