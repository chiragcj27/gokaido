import { Notification, User, type IOrder, type NotificationChannel } from "@gokaido/database";
import { sendFlowSms, sendTemplateEmail, sendWhatsAppTemplate } from "./msg91.js";

const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type OrderEvent =
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded";

// Template variables per event, in order. WhatsApp templates take them as
// {{1}}, {{2}}, … in this order; SMS Flow templates as ##var1##, ##var2##, …;
// email templates by name ({{name}}, {{orderNumber}}, …). Create the MSG91
// templates to match — a WhatsApp template with a different param count is
// rejected by Meta.
const EVENT_VARIABLES: Record<OrderEvent, (keyof OrderVars)[]> = {
  order_confirmed: ["name", "orderNumber", "total", "orderUrl"],
  order_shipped: ["name", "orderNumber", "courierPartner", "trackingNumber", "orderUrl"],
  order_delivered: ["name", "orderNumber", "orderUrl"],
  order_cancelled: ["name", "orderNumber", "orderUrl"],
  order_refunded: ["name", "orderNumber", "total", "orderUrl"],
};

type OrderVars = {
  name: string;
  orderNumber: string;
  total: string;
  orderUrl: string;
  courierPartner: string;
  trackingNumber: string;
};

// Template per channel comes from env, e.g. MSG91_WHATSAPP_ORDER_SHIPPED
// (template name), MSG91_SMS_ORDER_SHIPPED (Flow template ID),
// MSG91_EMAIL_ORDER_SHIPPED (email template ID). An unset one just skips that
// channel for that event, so channels can go live as templates get approved.
function templateFor(channel: NotificationChannel, event: OrderEvent): string | undefined {
  return process.env[`MSG91_${channel.toUpperCase()}_${event.toUpperCase()}`] || undefined;
}

type Recipient = {
  userId?: unknown;
  name: string;
  mobile?: string;
  email?: string;
  prefs: { whatsapp: boolean; sms: boolean; email: boolean };
};

async function resolveRecipient(order: IOrder): Promise<Recipient> {
  if (order.user) {
    const user = (await User.findById(order.user)
      .select("name mobile email notifications")
      .lean()) as {
      _id: unknown;
      name?: string;
      mobile?: string;
      email?: string;
      notifications?: Recipient["prefs"];
    } | null;
    if (user) {
      return {
        userId: user._id,
        name: user.name ?? order.shippingAddress.name,
        mobile: user.mobile ?? order.shippingAddress.mobile,
        email: user.email,
        prefs: user.notifications ?? { whatsapp: true, sms: true, email: true },
      };
    }
  }
  return {
    name: order.guestName ?? order.shippingAddress.name,
    mobile: order.guestMobile ?? order.shippingAddress.mobile,
    email: order.guestEmail,
    prefs: { whatsapp: true, sms: true, email: true },
  };
}

async function deliver(
  channel: NotificationChannel,
  event: OrderEvent,
  recipient: Recipient,
  order: IOrder
): Promise<void> {
  const templateId = templateFor(channel, event);
  const to = channel === "email" ? recipient.email : recipient.mobile;
  if (!templateId || !to || !recipient.prefs[channel]) return;

  const all: OrderVars = {
    name: recipient.name,
    orderNumber: order.orderNumber,
    total: `₹${order.total.toLocaleString("en-IN")}`,
    orderUrl: `${SITE_URL}/orders/${order.orderNumber}`,
    courierPartner: order.courierPartner ?? "our courier partner",
    trackingNumber: order.trackingNumber ?? "-",
  };
  const keys = EVENT_VARIABLES[event];
  const vars = Object.fromEntries(keys.map((k) => [k, all[k]])) as Record<string, string>;

  const log = {
    user: recipient.userId,
    channel,
    type: event,
    to,
    body: templateId,
    metadata: { orderNumber: order.orderNumber, vars },
  };
  try {
    if (channel === "whatsapp") {
      await sendWhatsAppTemplate(to, templateId, keys.map((k) => all[k]));
    } else if (channel === "sms") {
      await sendFlowSms(
        to,
        templateId,
        Object.fromEntries(keys.map((k, i) => [`var${i + 1}`, all[k]]))
      );
    } else {
      await sendTemplateEmail({ email: to, name: recipient.name }, templateId, vars);
    }
    await Notification.create({ ...log, status: "sent", sentAt: new Date() });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[notifications] ${channel} ${event} for ${order.orderNumber} failed:`, error);
    await Notification.create({ ...log, status: "failed", error });
  }
}

// Fire-and-forget: sends the event on every configured channel the customer
// hasn't opted out of. Never throws — a notification failure must not fail
// the order request that triggered it.
export function notifyOrder(order: IOrder, event: OrderEvent): void {
  void (async () => {
    try {
      const recipient = await resolveRecipient(order);
      await Promise.all(
        (["whatsapp", "sms", "email"] as const).map((channel) =>
          deliver(channel, event, recipient, order)
        )
      );
    } catch (err) {
      console.error(`[notifications] ${event} for ${order.orderNumber} failed:`, err);
    }
  })();
}
