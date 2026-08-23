"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

type Step = "mobile" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/otp/send", { mobile });
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{
        isNewUser: boolean;
        accessToken?: string;
        refreshToken?: string;
      }>("/api/auth/otp/verify", { mobile, otp });

      if (res.isNewUser || !res.accessToken || !res.refreshToken) {
        setError("This mobile number is not registered as an admin.");
        return;
      }

      await login(res.accessToken, res.refreshToken);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1>Gokaido Admin</h1>
        <p className="auth-subtitle">Sign in with your admin mobile number.</p>

        {step === "mobile" ? (
          <form onSubmit={handleSendOtp}>
            <label htmlFor="mobile">Mobile number</label>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="9876543210"
              required
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label htmlFor="otp">Enter the 6-digit code sent to {mobile}</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              required
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setStep("mobile");
                setOtp("");
                setError(null);
              }}
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
