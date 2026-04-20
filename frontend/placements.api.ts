import { Placement } from "./placement.types";

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

export async function fetchPlacements(): Promise<Placement[]> {
  const res = await fetch(`${API_BASE}/api/placements`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch placements");
  const data = await res.json() as { placements: Placement[] };
  return data.placements;
}

export async function createPlacement(payload: Omit<Placement, "_id" | "createdAt" | "updatedAt">): Promise<Placement> {
  const res = await fetch(`${API_BASE}/api/placements`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json() as { placement?: Placement; message?: string };
  if (!res.ok) throw new Error(data.message ?? "Failed to create placement");
  return data.placement!;
}

export async function updatePlacement(id: string, payload: Partial<Placement>): Promise<Placement> {
  const res = await fetch(`${API_BASE}/api/placements/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json() as { placement?: Placement; message?: string };
  if (!res.ok) throw new Error(data.message ?? "Failed to update placement");
  return data.placement!;
}
