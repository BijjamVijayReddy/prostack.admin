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
