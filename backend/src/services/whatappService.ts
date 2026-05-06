import { Server as SocketIOServer } from "socket.io";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode";
import WhatsAppLog from "../models/WhatsAppLog";

export type WAStatus = "disconnected" | "connecting" | "qr_ready" | "connected";

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  qrRefreshAt: number | null;
  phoneNumber: string | null;
  connectedSince: string | null;
}

const QR_REFRESH_SECONDS = 45;

class WhatsAppService {
  private client: Client | null = null;
  private io: SocketIOServer | null = null;
  private state: WAState = {
    status: "disconnected",
    qrDataUrl: null,
    qrRefreshAt: null,
    phoneNumber: null,
    connectedSince: null,
  };

  /** Attach socket.io instance (called once from server.ts) */
  setIO(io: SocketIOServer) {
    this.io = io;
  }

  /** Start or restart the WhatsApp client */
  async initialize() {
    if (this.client) {
      try { await this.client.destroy(); } catch { /* ignore */ }
      this.client = null;
    }

    this.setState({ status: "connecting", qrDataUrl: null, qrRefreshAt: null });

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      },
    });

    this.client.on("qr", async (qr) => {
      try {
        const dataUrl = await qrcode.toDataURL(qr);
        this.setState({
          status: "qr_ready",
          qrDataUrl: dataUrl,
          qrRefreshAt: Date.now() + QR_REFRESH_SECONDS * 1000,
        });
      } catch (err) {
        console.error("[WA] QR generation error:", err);
      }
    });

    this.client.on("authenticated", () => {
      console.log("[WA] Authenticated");
      this.setState({ status: "connecting", qrDataUrl: null, qrRefreshAt: null });
    });

    this.client.on("ready", () => {
      const info = this.client?.info;
      const phone = info?.wid?.user ? `+${info.wid.user}` : null;
      console.log(`[WA] Ready — phone: ${phone}`);
      this.setState({
        status: "connected",
        qrDataUrl: null,
        qrRefreshAt: null,
        phoneNumber: phone,
        connectedSince: new Date().toISOString(),
      });
    });

    this.client.on("disconnected", (reason) => {
      console.log("[WA] Disconnected:", reason);
      this.setState({
        status: "disconnected",
        qrDataUrl: null,
        qrRefreshAt: null,
        phoneNumber: null,
        connectedSince: null,
      });
      // Auto-reinitialize after 3 seconds
      setTimeout(() => this.initialize(), 3000);
    });

    this.client.on("message_ack", async (msg, ack) => {
      // ack: 1=sent, 2=delivered, 3=read, -1=error
      const statusMap: Record<number, string> = { 1: "sent", 2: "delivered", 3: "read", "-1": "failed" };
      const newStatus = statusMap[ack];
      if (!newStatus || !msg.id?._serialized) return;
      try {
        await WhatsAppLog.findOneAndUpdate(
          { waMessageId: msg.id._serialized },
          {
            deliveryStatus: newStatus,
            ...(newStatus === "delivered" ? { deliveredAt: new Date() } : {}),
            ...(newStatus === "read"      ? { readAt: new Date() }       : {}),
          }
        );
        this.io?.emit("wa:message_ack", { waMessageId: msg.id._serialized, status: newStatus });
      } catch { /* non-fatal */ }
    });

    await this.client.initialize();
  }

  private setState(partial: Partial<WAState>) {
    this.state = { ...this.state, ...partial };
    this.io?.emit("wa:status", this.getPublicState());
  }

  getPublicState() {
    return {
      status: this.state.status,
      qrDataUrl: this.state.qrDataUrl,
      qrRefreshIn: this.state.qrRefreshAt
        ? Math.max(0, Math.round((this.state.qrRefreshAt - Date.now()) / 1000))
        : null,
      phoneNumber: this.state.phoneNumber,
      connectedSince: this.state.connectedSince,
    };
  }

  isConnected() {
    return this.state.status === "connected";
  }

  /**
   * Send a plain text message to a phone number (with country code, no + or spaces).
   * Returns the serialized message ID.
   */
  async sendText(phone: string, message: string): Promise<string> {
    if (!this.isConnected() || !this.client) {
      throw new Error("WhatsApp is not connected");
    }
    const chatId = `${phone.replace(/[^0-9]/g, "")}@c.us`;
    const msg = await this.client.sendMessage(chatId, message);
    return msg.id._serialized;
  }

  /**
   * Send a file/media to a phone number.
   * `buffer` is the raw file buffer, `mimetype` is e.g. 'application/pdf', `filename` is display name.
   */
  async sendMedia(
    phone: string,
    buffer: Buffer,
    mimetype: string,
    filename: string,
    caption?: string
  ): Promise<string> {
    if (!this.isConnected() || !this.client) {
      throw new Error("WhatsApp is not connected");
    }
    const chatId = `${phone.replace(/[^0-9]/g, "")}@c.us`;
    const media = new MessageMedia(
      mimetype,
      buffer.toString("base64"),
      filename
    );
    const msg = await this.client.sendMessage(chatId, media, { caption });
    return msg.id._serialized;
  }

  /** Gracefully disconnect */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.logout();
      } catch {
        try { await this.client.destroy(); } catch { /* ignore */ }
      }
      this.client = null;
    }
    this.setState({
      status: "disconnected",
      qrDataUrl: null,
      qrRefreshAt: null,
      phoneNumber: null,
      connectedSince: null,
    });
  }
}

export const whatsappService = new WhatsAppService();
