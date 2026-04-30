import mongoose, { Document, Schema } from "mongoose";

export interface IEnquiry extends Document {
  enquiryNo: string;
  enquiryMonth: string;
  enquiryDate: string;
  expectedJoinDate?: string;
  name: string;
  mobile: string;
  email?: string;
  gender: string;
  city: string;
  course: string;
  source: string;
  status: "Pending" | "Follow-up" | "Converted" | "Not Interested";
  notes?: string;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    enquiryNo: { type: String, required: true, unique: true, trim: true },
    enquiryMonth: { type: String, required: true, trim: true },
    enquiryDate: { type: String, required: true },
    expectedJoinDate: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: false, trim: true ,default: ""},
    gender: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    source: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Follow-up", "Converted", "Not Interested"],
      default: "Pending",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Enquiry = mongoose.model<IEnquiry>("Enquiry", EnquirySchema);