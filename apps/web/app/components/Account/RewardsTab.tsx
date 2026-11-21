"use client";

// Rewards: membership tier, points balance (available / pending / expiring),
// how the programme works, and the points history. No Figma frame yet — built
// in the account area's existing panel style.

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/authStore";
import { formatPoints, useRewardsSummary, type RewardTransaction } from "../../lib/rewards";
import { ErrorText, Panel, PanelTitle, formatDate, formatPrice, outlineButtonClass } from "./ui";

const PAGE_SIZE = 20;

function Stat({ label, value, hint, accent = false }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <Panel className="flex flex-col gap-2">
      <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">{label}</span>
      <span className={`font-heading text-2xl font-extrabold ${accent ? "text-gold" : "text-paper"}`}>{value}</span>
      {hint && <span className="font-sans text-[0.65rem] text-paper/40">{hint}</span>}
    </Panel>
  );
}

function statusNote(t: RewardTransaction): string | null {
  switch (t.status) {
    case "pending":
      return "Pending — usable once the order ships";
    case "void":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return t.points > 0 && t.expiresAt ? `Valid until ${formatDate(t.expiresAt)}` : null;
  }
}

function History() {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<RewardTransaction[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch<{ transactions: RewardTransaction[]; pagination: { totalPages: number } }>(
      `/users/me/reward-transactions?page=${page}&limit=${PAGE_SIZE}`,
    )
      .then(({ transactions, pagination }) => {
        setRows((prev) => (page === 1 ? transactions : [...(prev ?? []), ...transactions]));
        setTotalPages(pagination.totalPages);
      })
      .catch(() => setError("Couldn't load your points history."));
  }, [authFetch, page]);

  return (
    <Panel className="flex flex-col gap-4">
      <PanelTitle>Points history</PanelTitle>
      <ErrorText>{error}</ErrorText>
      {rows === null && !error && <p className="m-0 font-sans text-sm text-paper/40">Loading…</p>}
      {rows?.length === 0 && (
        <p className="m-0 font-sans text-sm text-paper/50">No points yet — you&apos;ll earn them on every purchase.</p>
      )}
      {rows && rows.length > 0 && (
        <ul className="m-0 flex list-none flex-col divide-y divide-[#2e2e2e] p-0">
          {rows.map((t) => {
            const note = statusNote(t);
            const muted = t.status === "void" || t.status === "expired";
            return (
              <li key={t._id} className="flex items-start justify-between gap-4 py-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={`font-sans text-sm ${muted ? "text-paper/40 line-through" : "text-paper"}`}>{t.description}</span>
                  <span className="font-sans text-[0.65rem] text-paper/40">
                    {formatDate(t.createdAt)}
                    {note && ` · ${note}`}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-heading text-sm font-bold ${
                    muted ? "text-paper/30" : t.points >= 0 ? (t.status === "pending" ? "text-paper/60" : "text-gold") : "text-paper"
                  }`}
                >
                  {t.points >= 0 ? "+" : "−"}
                  {Math.abs(t.points).toLocaleString("en-IN")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {page < totalPages && (
        <button type="button" onClick={() => setPage((p) => p + 1)} className={`${outlineButtonClass} self-start`}>
          Load more
        </button>
      )}
    </Panel>
  );
}

export default function RewardsTab() {
  const { summary, error } = useRewardsSummary();

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!summary) return <p className="m-0 font-sans text-sm text-paper/40">Loading…</p>;

  const { membership, rules } = summary;
  const expiring = summary.expiringSoon.reduce((n, b) => n + b.points, 0);
  const progress = membership.next
    ? Math.min(100, Math.round((membership.spend / membership.next.minSpend) * 100))
    : 100;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <span className="flex flex-col gap-1">
            <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Your membership</span>
            <span className="font-heading text-2xl font-extrabold text-gold uppercase">{membership.label}</span>
          </span>
          <span className="font-sans text-xs text-paper/60">
            Earning {membership.pointsPer1000} points per {formatPrice(1000)} spent
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-sans text-xs text-paper/50">
            {formatPrice(membership.spend)} spent in the last {Math.round(membership.windowDays / 30)} months
            {membership.next
              ? ` · ${formatPrice(membership.next.spendNeeded)} more to become ${membership.next.label}`
              : " · you're at the top tier"}
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Available points" value={summary.balance.toLocaleString("en-IN")} hint="Redeem for gifts at checkout" accent />
        <Stat label="Pending" value={summary.pending.toLocaleString("en-IN")} hint="Usable once those orders ship" />
        <Stat
          label={`Expiring in ${rules.expiringSoonDays} days`}
          value={expiring.toLocaleString("en-IN")}
          hint={summary.expiringSoon[0] ? `Next on ${formatDate(summary.expiringSoon[0].expiresAt)}` : "Nothing expiring soon"}
        />
      </div>

      <Panel className="flex flex-col gap-4">
        <PanelTitle>How it works</PanelTitle>
        <ul className="m-0 flex list-disc flex-col gap-2 pl-5 font-sans text-sm leading-relaxed text-paper/70">
          <li>Buy, earn points and choose a gift. Points can&apos;t be taken off the bill or swapped for cash.</li>
          <li>
            1 point = {formatPrice(rules.pointValueInr)} worth of gifts. Pick a gift at checkout and it ships free with
            your order.
          </li>
          <li>Each purchase&apos;s points last {Math.round(rules.validityDays / 30)} months from the day you bought.</li>
          <li>
            Refer a friend: you get {formatPoints(rules.referralBonusPoints)} when they place an order above{" "}
            {formatPrice(rules.referralMinOrderValue)}.
          </li>
        </ul>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm text-paper/80">
            <thead>
              <tr className="text-left text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">
                <th className="py-2 pr-4 font-normal">Tier</th>
                <th className="py-2 pr-4 font-normal">Purchases in the last year</th>
                <th className="py-2 font-normal">Points per {formatPrice(1000)}</th>
              </tr>
            </thead>
            <tbody>
              {summary.tiers.map((t, i) => {
                const upper = summary.tiers[i + 1]?.minSpend;
                return (
                  <tr key={t.tier} className={`border-t border-[#2e2e2e] ${t.tier === membership.tier ? "text-gold" : ""}`}>
                    <td className="py-2 pr-4">{t.label}</td>
                    <td className="py-2 pr-4">
                      {upper ? `${formatPrice(t.minSpend)} – ${formatPrice(upper - 1)}` : `${formatPrice(t.minSpend)}+`}
                    </td>
                    <td className="py-2">{t.pointsPer1000}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <History />
    </div>
  );
}
