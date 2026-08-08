import { mongoose } from "../client.js";

export type NotificationChannel = "whatsapp" | "sms" | "email";
export type NotificationType =
  | "otp"
  | "order_placed"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "abandoned_cart"
  | "promotional";

export interface INotification {
  user?: mongoose.Types.ObjectId;
  channel: NotificationChannel;
  type: NotificationType;
  to: string;
  subject?: string;
  body: string;
  status: "queued" | "sent" | "failed";
  error?: string;
  sentAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    channel: {
      type: String,
      required: true,
      enum: ["whatsapp", "sms", "email"],
    },
    type: {
      type: String,
      required: true,
      enum: [
        "otp",
        "order_placed",
        "order_confirmed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "abandoned_cart",
        "promotional",
      ],
    },
    to: { type: String, required: true },
    subject: String,
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
    },
    error: String,
    sentAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ status: 1, createdAt: 1 });

export const Notification =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", notificationSchema);
