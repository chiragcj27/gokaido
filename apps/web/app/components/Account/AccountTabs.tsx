"use client";

// Overview + Settings tabs. Orders, Wishlist, Addresses and Profile live in their own files.

import { useState } from "react";
import { ApiRequestError, useAuth, type AuthUser } from "../../lib/auth/authStore";
import { orderStatus, useOrders } from "./orders";
import { ErrorText, Panel, PanelTitle, formatDate, outlineButtonClass } from "./ui";

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export function OverviewTab({ onShowOrders }: { onShowOrders: () => void }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [copied, setCopied] = useState(false);
  if (!user) return null;

  const latest = orders?.[0];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelTitle>Welcome back, {user.name?.split(" ")[0]}</PanelTitle>
      </Panel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Panel className="flex flex-col gap-2">
          <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Reward Points</span>
          <span className="font-heading text-2xl font-extrabold text-gold">{user.rewardPoints}</span>
          <span className="font-sans text-[0.65rem] text-paper/40">1 point = ₹1 at checkout</span>
        </Panel>
        <Panel className="flex flex-col gap-2">
          <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Orders</span>
          <span className="font-heading text-2xl font-extrabold text-paper">{orders ? orders.length : "–"}</span>
          <button type="button" onClick={onShowOrders} className="self-start font-sans text-[0.65rem] text-paper/60 underline hover:text-paper">
            View all
          </button>
        </Panel>
        <Panel className="flex flex-col gap-2">
          <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Refer &amp; Earn</span>
          <span className="font-heading text-xl font-extrabold tracking-[0.08em] text-paper">{user.referralCode ?? "–"}</span>
          {user.referralCode && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(user.referralCode!).then(() => setCopied(true), () => {});
              }}
              className="self-start font-sans text-[0.65rem] text-paper/60 underline hover:text-paper"
            >
              {copied ? "Copied!" : "Copy code"}
            </button>
          )}
        </Panel>
      </div>
      {latest && (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-col gap-1">
            <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Latest Order</span>
            <span className="font-heading text-xs font-bold text-paper">
              #{latest.orderNumber} · {formatDate(latest.createdAt)}
            </span>
          </span>
          <span className="font-heading text-[0.65rem] font-bold tracking-[0.06em] text-paper/80 uppercase">{orderStatus(latest).label}</span>
        </Panel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const LANGUAGES: { value: AuthUser["language"]; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
  { value: "ta", label: "தமிழ்" },
];

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", hint: "Order updates and offers on WhatsApp" },
  { key: "sms", label: "SMS", hint: "Order status by text message" },
  { key: "email", label: "Email", hint: "Order confirmations and invoices" },
] as const;

export function SettingsTab() {
  const { user, setUser, authFetch, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;

  const notifications = user.notifications ?? { whatsapp: true, sms: true, email: true };

  const patch = async (body: object) => {
    setError(null);
    try {
      const res = await authFetch<{ user: AuthUser }>("/users/me", { method: "PATCH", body: JSON.stringify(body) });
      setUser(res.user);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save your settings.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4">
        <PanelTitle>Language</PanelTitle>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => patch({ language: l.value })}
              aria-pressed={user.language === l.value}
              className={`${outlineButtonClass} ${user.language === l.value ? "border-red text-paper" : "text-paper/60"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <PanelTitle>Notifications</PanelTitle>
        {CHANNELS.map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="font-sans text-sm text-paper">{c.label}</span>
              <span className="font-sans text-[0.65rem] text-paper/50">{c.hint}</span>
            </span>
            <input
              type="checkbox"
              checked={notifications[c.key]}
              onChange={(e) => patch({ notifications: { [c.key]: e.target.checked } })}
              className="size-4 accent-red"
            />
          </label>
        ))}
      </Panel>

      <ErrorText>{error}</ErrorText>

      <Panel>
        <button type="button" onClick={logout} className="font-heading text-xs font-bold tracking-[0.06em] text-red uppercase hover:opacity-80">
          Log Out
        </button>
      </Panel>
    </div>
  );
}
