import mongoose from "mongoose";

// Emit a warning for deprecated filter behaviour — must be set before connect()
mongoose.set("strictQuery", true);

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌  MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Recommended for Atlas free-tier / production
      serverSelectionTimeoutMS: 10_000, // fail fast if cluster unreachable
      socketTimeoutMS: 45_000,          // close idle sockets after 45 s
      maxPoolSize: 10,                  // keep up to 10 connections in pool
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌  MongoDB connection failed: ${message}`);
    process.exit(1);
  }
};

// Gracefully close connection on app shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌  MongoDB connection closed (SIGINT).");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("🔌  MongoDB connection closed (SIGTERM).");
  process.exit(0);
});

export default connectDB;
