"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, useAuth, type AuthUser } from "../../lib/auth/authStore";
import type { Address } from "./AddressesTab";
import { AddressLines, ErrorText, Field, Panel, PanelTitle, initials, inputClass, panelLinkClass, splitName } from "./ui";

// Figma "Profile": outlined 230px-wide action button.
const profileButtonClass =
  "h-12 rounded-md border border-[#2e2e2e] bg-[#0c0c0c] px-6 font-sans text-sm font-semibold text-paper uppercase transition-colors hover:border-white/40 disabled:opacity-50 sm:h-14 sm:min-w-57.5 sm:text-[0.95rem]";

export default function ProfileTab({ onEditAddresses }: { onEditAddresses: () => void }) {
  const { user, setUser, authFetch, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null | undefined>(undefined);

  useEffect(() => {
    authFetch<{ addresses: Address[] }>("/addresses")
      .then(({ addresses }) => setDefaultAddress(addresses.find((a) => a.isDefault) ?? addresses[0] ?? null))
      .catch(() => setDefaultAddress(null));
  }, [authFetch]);

  if (!user) return null;
  const { first, last } = splitName(user.name);

  const save = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    setSaving(true);
    try {
      const res = await authFetch<{ user: AuthUser }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ email: email.trim() }),
      });
      setUser(res.user);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-5">
            <PanelTitle>Profile</PanelTitle>
            <div className="flex items-center gap-6 sm:gap-12">
              <span className="flex size-20 shrink-0 items-center justify-center rounded-full border border-[#2e2e2e] bg-[#0c0c0c] font-sans text-xl font-bold text-paper sm:size-30 sm:text-[1.7rem]">
                {initials(user.name)}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="font-heading text-base font-bold text-paper sm:text-xl">{user.name}</span>
                <span className="font-sans text-sm break-all text-[#b3b3b3] sm:text-lg">{user.email || `+91 ${user.mobile}`}</span>
              </div>
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEmail(user.email ?? "");
                  setError(null);
                }}
                className={profileButtonClass}
              >
                Cancel
              </button>
              <button type="button" onClick={save} disabled={saving} className={`${profileButtonClass} border-[#c10e12] bg-[#c10e12] hover:border-[#c10e12]`}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={profileButtonClass}>
              Edit Profile
            </button>
          )}
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <PanelTitle>Personal Information</PanelTitle>
        <div className="grid grid-cols-1 gap-x-11 gap-y-4 sm:grid-cols-2">
          <Field label="First Name" htmlFor="pf-first">
            <input id="pf-first" value={first} disabled className={inputClass} />
          </Field>
          <Field label="Last Name" htmlFor="pf-last">
            <input id="pf-last" value={last} disabled className={inputClass} />
          </Field>
          <Field label="Email Address" htmlFor="pf-email">
            <input
              id="pf-email"
              type="email"
              placeholder="Add your email"
              value={editing ? email : user.email ?? ""}
              disabled={!editing}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone Number" htmlFor="pf-phone">
            <input id="pf-phone" value={`+91 ${user.mobile ?? ""}`} disabled className={inputClass} />
          </Field>
        </div>
        {editing && <p className="m-0 font-sans text-xs text-paper/40">Name and phone number can&apos;t be changed after registration.</p>}
        <ErrorText>{error}</ErrorText>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <PanelTitle>Default Address</PanelTitle>
          <button type="button" onClick={onEditAddresses} className={panelLinkClass}>
            {defaultAddress === null ? "Add" : "Edit"}
          </button>
        </div>
        {defaultAddress === undefined ? (
          <p className="m-0 font-sans text-sm text-paper/40">Loading…</p>
        ) : defaultAddress === null ? (
          <p className="m-0 font-sans text-sm text-[#c2c2c2]">No saved address yet.</p>
        ) : (
          <AddressLines address={defaultAddress} />
        )}
      </Panel>

      {/* Figma shows "Change Password"; accounts are OTP-only, so this row signs out instead. */}
      <Panel className="!border-[#242424] !bg-[#070707] sm:!px-10.5">
        <button type="button" onClick={logout} className="flex w-full items-center justify-between text-left">
          <span className="flex flex-col gap-4">
            <PanelTitle>Security</PanelTitle>
            <span className="font-sans text-sm text-[#c2c2c2] sm:text-lg">Log out of this device</span>
          </span>
          <span aria-hidden="true" className="px-5 font-sans text-[2rem] text-paper">
            &gt;
          </span>
        </button>
      </Panel>
    </div>
  );
}
