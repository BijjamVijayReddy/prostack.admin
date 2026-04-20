export interface Placement {
  _id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}
