import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/prostack";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const result = await mongoose.connection
    .collection("placements")
    .updateMany(
      { jobOfferDate: { $exists: false } },
      { $set: { jobOfferDate: "" } }
    );

  console.log(`Migration complete: ${result.modifiedCount} record(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
