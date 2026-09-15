import { randomBytes } from "node:crypto";

// Alphanumeric only, <=20 chars — required by ICICI PG for merchantTxnNo,
// and reused as the customer-facing orderNumber.
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `GK${timestamp}${random}`;
}
