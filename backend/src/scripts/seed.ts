/**
 * Seed script — creates the default admin user.
 * Run once: npm run seed
 */
import "dotenv/config";
import connectDB from "../config/db";
import User from "../models/User";
import mongoose from "mongoose";

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ username: "admin@2026" });

  if (existing) {
    console.log("Admin user already exists. Skipping seed.");
  } else {
    await User.create({
      firstName: "Pro",
      lastName: "Admin",
      email: "admin@prostack.com",
      mobileNumber: "9999999999",
      username: "admin@2026",
      password: "Password@123",
      role: "admin",
    });
    console.log("Admin user created successfully.");
    console.log("  username: admin@2026");
    console.log("  password: Password@123");
  }

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});