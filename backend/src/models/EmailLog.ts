import mongoose, { Document, Schema } from "mongoose";

export type EmailType = "otp" | "receipt";

export interface IEmailLog extends Document {
  type: EmailType;
  recipient: string;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  type:      { type: String, enum: ["otp", "receipt"], required: true },
  recipient: { type: String, required: true, trim: true },
  sentAt:    { type: Date, required: true, default: () => new Date() },
}, { timestamps: false });

EmailLogSchema.index({ sentAt: 1 });

export const EmailLog = mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);