"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, useAuth, type AuthUser } from "../../lib/auth/authStore";
import type { Address } from "./AddressesTab";
import { ErrorText, Field, Panel, PanelTitle, initials, inputClass, outlineButtonClass, splitName } from "./ui";

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
          <div className="flex flex-col gap-4">
            <PanelTitle>Profile</PanelTitle>
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full border border-white/20 font-heading text-sm font-bold text-paper">
                {initials(user.name)}
              </span>
              <div className="flex flex-col">
                <span className="font-heading text-sm font-bold text-paper">{user.name}</span>
                <span className="font-sans text-xs text-paper/50">{user.email || `+91 ${user.mobile}`}</span>
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
                className={outlineButtonClass}
              >
                Cancel
              </button>
              <button type="button" onClick={save} disabled={saving} className={`${outlineButtonClass} border-red bg-red hover:border-red`}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={outlineButtonClass}>
              Edit Profile
            </button>
          )}
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <PanelTitle>Personal Information</PanelTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        {editing && <p className="m-0 font-sans text-[0.65rem] text-paper/40">Name and phone number can&apos;t be changed after registration.</p>}
        <ErrorText>{error}</ErrorText>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <PanelTitle>Default Address</PanelTitle>
          <button type="button" onClick={onEditAddresses} className="font-heading text-[0.65rem] font-bold tracking-[0.06em] text-red uppercase hover:opacity-80">
            {defaultAddress === null ? "Add" : "Edit"}
          </button>
        </div>
        {defaultAddress === undefined ? (
          <p className="m-0 font-sans text-xs text-paper/40">Loading…</p>
        ) : defaultAddress === null ? (
          <p className="m-0 font-sans text-xs text-paper/50">No saved address yet.</p>
        ) : (
          <address className="font-sans text-xs leading-relaxed text-paper/70 not-italic">
            {defaultAddress.name}
            <br />
            {defaultAddress.line1}
            {defaultAddress.line2 && `, ${defaultAddress.line2}`}
            <br />
            {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
            <br />
            India
            <br />
            +91 {defaultAddress.mobile}
          </address>
        )}
      </Panel>

      <Panel>
        <button type="button" onClick={logout} className="flex w-full items-center justify-between text-left">
          <span className="flex flex-col gap-1">
            <PanelTitle>Security</PanelTitle>
            <span className="font-sans text-xs text-paper/50">Log out of this device</span>
          </span>
          <span aria-hidden="true" className="text-paper">
            &gt;
          </span>
        </button>
      </Panel>
    </div>
  );
}
