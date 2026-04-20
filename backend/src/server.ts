import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";

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
  app.listen(PORT, () => {
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
