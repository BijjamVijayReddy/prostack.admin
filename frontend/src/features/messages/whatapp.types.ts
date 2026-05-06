export type WAStatus = "disconnected" | "connecting" | "qr_ready" | "connected";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "read" | "failed";
export type MessageType =
  | "text" | "receipt" | "reminder" | "attendance"
  | "pdf"  | "image"   | "doc"      | "bulk";

export interface WAConnectionState {
  status: WAStatus;
  qrDataUrl: string | null;
  qrRefreshIn: number | null;
  phoneNumber: string | null;
  connectedSince: string | null;
}

export interface StudentOption {
  _id: string;
  name: string;
  mobile: string;
  course: string;
  stream?: string;
  admissionNo: string;
  totalFee: number;
  totalPaid: number;
  pendingAmount: number;
}

export interface MessageLog {
  _id: string;
  studentName: string;
  phone: string;
  messageType: MessageType;
  message?: string;
  mediaName?: string;
  mediaSize?: number;
  deliveryStatus: DeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  sentByName?: string;
  error?: string;
}

export interface LogsResponse {
  logs: MessageLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Analytics {
  todayTotal: number;
  delivered: number;
  read: number;
  failed: number;
  totalAll: number;
  deliveryRate: number;
  readRate: number;
}
