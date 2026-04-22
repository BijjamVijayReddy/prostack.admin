import mongoose, { Document, Schema } from "mongoose";

export interface IOtpRecord extends Document {
  mobile?: string;
  email?: string;
  otpHash?: string;
  purpose: "signup" | "login";
  expiresAt: Date;
  pendingUserData?: Record<string, unknown>;
}

const OtpRecordSchema = new Schema<IOtpRecord>(
  {
    mobile: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    otpHash: {
      type: String,
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
    // Only used for signup — holds unverified registration data
    pendingUserData: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB auto-removes expired records
OtpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Partial indexes: only index documents where the field actually exists.
// This avoids the duplicate-null bug when multiple email-only or mobile-only records share the same purpose.
OtpRecordSchema.index(
  { mobile: 1, purpose: 1 },
  { partialFilterExpression: { mobile: { $type: "string" } } }
);
OtpRecordSchema.index(
  { email: 1, purpose: 1 },
  { partialFilterExpression: { email: { $type: "string" } } }
);

export default mongoose.model<IOtpRecord>("OtpRecord", OtpRecordSchema);
