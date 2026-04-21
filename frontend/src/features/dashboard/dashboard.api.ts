import { OverviewData } from "./dashboard.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("prostack_token") ?? "";
}

// Use local date to avoid UTC-offset shifting (IST and other non-UTC timezones)
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function fetchOverview(start: Date, end: Date): Promise<OverviewData> {
  const params = new URLSearchParams({
    start: toISO(start),
    end: toISO(end),
  });
  const res = await fetch(`${API_BASE}/api/dashboard/overview?${params}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard overview");
  return res.json() as Promise<OverviewData>;
}

export interface BatchCategories {
  freshers: number;
  recent:   number;
  senior:   number;
  currentYear: number;
}

export interface PendingStudent {
  _id: string;
  name: string;
  admissionNo: string;
  mobile: string;
  course: string;
  totalFee: number;
  totalPaid: number;
  pendingAmount: number;
  studentStatus?: "Active" | "Inactive";
  isRecoverable?: boolean;
  dueDate?: string;
  joinedDate?: string;
}

export async function fetchPendingStudents(start: Date, end: Date): Promise<PendingStudent[]> {
  const params = new URLSearchParams({ start: toISO(start), end: toISO(end) });
  const res = await fetch(`${API_BASE}/api/dashboard/pending-students?${params}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch pending students");
  const data = await res.json();
  return data.students as PendingStudent[];
}

export async function fetchBatchCategories(): Promise<BatchCategories> {
  const res = await fetch(`${API_BASE}/api/dashboard/batch-categories`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch batch categories");
  return res.json() as Promise<BatchCategories>;
}
