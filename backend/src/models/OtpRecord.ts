import mongoose, { Document, Schema } from "mongoose";

export interface IOtpRecord extends Document {
  mobile: string;
  purpose: "signup" | "login";
  expiresAt: Date;
  pendingUserData?: Record<string, unknown>;
}

const OtpRecordSchema = new Schema<IOtpRecord>(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
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
// One active record per mobile+purpose pair
OtpRecordSchema.index({ mobile: 1, purpose: 1 }, { unique: true });

export default mongoose.model<IOtpRecord>("OtpRecord", OtpRecordSchema);
