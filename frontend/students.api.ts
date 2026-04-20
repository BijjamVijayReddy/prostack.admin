import { Student } from "./students.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("prostack_token") ?? "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchNextAdmissionNumber(): Promise<{ admissionNo: string; receiptNo: string }> {
  const res = await fetch(`${API_BASE}/api/students/next-number`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch next number");
  return res.json() as Promise<{ admissionNo: string; receiptNo: string }>;
}

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch(`${API_BASE}/api/students`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json() as { students: Student[] };
  return data.students;
}

export async function createStudent(payload: Omit<Student, "_id">): Promise<Student> {
  const res = await fetch(`${API_BASE}/api/students`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json() as { student?: Student; message?: string };
  if (!res.ok) throw new Error(data.message ?? "Failed to create student");
  return data.student!;
}

export async function updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
  const res = await fetch(`${API_BASE}/api/students/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json() as { student?: Student; message?: string };
  if (!res.ok) throw new Error(data.message ?? "Failed to update student");
  return data.student!;
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/students/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json() as { message?: string };
    throw new Error(data.message ?? "Failed to delete student");
  }
}
