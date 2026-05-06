import type {
  WAConnectionState,
  StudentOption,
  LogsResponse,
  Analytics,
} from "./whatapp.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("prostack_token") ?? ""
      : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function fetchStatus(): Promise<WAConnectionState> {
  const res = await fetch(`${API_BASE}/api/whatsapp/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch WhatsApp status");
  return res.json();
}

export async function postDisconnect(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/whatsapp/disconnect`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Disconnect failed");
}

export async function postReconnect(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/whatsapp/reconnect`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Reconnect failed");
}

export async function sendTextMessage(payload: {
  phone: string;
  studentName: string;
  studentId?: string;
  messageType?: string;
  message: string;
}): Promise<{ logId: string; waMessageId: string }> {
  const res = await fetch(`${API_BASE}/api/whatsapp/send`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err === "object" && err !== null && "message" in err ? String((err as Record<string, unknown>).message) : "Failed to send message");
  }
  return res.json();
}

export async function sendBulkMessage(payload: {
  recipients: { phone: string; studentName: string; studentId?: string }[];
  message: string;
  messageType?: string;
}): Promise<{ results: { phone: string; status: string }[] }> {
  const res = await fetch(`${API_BASE}/api/whatsapp/send-bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Bulk send failed");
  return res.json();
}

export async function sendReceipt(
  studentId: string,
  payload: {
    amount: number;
    paymentMethod: string;
    invoiceNo: string;
    paymentDate: string;
  }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/whatsapp/send-receipt/${studentId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to send receipt");
}

export async function sendFile(formData: FormData): Promise<void> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("prostack_token") ?? ""
      : "";
  const res = await fetch(`${API_BASE}/api/whatsapp/send-file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to send file");
}

export async function fetchLogs(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}): Promise<LogsResponse> {
  const q = new URLSearchParams();
  if (params.page)   q.set("page",   String(params.page));
  if (params.limit)  q.set("limit",  String(params.limit));
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.type   && params.type   !== "all") q.set("type",   params.type);
  if (params.search) q.set("search", params.search);

  const res = await fetch(`${API_BASE}/api/whatsapp/logs?${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function fetchAnalytics(): Promise<Analytics> {
  const res = await fetch(`${API_BASE}/api/whatsapp/analytics`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function fetchStudents(search?: string): Promise<StudentOption[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE}/api/whatsapp/students${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json();
  return data.students;
}
