import dns from "dns";
import mongoose from "mongoose";

// On local dev, ISP DNS may block MongoDB SRV lookups — use Google DNS.
// On cloud (Render, Railway, etc.) this is not needed and is skipped.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}

mongoose.set("strictQuery", true);

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  console.log("[INFO] Attempting to connect to MongoDB...");

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15_000,  // 15 s — give Atlas a little more headroom
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
    });
    console.log(`[INFO] MongoDB connected: ${conn.connection.host}`);
  } catch (err: unknown) {
    // Re-throw so server.ts can log the full error and call process.exit once
    throw err;
  }
};

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("[INFO] MongoDB connection closed (SIGINT).");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("[INFO] MongoDB connection closed (SIGTERM).");
  process.exit(0);
});

export default connectDB;
