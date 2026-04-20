import mongoose, { Document, Schema } from "mongoose";

export interface IPlacement extends Document {
  photo?: string | null;
  firstName: string;
  secondName: string;
  courseTaken: string;
  joinedInstitutionDate: string;
  joinedCompanyDate: string;
  jobOfferDate?: string;
  companyName: string;
  packageLakhs: number;
  reviewGiven: "Given" | "Not Given";
  howGotJob: "Referral" | "Institution" | "LinkedIn" | "Naukari" | "Others";
  documentsRequired: "Yes" | "No";
  bgvRequired: "Yes" | "No";
  consentSocialMedia: boolean;
}

const PlacementSchema = new Schema<IPlacement>(
  {
    photo: { type: String, default: null },
    firstName: { type: String, required: true, trim: true },
    secondName: { type: String, required: true, trim: true },
    courseTaken: { type: String, required: true, trim: true },
    joinedInstitutionDate: { type: String, required: true },
    joinedCompanyDate: { type: String, required: true },
    jobOfferDate: { type: String, default: "" },
    companyName: { type: String, required: true, trim: true },
    packageLakhs: { type: Number, required: true, min: 0 },
    reviewGiven: { type: String, required: true, enum: ["Given", "Not Given"] },
    howGotJob: {
      type: String,
      required: true,
      enum: ["Referral", "Institution", "LinkedIn", "Naukari", "Others"],
    },
    documentsRequired: { type: String, required: true, enum: ["Yes", "No"] },
    bgvRequired: { type: String, required: true, enum: ["Yes", "No"] },
    consentSocialMedia: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const Placement = mongoose.model<IPlacement>("Placement", PlacementSchema);