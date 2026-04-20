/**
 * Seed script — seeds students and enquiries from the JSON data files.
 * Run once: npm run seed:data
 */
import "dotenv/config";
import connectDB from "../config/db";
import { Student } from "../models/Student";
import { Enquiry } from "../models/Enquiry";
import mongoose from "mongoose";

const studentsData = [
  { admissionNo: "ADM2025-001", admissionMonth: "2025-01", name: "Rahul Sharma", mobile: "9876543210", email: "rahul.sharma@gmail.com", gender: "Male", city: "Hyderabad", course: "Full Stack Development", courseTakenDate: "2025-01-10", passoutYear: 2024, stream: "Computer Science", totalFee: 85000, totalPaid: 50000, pendingAmount: 35000, dueDate: "2025-03-15", paymentMode: "UPI", receiptNo: "REC-001", photo: null },
  { admissionNo: "ADM2025-002", admissionMonth: "2025-01", name: "Sneha Reddy", mobile: "9123456789", email: "sneha.reddy@gmail.com", gender: "Female", city: "Bangalore", course: "React JS", courseTakenDate: "2025-01-18", passoutYear: 2023, stream: "Information Technology", totalFee: 45000, totalPaid: 45000, pendingAmount: 0, dueDate: "", paymentMode: "Cash", receiptNo: "REC-002", photo: null },
  { admissionNo: "ADM2025-003", admissionMonth: "2025-02", name: "Amit Kumar", mobile: "9988776655", email: "amit.kumar@gmail.com", gender: "Male", city: "Pune", course: "Node JS", courseTakenDate: "2025-02-05", passoutYear: 2022, stream: "Electronics", totalFee: 40000, totalPaid: 20000, pendingAmount: 20000, dueDate: "2025-04-01", paymentMode: "Bank Transfer", receiptNo: "REC-003", photo: null },
  { admissionNo: "ADM2025-004", admissionMonth: "2025-02", name: "Neha Verma", mobile: "9012345678", email: "neha.verma@gmail.com", gender: "Female", city: "Delhi", course: "UI/UX Design", courseTakenDate: "2025-02-12", passoutYear: 2021, stream: "Design", totalFee: 60000, totalPaid: 30000, pendingAmount: 30000, dueDate: "2025-04-20", paymentMode: "UPI", receiptNo: "REC-004", photo: null },
  { admissionNo: "ADM2025-005", admissionMonth: "2025-03", name: "Karthik Rao", mobile: "9345678123", email: "karthik.rao@gmail.com", gender: "Male", city: "Chennai", course: "Python + Django", courseTakenDate: "2025-03-02", passoutYear: 2024, stream: "Mechanical", totalFee: 70000, totalPaid: 40000, pendingAmount: 30000, dueDate: "2025-05-10", paymentMode: "Card", receiptNo: "REC-005", photo: null },
];

const enquiriesData = [
  { enquiryNo: "ENQ2025-001", enquiryMonth: "2025-01", enquiryDate: "2025-01-03", name: "Priya Nair", mobile: "9876501234", email: "priya.nair@gmail.com", gender: "Female", city: "Hyderabad", course: "Full Stack Development", source: "Walk-in", status: "Converted", notes: "Interested in weekend batches." },
  { enquiryNo: "ENQ2025-002", enquiryMonth: "2025-01", enquiryDate: "2025-01-07", name: "Arun Mehta", mobile: "9812345678", email: "arun.mehta@gmail.com", gender: "Male", city: "Pune", course: "React JS", source: "Online", status: "Follow-up", notes: "Asked for fee structure." },
  { enquiryNo: "ENQ2025-003", enquiryMonth: "2025-01", enquiryDate: "2025-01-12", name: "Divya Rao", mobile: "9900011122", email: "divya.rao@gmail.com", gender: "Female", city: "Bangalore", course: "Python", source: "Referral", status: "Pending", notes: "Will decide after a week." },
  { enquiryNo: "ENQ2025-004", enquiryMonth: "2025-01", enquiryDate: "2025-01-15", name: "Kiran Sharma", mobile: "9988110033", email: "kiran.sharma@gmail.com", gender: "Male", city: "Mumbai", course: "Data Science", source: "Phone", status: "Not Interested", notes: "Looking for offline classes only." },
  { enquiryNo: "ENQ2025-005", enquiryMonth: "2025-01", enquiryDate: "2025-01-20", name: "Sonia Gupta", mobile: "9871133456", email: "sonia.gupta@gmail.com", gender: "Female", city: "Delhi", course: "Node JS", source: "Social Media", status: "Converted", notes: "Joined Jan batch." },
  { enquiryNo: "ENQ2025-006", enquiryMonth: "2025-02", enquiryDate: "2025-02-02", name: "Ravi Teja", mobile: "9900023456", email: "ravi.teja@gmail.com", gender: "Male", city: "Hyderabad", course: "Full Stack Development", source: "Walk-in", status: "Follow-up", notes: "Wants EMI option." },
  { enquiryNo: "ENQ2025-007", enquiryMonth: "2025-02", enquiryDate: "2025-02-08", name: "Ananya Singh", mobile: "9822334455", email: "ananya.singh@gmail.com", gender: "Female", city: "Chennai", course: "UI/UX Design", source: "Referral", status: "Pending", notes: "Needs placement guarantee details." },
  { enquiryNo: "ENQ2025-008", enquiryMonth: "2025-02", enquiryDate: "2025-02-14", name: "Suresh Babu", mobile: "9911223344", email: "suresh.babu@gmail.com", gender: "Male", city: "Vizag", course: "Java", source: "Online", status: "Converted", notes: "Enrolled in Feb batch." },
  { enquiryNo: "ENQ2025-009", enquiryMonth: "2025-02", enquiryDate: "2025-02-19", name: "Meera Pillai", mobile: "9844556677", email: "meera.pillai@gmail.com", gender: "Female", city: "Kochi", course: "Python", source: "Phone", status: "Not Interested", notes: "Already enrolled elsewhere." },
  { enquiryNo: "ENQ2025-010", enquiryMonth: "2025-03", enquiryDate: "2025-03-03", name: "Vishal Reddy", mobile: "9966778899", email: "vishal.reddy@gmail.com", gender: "Male", city: "Hyderabad", course: "React JS", source: "Social Media", status: "Follow-up", notes: "Callback requested for Friday." },
  { enquiryNo: "ENQ2025-011", enquiryMonth: "2025-03", enquiryDate: "2025-03-10", name: "Lakshmi Devi", mobile: "9833445566", email: "lakshmi.devi@gmail.com", gender: "Female", city: "Tirupati", course: "Data Science", source: "Referral", status: "Pending", notes: "Parent approval pending." },
  { enquiryNo: "ENQ2025-012", enquiryMonth: "2025-03", enquiryDate: "2025-03-17", name: "Nikhil Joshi", mobile: "9755667788", email: "nikhil.joshi@gmail.com", gender: "Male", city: "Nagpur", course: "Node JS", source: "Walk-in", status: "Converted", notes: "Joined March batch." },
];

const seed = async () => {
  await connectDB();

  // Seed Students
  const studentCount = await Student.countDocuments();
  if (studentCount === 0) {
    await Student.insertMany(studentsData);
    console.log(`Seeded ${studentsData.length} students.`);
  } else {
    console.log(`Students already seeded (${studentCount} records). Skipping.`);
  }

  // Seed Enquiries
  const enquiryCount = await Enquiry.countDocuments();
  if (enquiryCount === 0) {
    await Enquiry.insertMany(enquiriesData);
    console.log(`Seeded ${enquiriesData.length} enquiries.`);
  } else {
    console.log(`Enquiries already seeded (${enquiryCount} records). Skipping.`);
  }

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});