import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber: string;
  username?: string;
  password?: string;
  role: string;
  isVerified: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  approvalToken?: string;
  lastLoginAt?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple null values
      trim: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple null values
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin", "staff"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvalToken: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hashed
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
