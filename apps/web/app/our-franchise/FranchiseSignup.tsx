"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Values must match FRANCHISE_ENQUIRY_SOURCES in packages/database (franchise-enquiry model).
const SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google search" },
  { value: "store", label: "A Gokaido store" },
  { value: "referral", label: "Friend or referral" },
  { value: "other", label: "Other" },
];

const FIELD =
  "w-full rounded-md border border-paper/15 bg-panel px-4 py-3.5 font-sans text-sm text-paper outline-none transition-colors placeholder:text-paper/50 focus:border-paper/50";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "done" } | { kind: "error"; message: string };

/**
 * "Sign up today" — franchise enquiry form over the gear banner. Posts to the API's
 * public POST /api/franchise-enquiries (stored as FranchiseEnquiry documents).
 */
export default function FranchiseSignup() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [source, setSource] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch(`${API_URL}/api/franchise-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus({ kind: "error", message: body?.error ?? "Something went wrong. Please try again." });
        return;
      }
      form.reset();
      setSource("");
      setStatus({ kind: "done" });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  return (
    <section id="franchise-signup" aria-labelledby="franchise-signup-title" className="relative pb-24">
      <div className="relative aspect-1580/715 w-full overflow-hidden">
        <Image src="/franchise/image 261.png" alt="" fill sizes="100vw" className="object-cover" />
        {/* Fade the banner into the page on every side, strongest at the bottom where the form overlaps. */}
        <div className="absolute inset-0 bg-linear-to-b from-ink via-transparent to-ink" />
        <div className="absolute inset-0 bg-linear-to-r from-ink/60 via-transparent to-ink/60" />

        <h2 id="franchise-signup-title" className="absolute inset-x-0 top-[2%] m-0">
          <span className="sr-only">Sign up today</span>
          {/* Arched title: text laid along a shallow upward curve. */}
          <svg aria-hidden viewBox="0 0 1000 260" className="mx-auto block w-[88%]">
            <path id="franchise-signup-arc" d="M 0 250 Q 500 100 1000 250" fill="none" />
            <text
              className="fill-paper font-heading uppercase"
              fontSize="118"
              fontWeight={600}
              letterSpacing="-4"
            >
              <textPath href="#franchise-signup-arc" startOffset="50%" textAnchor="middle">
                Sign up today
              </textPath>
            </text>
          </svg>
        </h2>
      </div>

      <div className="relative z-10 mx-4 -mt-[18%] sm:mx-auto sm:-mt-[16%] sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-paper/30 bg-panel/95 p-4 backdrop-blur-sm sm:p-5">
          {status.kind === "done" ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="m-0 font-heading text-2xl font-semibold uppercase">Thank you!</p>
              <p className="m-0 max-w-xs font-sans text-sm text-paper/70">
                We&rsquo;ve got your details. Our franchise team will be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              {/* Placeholder copy (tracked in DUMMY_DATA.md). */}
              <p className="m-0 mx-auto mb-2 max-w-xs text-center font-sans text-sm leading-relaxed text-paper/90">
                Fill out the form below and we&rsquo;ll get you started on bringing Gokaido to your city.
              </p>

              <input name="name" required maxLength={120} autoComplete="name" placeholder="Name" aria-label="Name" className={FIELD} />
              <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="Email" aria-label="Email" className={FIELD} />
              <input
                name="phone"
                type="tel"
                required
                maxLength={25}
                autoComplete="tel"
                // Mirrors the API check: digits with optional +, spaces, dashes, brackets.
                pattern="\+?[\d\s\(\)\-]{7,}"
                title="Enter a valid phone number"
                placeholder="Phone"
                aria-label="Phone"
                className={FIELD}
              />
              <input
                name="city"
                required
                maxLength={120}
                autoComplete="address-level2"
                placeholder="City / Country"
                aria-label="City or country"
                className={FIELD}
              />
              <input
                name="businessName"
                required
                maxLength={160}
                autoComplete="organization"
                placeholder="Business Name"
                aria-label="Business name"
                className={FIELD}
              />

              <div className="relative">
                <select
                  name="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  aria-label="How did you hear about us?"
                  className={`${FIELD} appearance-none pr-10 ${source ? "" : "text-paper/50"}`}
                >
                  <option value="">How did you hear about us?</option>
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value} className="text-paper">
                      {s.label}
                    </option>
                  ))}
                </select>
                <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-4 h-3.5 w-3.5 -translate-y-1/2 text-paper/80">
                  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.75} />
                </svg>
              </div>

              <textarea name="message" rows={5} maxLength={2000} placeholder="Message" aria-label="Message" className={`${FIELD} resize-none`} />

              {status.kind === "error" && (
                <p role="alert" className="m-0 font-sans text-sm text-red">
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={status.kind === "submitting"}
                className="mt-2 w-full cursor-pointer rounded-md bg-paper py-3.5 font-sans text-lg text-ink uppercase transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {status.kind === "submitting" ? "Sending…" : "Submit"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
