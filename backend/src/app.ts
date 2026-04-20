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
  "http://localhost:3000", // local dev
  /\.vercel\.app$/,        // Vercel preview deployments
];
if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.push(process.env.FRONTEND_ORIGIN); // e.g. https://prostack-xyz.vercel.app
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

// Routes
app.use("/api/auth/login", loginLimiter);
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