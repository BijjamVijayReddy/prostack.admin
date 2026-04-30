export interface Enquiry {
  _id?: string;
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
  updatedAt?: string;
}