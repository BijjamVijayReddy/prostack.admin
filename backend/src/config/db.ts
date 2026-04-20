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
    console.error("[FATAL] MONGO_URI is not defined.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
    });
    console.log(`[INFO] MongoDB connected: ${conn.connection.host}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[FATAL] MongoDB connection failed: ${message}`);
    process.exit(1);
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
