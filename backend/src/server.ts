import "dotenv/config";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import connectDB from "./config/db";
import OtpRecord from "./models/OtpRecord";
import { whatsappService } from "./services/whatappService";

// ── Catch any crash that escapes async try/catch ──────────────────
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
  process.exit(1);
});

// ── Validate required env vars before anything else ──────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"] as const;
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

// ── Startup info (no secrets) ────────────────────────────────────
console.log(`[INFO] NODE_ENV  : ${process.env.NODE_ENV ?? "development"}`);
console.log(`[INFO] PORT      : ${process.env.PORT ?? 5000}`);
console.log(`[INFO] MONGO_URI : ${process.env.MONGO_URI!.replace(/:([^@]+)@/, ":***@")}`);

const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  await connectDB();

  // Drop any stale indexes (e.g. old unique mobile_1_purpose_1 without partialFilterExpression)
  // and recreate from the current model definition.
  try {
    await OtpRecord.syncIndexes();
    console.log("[INFO] OtpRecord indexes synced");
  } catch (err) {
    console.warn("[WARN] OtpRecord.syncIndexes() failed (non-fatal):", err);
  }

  // ── HTTP server + Socket.IO ──────────────────────────────────
  const httpServer = createServer(app);

  const allowedOrigins: (string | RegExp)[] = [
    "http://localhost:3000",
    "https://prostack-admin.com",
    "https://www.prostack-admin.com",
    /\.vercel\.app$/,
  ];
  if (process.env.FRONTEND_ORIGIN) {
    process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean).forEach((o) => {
      allowedOrigins.push(o);
    });
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  whatsappService.setIO(io);

  io.on("connection", (socket) => {
    // Send current state to newly connected client
    socket.emit("wa:status", whatsappService.getPublicState());
  });

  // Start WhatsApp client
  whatsappService.initialize().catch((err) =>
    console.error("[WA] Initialization error:", err)
  );

  httpServer.listen(PORT, () => {
    console.log(`[INFO] Server running on port ${PORT}`);
  });
};

start().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error("[FATAL] Failed to start server:", err.message);
    // Print the full stack so Render logs show exactly where it failed
    if (err.stack) console.error(err.stack);
  } else {
    console.error("[FATAL] Failed to start server:", err);
  }
  process.exit(1);
});
