import { nextSequence } from "@gokaido/database";

// Where an order comes from. Hard-coded to Mumbai for now; becomes a per-store /
// per-warehouse code once orders are fulfilled from more than one location.
const ORDER_ORIGIN_CODE = "BOM";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Customer-facing order number: {origin}-{YYMMDD in IST}-{daily sequence},
// e.g. BOM-261029-0042. The sequence restarts each IST day and pads to 4 digits
// (grows past 9999 if ever needed). A sequence value can be skipped if order
// creation fails after it's drawn — that's fine, it only has to be unique.
export async function generateOrderNumber(): Promise<string> {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const date =
    String(ist.getUTCFullYear()).slice(-2) +
    String(ist.getUTCMonth() + 1).padStart(2, "0") +
    String(ist.getUTCDate()).padStart(2, "0");
  const seq = await nextSequence(`order:${ORDER_ORIGIN_CODE}:${date}`);
  return `${ORDER_ORIGIN_CODE}-${date}-${String(seq).padStart(4, "0")}`;
}

// ICICI's merchantTxnNo must be alphanumeric, <=20 chars, and unique per call.
// The first sale attempt uses the order number with hyphens stripped
// (BOM2610290042), so it's recognisable in ICICI's dashboard. Later calls for
// the same order — payment retry (P), status query (S), refund (R) — append a
// kind letter + 6 base-36 timestamp chars to keep it unique but still traceable.
export function gatewayTxnNo(orderNumber: string, kind?: "P" | "S" | "R"): string {
  const compact = orderNumber.replace(/[^A-Za-z0-9]/g, "");
  if (!kind) return compact.slice(0, 20);
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `${compact.slice(0, 13)}${kind}${stamp}`;
}
