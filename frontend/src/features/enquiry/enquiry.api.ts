import { Enquiry } from "./enquiry.types";

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

export async function fetchNextEnquiryNumber(): Promise<{ enquiryNo: string }> {
  const res = await fetch(`${API_BASE}/api/enquiries/next-number`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch next enquiry number");
  return res.json() as Promise<{ enquiryNo: string }>;
}

export async function fetchEnquiries(): Promise<Enquiry[]> {
  const res = await fetch(`${API_BASE}/api/enquiries`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch enquiries");
  const data = await res.json() as { enquiries: Enquiry[] };
  return data.enquiries;
}

export async function createEnquiry(payload: Omit<Enquiry, "_id">): Promise<Enquiry> {
  const res = await fetch(`${API_BASE}/api/enquiries`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json() as { enquiry?: Enquiry; message?: string };
  if (!res.ok) throw new Error(data.message ?? "Failed to create enquiry");
  return data.enquiry!;
}

export async function updateEnquiry(id: string, payload: Partial<Enquiry>): Promise<Enquiry> {
  const res = await fetch(`${API_BASE}/api/enquiries/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json() as { enquiry?: Enquiry; message?: string };
  if (!res.ok) throw new Error(data.message ?? "Failed to update enquiry");
  return data.enquiry!;
}

export async function deleteEnquiry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/enquiries/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json() as { message?: string };
    throw new Error(data.message ?? "Failed to delete enquiry");
  }
}