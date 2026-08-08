import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  const to = mobile.startsWith("+") ? mobile : `+91${mobile}`;
  const client = getClient();

  if (!client) {
    // Dev fallback — log OTP to console instead of sending
    console.log(`[SMS] OTP for ${to}: ${otp}`);
    return;
  }

  await client.messages.create({
    to,
    from: process.env.TWILIO_PHONE!,
    body: `${otp} is your Gokaido verification code. Valid for 10 minutes. Do not share this with anyone.`,
  });
}
