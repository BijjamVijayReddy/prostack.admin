export interface Student {
  _id?: string;
  admissionNo: string;
  name: string;
  admissionMonth: string;
  courseTakenDate?: string;
  joinedDate: string;

  placementStatus?: "Not Placed" | "Placed";

  mobile: string;
  email: string;
  gender: string;
  city: string;
  course: string;
  stream: string;
  passoutYear: number;

  totalFee: number;
  totalPaid: number;
  pendingAmount: number;
  dueDate?: string;
  paymentMode: string;
  receiptNo?: string;

  photo?: string | null;
  updatedAt?: string;
  studentStatus?: "Active" | "Inactive";
  isRecoverable?: boolean;
}