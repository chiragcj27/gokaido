import { createHmac } from "node:crypto";

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

// ICICI expects IST (UTC+5:30) timestamps regardless of the server's own timezone.
function formatIstTimestamp(date: Date): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(ist.getUTCFullYear()) +
    pad(ist.getUTCMonth() + 1) +
    pad(ist.getUTCDate()) +
    pad(ist.getUTCHours()) +
    pad(ist.getUTCMinutes()) +
    pad(ist.getUTCSeconds())
  );
}

// Hash Calculation (V1): sort non-empty parameter names ascending, concatenate
// their values with no separator, HMAC-SHA256 with the shared secret, hex, lowercase.
export function computeSecureHashV1(
  params: Record<string, string | undefined>,
  secretKey: string
): string {
  const keys = Object.keys(params)
    .filter((k) => k !== "secureHash")
    .sort();
  const concatenated = keys
    .map((k) => params[k])
    .filter((v): v is string => v !== undefined && v !== null && v !== "")
    .join("");
  return createHmac("sha256", secretKey).update(concatenated, "utf8").digest("hex").toLowerCase();
}

// Verifies an inbound POST body (Payment Response / Payment Advice) against
// its own secureHash field. Per spec: every parameter present must be
// included in the hash, not just the documented ones — only null/empty
// values are skipped — so this hashes the body as received, not a fixed list.
export function verifyInboundHash(body: Record<string, unknown>, secretKey: string): boolean {
  const received = typeof body.secureHash === "string" ? body.secureHash.toLowerCase() : "";
  if (!received) return false;

  const stringParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "secureHash" || value === null || value === undefined) continue;
    stringParams[key] = String(value);
  }

  return computeSecureHashV1(stringParams, secretKey) === received;
}

function icici() {
  return {
    merchantId: requireEnv("ICICI_MERCHANT_ID"),
    aggregatorID: process.env.ICICI_AGGREGATOR_ID,
    secretKey: requireEnv("ICICI_SECRET_KEY"),
    baseUrl: requireEnv("ICICI_PG_BASE_URL").replace(/\/$/, ""),
  };
}

export interface InitiateSaleInput {
  merchantTxnNo: string;
  amount: number;
  customerEmailID: string;
  customerMobileNo?: string;
  customerName?: string;
  returnURL: string;
  addlParam1?: string;
}

export interface InitiateSaleResult {
  responseCode: string;
  responseDescription?: string;
  merchantId?: string;
  merchantTxnNo?: string;
  redirectURI?: string;
  tranCtx?: string;
  showOTPCapturePage?: string;
  secureHash?: string;
}

export async function initiateSale(input: InitiateSaleInput): Promise<InitiateSaleResult> {
  const { merchantId, aggregatorID, secretKey, baseUrl } = icici();

  const params: Record<string, string> = {
    merchantId,
    ...(aggregatorID ? { aggregatorID } : {}),
    merchantTxnNo: input.merchantTxnNo,
    amount: input.amount.toFixed(2),
    currencyCode: "356",
    payType: "0",
    customerEmailID: input.customerEmailID,
    transactionType: "SALE",
    returnURL: input.returnURL,
    txnDate: formatIstTimestamp(new Date()),
    ...(input.customerMobileNo ? { customerMobileNo: input.customerMobileNo } : {}),
    ...(input.customerName ? { customerName: input.customerName } : {}),
    ...(input.addlParam1 ? { addlParam1: input.addlParam1 } : {}),
  };

  const secureHash = computeSecureHashV1(params, secretKey);

  const res = await fetch(`${baseUrl}/v2/initiateSale`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, secureHash }),
  });

  return (await res.json()) as InitiateSaleResult;
}

export interface StatusResult {
  responseCode: string;
  respDescription?: string;
  txnStatus?: "REQ" | "SUC" | "REJ" | "ERR";
  txnResponseCode?: string;
  txnRespDescription?: string;
  txnID?: string;
  paymentDateTime?: string;
  txnAuthID?: string;
}

export async function checkTransactionStatus(
  merchantTxnNo: string,
  originalTxnNo: string
): Promise<StatusResult> {
  const { merchantId, aggregatorID, secretKey, baseUrl } = icici();

  const params: Record<string, string> = {
    merchantId,
    ...(aggregatorID ? { aggregatorID } : {}),
    merchantTxnNo,
    originalTxnNo,
    transactionType: "STATUS",
  };
  const secureHash = computeSecureHashV1(params, secretKey);

  const res = await fetch(`${baseUrl}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, secureHash }).toString(),
  });

  return (await res.json()) as StatusResult;
}

export interface RefundInput {
  merchantTxnNo: string;
  originalTxnNo: string;
  // 9 significant + 2 decimal, e.g. 150.00. Use 0 for a void.
  amount: number;
}

export interface RefundResult {
  responseCode: string;
  respDescription?: string;
  txnID?: string;
  txnAuthID?: string;
}

export async function refundOrVoid(input: RefundInput): Promise<RefundResult> {
  const { merchantId, aggregatorID, secretKey, baseUrl } = icici();

  const params: Record<string, string> = {
    merchantId,
    ...(aggregatorID ? { aggregatorID } : {}),
    merchantTxnNo: input.merchantTxnNo,
    originalTxnNo: input.originalTxnNo,
    amount: input.amount.toFixed(2),
    transactionType: "REFUND",
  };
  const secureHash = computeSecureHashV1(params, secretKey);

  const res = await fetch(`${baseUrl}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, secureHash }).toString(),
  });

  return (await res.json()) as RefundResult;
}

export function getSecretKey(): string {
  return requireEnv("ICICI_SECRET_KEY");
}
