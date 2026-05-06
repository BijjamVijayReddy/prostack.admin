import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Student } from "../models/Student";
import WhatsAppLog from "../models/WhatsAppLog";
import { whatsappService } from "../services/whatappService";
import { generateReceipt } from "../services/pdfService";
import mongoose from "mongoose";

// ── GET /api/whatsapp/status ─────────────────────────────────────
export const getStatus = (req: AuthRequest, res: Response): void => {
  res.json(whatsappService.getPublicState());
};

// ── POST /api/whatsapp/disconnect ────────────────────────────────
export const disconnect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await whatsappService.disconnect();
    res.json({ message: "Disconnected successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to disconnect", error: String(err) });
  }
};

// ── POST /api/whatsapp/reconnect ─────────────────────────────────
export const reconnect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await whatsappService.initialize();
    res.json({ message: "Reconnecting..." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reconnect", error: String(err) });
  }
};

// ── POST /api/whatsapp/send ──────────────────────────────────────
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { phone, studentName, studentId, messageType = "text", message } = req.body as {
    phone: string;
    studentName: string;
    studentId?: string;
    messageType?: string;
    message: string;
  };

  if (!phone || !message) {
    res.status(400).json({ message: "phone and message are required" });
    return;
  }

  const log = await WhatsAppLog.create({
    studentId: studentId ? new mongoose.Types.ObjectId(studentId) : null,
    studentName: studentName || phone,
    phone,
    messageType,
    message,
    deliveryStatus: "pending",
    sentById: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
    sentByName: req.body.sentByName ?? "",
  });

  try {
    const waId = await whatsappService.sendText(phone, message);
    log.deliveryStatus = "sent";
    log.waMessageId = waId;
    await log.save();
    res.json({ message: "Message sent", logId: log._id, waMessageId: waId });
  } catch (err) {
    log.deliveryStatus = "failed";
    log.error = String(err);
    await log.save();
    res.status(500).json({ message: "Failed to send message", error: String(err) });
  }
};

// ── POST /api/whatsapp/send-bulk ─────────────────────────────────
export const sendBulkMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { recipients, message, messageType = "bulk" } = req.body as {
    recipients: { phone: string; studentName: string; studentId?: string }[];
    message: string;
    messageType?: string;
  };

  if (!recipients?.length || !message) {
    res.status(400).json({ message: "recipients and message are required" });
    return;
  }

  const results: { phone: string; status: string; error?: string }[] = [];

  for (const r of recipients) {
    const log = await WhatsAppLog.create({
      studentId: r.studentId ? new mongoose.Types.ObjectId(r.studentId) : null,
      studentName: r.studentName || r.phone,
      phone: r.phone,
      messageType,
      message,
      deliveryStatus: "pending",
      sentById: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
    });
    try {
      const waId = await whatsappService.sendText(r.phone, message);
      log.deliveryStatus = "sent";
      log.waMessageId = waId;
      await log.save();
      results.push({ phone: r.phone, status: "sent" });
    } catch (err) {
      log.deliveryStatus = "failed";
      log.error = String(err);
      await log.save();
      results.push({ phone: r.phone, status: "failed", error: String(err) });
    }
    // Small delay between messages to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  res.json({ results });
};

// ── POST /api/whatsapp/send-receipt/:studentId ───────────────────
export const sendReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const { amount, paymentMethod, invoiceNo, paymentDate } = req.body as {
    amount: number;
    paymentMethod: string;
    invoiceNo: string;
    paymentDate: string;
  };

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404).json({ message: "Student not found" });
    return;
  }

  const log = await WhatsAppLog.create({
    studentId: student._id,
    studentName: student.name,
    phone: student.mobile,
    messageType: "receipt",
    message: `Payment receipt for ₹${amount}`,
    deliveryStatus: "pending",
    sentById: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
  });

  try {
    const pdfBuffer = await generateReceipt({
      student,
      amount,
      paymentMethod,
      invoiceNo,
      paymentDate,
    });

    const caption = `Hi ${student.name}! 🎓\nYour payment receipt for *₹${amount.toLocaleString("en-IN")}* has been generated.\nInvoice: ${invoiceNo}\n\n_Pro Stack Academy_`;
    const waId = await whatsappService.sendMedia(
      student.mobile,
      pdfBuffer,
      "application/pdf",
      `Receipt_${invoiceNo}.pdf`,
      caption
    );

    log.deliveryStatus = "sent";
    log.waMessageId = waId;
    log.mediaName = `Receipt_${invoiceNo}.pdf`;
    log.mediaSize = pdfBuffer.length;
    await log.save();

    res.json({ message: "Receipt sent", logId: log._id });
  } catch (err) {
    log.deliveryStatus = "failed";
    log.error = String(err);
    await log.save();
    res.status(500).json({ message: "Failed to send receipt", error: String(err) });
  }
};

// ── POST /api/whatsapp/send-file ─────────────────────────────────
// Used when admin uploads a file from frontend (via multer)
export const sendFile = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = (req as any).file as Express.Multer.File | undefined;
  const { phone, studentName, studentId, caption } = req.body as {
    phone: string;
    studentName?: string;
    studentId?: string;
    caption?: string;
  };

  if (!file || !phone) {
    res.status(400).json({ message: "file and phone are required" });
    return;
  }

  const log = await WhatsAppLog.create({
    studentId: studentId ? new mongoose.Types.ObjectId(studentId) : null,
    studentName: studentName || phone,
    phone,
    messageType: file.mimetype.includes("pdf") ? "pdf" : file.mimetype.startsWith("image") ? "image" : "doc",
    message: caption || "",
    mediaName: file.originalname,
    mediaSize: file.size,
    deliveryStatus: "pending",
    sentById: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
  });

  try {
    const waId = await whatsappService.sendMedia(
      phone,
      file.buffer,
      file.mimetype,
      file.originalname,
      caption
    );
    log.deliveryStatus = "sent";
    log.waMessageId = waId;
    await log.save();
    res.json({ message: "File sent", logId: log._id });
  } catch (err) {
    log.deliveryStatus = "failed";
    log.error = String(err);
    await log.save();
    res.status(500).json({ message: "Failed to send file", error: String(err) });
  }
};

// ── GET /api/whatsapp/logs ───────────────────────────────────────
export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.deliveryStatus = req.query.status;
  if (req.query.type)   filter.messageType    = req.query.type;
  if (req.query.search) {
    const re = new RegExp(String(req.query.search), "i");
    filter.$or = [{ studentName: re }, { phone: re }];
  }

  const [logs, total] = await Promise.all([
    WhatsAppLog.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
    WhatsAppLog.countDocuments(filter),
  ]);

  res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
};

// ── GET /api/whatsapp/analytics ──────────────────────────────────
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayTotal, delivered, read, failed, totalAll] = await Promise.all([
    WhatsAppLog.countDocuments({ sentAt: { $gte: startOfDay } }),
    WhatsAppLog.countDocuments({ deliveryStatus: "delivered" }),
    WhatsAppLog.countDocuments({ deliveryStatus: "read" }),
    WhatsAppLog.countDocuments({ deliveryStatus: "failed" }),
    WhatsAppLog.countDocuments(),
  ]);

  const deliveryRate = totalAll > 0 ? Math.round(((delivered + read) / totalAll) * 100) : 0;
  const readRate     = totalAll > 0 ? Math.round((read / totalAll) * 100) : 0;

  res.json({ todayTotal, delivered, read, failed, totalAll, deliveryRate, readRate });
};

// ── GET /api/whatsapp/students ───────────────────────────────────
export const getStudentsForMessaging = async (req: AuthRequest, res: Response): Promise<void> => {
  const search = req.query.search ? String(req.query.search) : "";
  const filter: Record<string, unknown> = { studentStatus: "Active" };
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ name: re }, { mobile: re }, { course: re }];
  }
  const students = await Student.find(filter)
    .select("_id name mobile course stream admissionNo totalFee totalPaid pendingAmount")
    .limit(50)
    .lean();
  res.json({ students });
};
