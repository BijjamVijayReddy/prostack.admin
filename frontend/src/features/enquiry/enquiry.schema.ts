import * as yup from "yup";

export const enquirySchema = yup.object({
  enquiryNo: yup.string().required("Enquiry number is required"),
  enquiryDate: yup.string().required("Enquiry date is required"),
  enquiryMonth: yup.string().required("Enquiry month is required"),
  expectedJoinDate: yup.string().optional().default(""),
  name: yup.string().min(3).required("Full name is required"),
  mobile: yup
    .string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit mobile number")
    .required("Mobile number is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  gender: yup.string().required("Gender is required"),
  city: yup.string().required("City is required"),
  course: yup.string().required("Course is required"),
  source: yup.string().required("Source is required"),
  status: yup.string().required("Status is required"),
  notes: yup.string().optional(),
});