import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  const docs = await mongoose.connection.collection("placements").find({}).toArray();
  docs.forEach((d: any) => {
    console.log(`${d.firstName} ${d.secondName} | jobOfferDate: "${d.jobOfferDate}"`);
  });
  await mongoose.disconnect();
}

main();
