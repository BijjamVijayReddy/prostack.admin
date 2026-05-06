import mongoose, { Document, Schema } from "mongoose";

export type MessageType =
  | "text"
  | "receipt"
  | "reminder"
  | "attendance"
  | "pdf"
  | "image"
  | "doc"
  | "bulk";

export type DeliveryStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface IWhatsAppLog extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  phone: string;
  messageType: MessageType;
  message?: string;
  mediaName?: string;
  mediaSize?: number;
  deliveryStatus: DeliveryStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  sentById?: mongoose.Types.ObjectId;
  sentByName?: string;
  waMessageId?: string;
  error?: string;
}

const WhatsAppLogSchema = new Schema<IWhatsAppLog>(
  {
    studentId:      { type: Schema.Types.ObjectId, ref: "Student", default: null },
    studentName:    { type: String, required: true, trim: true },
    phone:          { type: String, required: true, trim: true },
    messageType:    { type: String, enum: ["text","receipt","reminder","attendance","pdf","image","doc","bulk"], default: "text" },
    message:        { type: String, default: "" },
    mediaName:      { type: String, default: "" },
    mediaSize:      { type: Number, default: 0 },
    deliveryStatus: { type: String, enum: ["pending","sent","delivered","read","failed"], default: "pending" },
    sentAt:         { type: Date, default: Date.now },
    deliveredAt:    { type: Date, default: null },
    readAt:         { type: Date, default: null },
    sentById:       { type: Schema.Types.ObjectId, ref: "User", default: null },
    sentByName:     { type: String, default: "" },
    waMessageId:    { type: String, default: "" },
    error:          { type: String, default: "" },
  },
  { timestamps: true }
);

WhatsAppLogSchema.index({ sentAt: -1 });
WhatsAppLogSchema.index({ phone: 1 });
WhatsAppLogSchema.index({ deliveryStatus: 1 });

export default mongoose.model<IWhatsAppLog>("WhatsAppLog", WhatsAppLogSchema);
