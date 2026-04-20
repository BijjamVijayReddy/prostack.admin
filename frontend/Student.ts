import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  admissionNo: string;
  admissionMonth: string;
  name: string;
  mobile: string;
  email: string;
  gender: string;
  city: string;
  course: string;
  courseTakenDate?: string;
  joinedDate: string;
  placementStatus: string;
  passoutYear: number;
  stream: string;
  totalFee: number;
  totalPaid: number;
  pendingAmount: number;
  dueDate?: string;
  paymentMode: string;
  receiptNo?: string;
  photo?: string | null;
}

const StudentSchema = new Schema<IStudent>(
  {
    admissionNo: { type: String, required: true, unique: true, trim: true },
    admissionMonth: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    gender: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    courseTakenDate: { type: String, default: "" },
    joinedDate: { type: String, required: true },
    placementStatus: { type: String, default: "Not Placed" },
    passoutYear: { type: Number, required: true },
    stream: { type: String, required: true, trim: true },
    totalFee: { type: Number, required: true, default: 0 },
    totalPaid: { type: Number, required: true, default: 0 },
    pendingAmount: { type: Number, required: true, default: 0 },
    dueDate: { type: String, default: "" },
    paymentMode: { type: String, required: true },
    receiptNo: { type: String, default: "" },
    photo: { type: String, default: null },
  },
  { timestamps: true }
);

export const Student = mongoose.model<IStudent>("Student", StudentSchema);
