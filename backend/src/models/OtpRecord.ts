import mongoose, { Document, Schema } from "mongoose";

export interface IOtpRecord extends Document {
  email: string;
  otpHash: string;
  purpose: "signup" | "login";
  expiresAt: Date;
  attempts: number;
  pendingUserData?: Record<string, unknown>;
}

const OtpRecordSchema = new Schema<IOtpRecord>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["signup", "login"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    // Only used for signup — holds unverified registration fields
    pendingUserData: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB auto-removes expired OTP documents
OtpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// One active OTP per email+purpose pair
OtpRecordSchema.index({ email: 1, purpose: 1 }, { unique: true });

export default mongoose.model<IOtpRecord>("OtpRecord", OtpRecordSchema);
