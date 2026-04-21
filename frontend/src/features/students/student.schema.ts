import * as yup from "yup";

export const studentSchema = yup.object({
  admissionNo: yup.string().required("Admission number is required"),
  name: yup.string().min(3).required("Full name is required"),

  admissionMonth: yup.string().required("Admission month is required"),
  courseTakenDate: yup.string().optional(),
  joinedDate: yup.string().required("Joined date is required"),

  placementStatus: yup.string().oneOf(["Not Placed", "Placed"]).optional(),
  studentStatus: yup.string().oneOf(["Active", "Inactive"]).optional(),

  mobile: yup
    .string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit mobile number")
    .required("Mobile number is required"),

  email: yup.string().email("Invalid email").required("Email is required"),

  gender: yup.string().required("Gender is required"),
  city: yup.string().required("City is required"),
  course: yup.string().required("Course is required"),
  stream: yup.string().required("Stream is required"),

  passoutYear: yup
    .number()
    .typeError("Passout year must be a number")
    .required("Passout year is required"),

  totalFee: yup.number().min(0).required("Total fee is required"),
  totalPaid: yup.number().min(0).required("Total paid is required"),
  pendingAmount: yup.number().min(0).required("Pending amount is required"),

  dueDate: yup.string().nullable(),
  paymentMode: yup.string().required("Payment mode is required"),
  receiptNo: yup.string().optional(),

  photo: yup.string().nullable(),
});