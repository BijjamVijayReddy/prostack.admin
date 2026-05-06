import { Router } from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware";
import {
  getStatus,
  disconnect,
  reconnect,
  sendMessage,
  sendBulkMessage,
  sendReceipt,
  sendFile,
  getLogs,
  getAnalytics,
  getStudentsForMessaging,
} from "../controllers/whatapp.controller";

const router = Router();

// Max 16 MB file upload (WhatsApp limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// All routes require auth
router.use(protect);

router.get  ("/status",             getStatus);
router.post ("/disconnect",         disconnect);
router.post ("/reconnect",          reconnect);
router.post ("/send",               sendMessage);
router.post ("/send-bulk",          sendBulkMessage);
router.post ("/send-receipt/:studentId", sendReceipt);
router.post ("/send-file",          upload.single("file"), sendFile);
router.get  ("/logs",               getLogs);
router.get  ("/analytics",          getAnalytics);
router.get  ("/students",           getStudentsForMessaging);

export default router;
