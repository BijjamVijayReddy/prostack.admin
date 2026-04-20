import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Global error-handling middleware.
 * Must be registered LAST in app.ts (after all routes).
 * Express identifies it as an error handler by its 4-argument signature.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  if (statusCode === 500) {
    console.error("❌ Unhandled error:", err);
  }

  res.status(statusCode).json({ message });
}
