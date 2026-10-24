// MSG91 client — SMS (OTP + DLT flow templates), WhatsApp templates and email,
// all on one authkey. Every template referenced here (DLT SMS, Meta-approved
// WhatsApp, email) has to be created in the MSG91 dashboard first; this file
// only sends against them.
//
// With MSG91_AUTH_KEY unset (local dev) every send is logged to the console
// instead, same as the old Twilio fallback.

const CONTROL_BASE = "https://control.msg91.com/api/v5";
const WHATSAPP_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

function getAuthKey(): string | undefined {
  return process.env.MSG91_AUTH_KEY || undefined;
}

export function isMsg91Configured(): boolean {
  return Boolean(getAuthKey());
}

// MSG91 wants country code + number, no "+": 10-digit Indian numbers get "91".
export function toMsg91Mobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

async function post(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { authkey: getAuthKey()!, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON body — keep the raw text for the error message
  }
  // MSG91 reports some failures as 200 with {type: "error"}
  const isError =
    !res.ok ||
    (typeof data === "object" && data !== null && (data as { type?: string }).type === "error");
  if (isError) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : text;
    throw new Error(`MSG91 ${res.status}: ${message}`);
  }
  return data;
}

// Delivers an OTP we generated ourselves (verification stays in our DB, so we
// never call MSG91's /otp/verify). The DLT template must contain ##OTP##.
export async function sendOtp(mobile: string, otp: string): Promise<void> {
  const to = toMsg91Mobile(mobile);
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!getAuthKey() || !templateId) {
    console.log(`[MSG91] OTP for ${to}: ${otp}`);
    return;
  }
  const params = new URLSearchParams({ template_id: templateId, mobile: to, otp, otp_expiry: "10" });
  await post(`${CONTROL_BASE}/otp?${params}`, {});
}

// Transactional SMS via a DLT-approved Flow template. `vars` keys must match
// the template's ##var## names exactly (case-sensitive).
export async function sendFlowSms(
  mobile: string,
  templateId: string,
  vars: Record<string, string>
): Promise<void> {
  const to = toMsg91Mobile(mobile);
  if (!getAuthKey()) {
    console.log(`[MSG91] SMS ${templateId} → ${to}`, vars);
    return;
  }
  await post(`${CONTROL_BASE}/flow`, {
    template_id: templateId,
    short_url: "0",
    recipients: [{ mobiles: to, ...vars }],
  });
}

// WhatsApp template message. `bodyParams` fill {{1}}, {{2}}, … in order.
export async function sendWhatsAppTemplate(
  mobile: string,
  templateName: string,
  bodyParams: string[],
  languageCode = "en"
): Promise<void> {
  const to = toMsg91Mobile(mobile);
  const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER;
  if (!getAuthKey() || !integratedNumber) {
    console.log(`[MSG91] WhatsApp ${templateName} → ${to}`, bodyParams);
    return;
  }
  const components: Record<string, { type: "text"; value: string }> = {};
  bodyParams.forEach((value, i) => {
    components[`body_${i + 1}`] = { type: "text", value };
  });
  await post(WHATSAPP_URL, {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode, policy: "deterministic" },
        to_and_components: [{ to: [to], components }],
      },
    },
  });
}

// Email via an MSG91 email template; `variables` fill its {{handlebars}} keys.
export async function sendTemplateEmail(
  to: { email: string; name?: string },
  templateId: string,
  variables: Record<string, string>
): Promise<void> {
  const fromEmail = process.env.MSG91_EMAIL_FROM;
  const domain = process.env.MSG91_EMAIL_DOMAIN;
  if (!getAuthKey() || !fromEmail || !domain) {
    console.log(`[MSG91] Email ${templateId} → ${to.email}`, variables);
    return;
  }
  await post(`${CONTROL_BASE}/email/send`, {
    recipients: [{ to: [{ email: to.email, name: to.name ?? "" }], variables }],
    from: { email: fromEmail, name: process.env.MSG91_EMAIL_FROM_NAME ?? "Gokaido" },
    domain,
    template_id: templateId,
  });
}
