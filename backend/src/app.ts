import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import enquiryRoutes from "./routes/enquiry.routes";
import placementRoutes from "./routes/placement.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// CORS must come BEFORE body parser so error responses (413 etc.) also include CORS headers
// Always allow localhost for local dev (even when hitting the production Render backend).
// In production also allow: the explicit FRONTEND_ORIGIN env var + all *.vercel.app previews.
const allowedOrigins: (string | RegExp)[] = [
  "http://localhost:3000",       // local dev
  "https://prostack-admin.com",  // production domain
  "https://www.prostack-admin.com",
  /\.vercel\.app$/,              // Vercel preview deployments
];
// Support additional comma-separated origins via env var
if (process.env.FRONTEND_ORIGIN) {
  process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean).forEach((o) => {
    allowedOrigins.push(o);
  });
}

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsOptions));
// Respond to all preflight OPTIONS requests
app.options("*", cors(corsOptions));

// Body parser — 5 MB to allow base64 photo uploads (must be after CORS)
app.use(express.json({ limit: "5mb" }));

// Rate limiter — only on login, only in production
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV !== "production",
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP endpoints: stricter limit (5 per 10 min) to prevent abuse
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV !== "production",
  message: { message: "Too many OTP requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth/login",            loginLimiter);
app.use("/api/auth/login/verify-otp", otpLimiter);
app.use("/api/auth/signup/send-otp",  otpLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/placements", placementRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;