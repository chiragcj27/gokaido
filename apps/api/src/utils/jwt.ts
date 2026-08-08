import jwt from "jsonwebtoken";

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireEnv("JWT_SECRET"), {
    expiresIn: "7d",
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireEnv("JWT_REFRESH_SECRET"), {
    expiresIn: "30d",
  });
}

// Short-lived token issued after OTP verify, used only to complete registration
export function signTempToken(mobile: string): string {
  return jwt.sign({ mobile }, requireEnv("JWT_TEMP_SECRET"), {
    expiresIn: "15m",
  });
}

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, requireEnv("JWT_SECRET")) as { sub: string };
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, requireEnv("JWT_REFRESH_SECRET")) as { sub: string };
}

export function verifyTempToken(token: string): { mobile: string } {
  return jwt.verify(token, requireEnv("JWT_TEMP_SECRET")) as { mobile: string };
}
