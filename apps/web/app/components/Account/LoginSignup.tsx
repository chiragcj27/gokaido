"use client";

// Login / Sign Up screen (Figma: "Login / Sign Up"). The design's email +
// password fields are swapped for mobile + OTP, since customer auth is
// OTP-only (see CLAUDE.md) — layout and styling follow the design.

import Link from "next/link";
import { useState } from "react";
import { ApiRequestError, apiRequest, useAuth, type AuthUser } from "../../lib/auth/authStore";
import { ErrorText, Field, inputClass, primaryButtonClass } from "./ui";

const MOBILE_RE = /^[6-9]\d{9}$/;

type VerifyResponse =
  | { isNewUser: true; tempToken: string }
  | { isNewUser: false; accessToken: string; refreshToken: string; user: AuthUser };

const errorMessage = (err: unknown) =>
  err instanceof ApiRequestError ? err.message : "Couldn't reach the server. Please try again.";

function MobileInput({ id, value, onChange, disabled }: { id: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex">
      <span className="flex h-10 items-center rounded-l-md border border-r-0 border-white/15 bg-black px-3 font-sans text-sm text-paper/60">
        +91
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="98765 43210"
        maxLength={10}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className={`${inputClass} rounded-l-none`}
      />
    </div>
  );
}

function OtpInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="6-digit code"
      maxLength={6}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      className={`${inputClass} tracking-[0.3em]`}
    />
  );
}

function sendOtp(mobile: string) {
  return apiRequest<{ isNewUser: boolean }>("/auth/otp/send", { method: "POST", body: JSON.stringify({ mobile }) });
}

function verifyOtp(mobile: string, otp: string) {
  return apiRequest<VerifyResponse>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ mobile, otp }) });
}

function LoginCard({ onNewUser }: { onNewUser: (mobile: string, tempToken: string) => void }) {
  const { setSession } = useAuth();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!MOBILE_RE.test(mobile)) return setError("Enter a valid 10-digit mobile number.");
    if (otpSent && otp.length !== 6) return setError("Enter the 6-digit code we sent you.");

    setBusy(true);
    try {
      if (!otpSent) {
        await sendOtp(mobile);
        setOtpSent(true);
      } else {
        const res = await verifyOtp(mobile, otp);
        if (res.isNewUser) onNewUser(mobile, res.tempToken);
        else setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setOtp("");
    try {
      await sendOtp(mobile);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-4 rounded-lg border border-white/10 bg-panel p-5 sm:p-6">
      <div>
        <h2 className="m-0 font-heading text-base font-bold text-paper uppercase">Login</h2>
        <p className="m-0 font-sans text-[0.65rem] text-paper/50">Welcome back</p>
      </div>

      <Field label="Mobile Number" htmlFor="login-mobile">
        <MobileInput
          id="login-mobile"
          value={mobile}
          disabled={otpSent}
          onChange={setMobile}
        />
      </Field>

      {otpSent && (
        <Field label="One-Time Password" htmlFor="login-otp" hint={`Sent by SMS to +91 ${mobile}`}>
          <OtpInput id="login-otp" value={otp} onChange={setOtp} />
        </Field>
      )}

      {otpSent && (
        <div className="flex gap-4 font-sans text-[0.65rem] font-bold text-paper">
          <button type="button" onClick={resend} className="hover:text-gold">
            Resend OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              setError(null);
            }}
            className="hover:text-gold"
          >
            Change number
          </button>
        </div>
      )}

      <ErrorText>{error}</ErrorText>

      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Please wait…" : otpSent ? "Login" : "Send OTP"}
      </button>

      <p className="m-0 mt-auto pt-8 text-center font-sans text-[0.6rem] text-paper/40">
        Secure login · Your information is protected
      </p>
    </form>
  );
}

function RegisterCard({ verified }: { verified: { mobile: string; tempToken: string } | null }) {
  const { setSession } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Login card found no account for its number — continue sign-up here with that verified number.
  const [handoff, setHandoff] = useState(verified);
  if (verified !== handoff) {
    setHandoff(verified);
    if (verified) {
      setMobile(verified.mobile);
      setTempToken(verified.tempToken);
      setNotice("No account found for this number. Add your name to finish signing up.");
    }
  }

  const finishRegistration = async (token: string) => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const res = await apiRequest<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, referralCode: referralCode.trim() || undefined }),
    });
    let user = res.user;
    if (email.trim()) {
      // Email isn't part of /auth/register; best-effort follow-up so a bad email doesn't lose the new account.
      try {
        ({ user } = await apiRequest<{ user: AuthUser }>("/users/me", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${res.accessToken}` },
          body: JSON.stringify({ email: email.trim() }),
        }));
      } catch {
        // Can be added later from Profile.
      }
    }
    setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken }, user);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (`${firstName}${lastName}`.trim().length < 2) return setError("Enter your name.");
    if (!MOBILE_RE.test(mobile)) return setError("Enter a valid 10-digit mobile number.");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (!tempToken && otpSent && otp.length !== 6) return setError("Enter the 6-digit code we sent you.");

    setBusy(true);
    try {
      if (tempToken) {
        await finishRegistration(tempToken);
      } else if (!otpSent) {
        await sendOtp(mobile);
        setOtpSent(true);
      } else {
        const res = await verifyOtp(mobile, otp);
        if (res.isNewUser) await finishRegistration(res.tempToken);
        // Number was already registered — just sign them in.
        else setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const mobileLocked = otpSent || Boolean(tempToken);

  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-4 rounded-lg border border-white/10 bg-panel p-5 sm:p-6">
      <div>
        <h2 className="m-0 font-heading text-base font-bold text-paper uppercase">New Customer</h2>
        <p className="m-0 font-sans text-[0.65rem] text-paper/50">Create your GOKAIDO account</p>
      </div>

      {notice && <p className="m-0 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 font-sans text-xs text-gold">{notice}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" htmlFor="reg-first">
          <input id="reg-first" autoComplete="given-name" placeholder="Enter first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Last Name" htmlFor="reg-last">
          <input id="reg-last" autoComplete="family-name" placeholder="Enter last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Mobile Number" htmlFor="reg-mobile" hint={tempToken ? "Verified ✓" : "Name and mobile number can't be changed later."}>
        <MobileInput id="reg-mobile" value={mobile} disabled={mobileLocked} onChange={setMobile} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email Address (optional)" htmlFor="reg-email">
          <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Referral Code (optional)" htmlFor="reg-ref">
          <input id="reg-ref" placeholder="e.g. GOK123" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className={inputClass} />
        </Field>
      </div>

      {otpSent && !tempToken && (
        <Field label="One-Time Password" htmlFor="reg-otp" hint={`Sent by SMS to +91 ${mobile}`}>
          <OtpInput id="reg-otp" value={otp} onChange={setOtp} />
        </Field>
      )}

      <ErrorText>{error}</ErrorText>

      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Please wait…" : otpSent || tempToken ? "Register" : "Send OTP"}
      </button>

      <div className="mt-2 flex flex-col gap-2">
        <span className="font-heading text-[0.6rem] font-bold tracking-[0.06em] text-red uppercase">Account Benefits</span>
        <ul className="m-0 grid list-disc grid-cols-2 gap-x-6 gap-y-1 pl-4 font-sans text-[0.65rem] text-paper/60">
          <li>Faster Checkout</li>
          <li>Order History</li>
          <li>Track Orders</li>
          <li>Wishlist</li>
        </ul>
      </div>
    </form>
  );
}

export default function LoginSignup() {
  const [verified, setVerified] = useState<{ mobile: string; tempToken: string } | null>(null);

  return (
    <div className="rounded-lg bg-panel/60 p-4 sm:p-8 lg:p-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr]">
        <LoginCard onNewUser={(mobile, tempToken) => setVerified({ mobile, tempToken })} />
        <div aria-hidden="true" className="hidden w-px bg-white/10 md:block" />
        <RegisterCard verified={verified} />
      </div>
      <p className="mx-auto mt-8 mb-0 max-w-5xl font-sans text-[0.6rem] text-paper/40">
        By continuing, you agree to GOKAIDO&apos;s{" "}
        <Link href="/terms-of-service" className="underline hover:text-paper">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline hover:text-paper">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
