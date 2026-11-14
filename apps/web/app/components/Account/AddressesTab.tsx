"use client";

// My Addresses — Figma "Address 1" (saved cards), "Address 2" (empty) and "Address 3" (form).

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, useAuth } from "../../lib/auth/authStore";
import { AddressLines, ErrorText, Panel, PanelTitle, panelLinkClass, redButtonClass } from "./ui";

// Figma "Address 3" form: small bold labels over flat grey fields.
const formLabelClass = "font-sans text-xs font-semibold text-paper";
const formInputClass =
  "h-10 w-full rounded-none border-0 bg-[#333] px-2.5 font-sans text-sm text-paper placeholder:text-paper/50 focus:outline focus:outline-1 focus:outline-white/40";

function FormField({ label, htmlFor, required, children }: { label: string; htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={formLabelClass}>
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={redButtonClass}>
      <Image src="/account/plus.svg" alt="" width={16} height={16} className="mr-2" />
      {label}
    </button>
  );
}

export interface Address {
  _id: string;
  label: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

type AddressDraft = Omit<Address, "_id">;

const EMPTY_DRAFT: AddressDraft = {
  label: "Home",
  name: "",
  mobile: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function AddressForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Address | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { authFetch, user } = useAuth();
  const [draft, setDraft] = useState<AddressDraft>(
    initial ?? { ...EMPTY_DRAFT, name: user?.name ?? "", mobile: user?.mobile ?? "" },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: key === "isDefault" ? e.target.checked : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = JSON.stringify({ ...draft, line2: draft.line2?.trim() || undefined });
      if (initial) await authFetch(`/addresses/${initial._id}`, { method: "PATCH", body });
      else await authFetch("/addresses", { method: "POST", body });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save the address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-[52rem] flex-col gap-6 pt-6">
      <span className="sr-only">{initial ? "Edit address" : "New address"}</span>
      <div className="flex flex-col gap-2 border-b border-[#3a3a3a] pb-2">
        <span className={formLabelClass}>Country / Region *</span>
        <span className="font-sans text-sm text-paper/80">India</span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="ad-name" required>
          <input id="ad-name" required autoComplete="name" placeholder="Full name" value={draft.name} onChange={set("name")} className={formInputClass} />
        </FormField>
        <FormField label="Mobile number" htmlFor="ad-mobile" required>
          <input id="ad-mobile" required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile" value={draft.mobile} onChange={set("mobile")} className={formInputClass} />
        </FormField>
      </div>
      <FormField label="Street address" htmlFor="ad-line1" required>
        <input id="ad-line1" required autoComplete="address-line1" placeholder="Street address" value={draft.line1} onChange={set("line1")} className={formInputClass} />
        <input id="ad-line2" aria-label="Apartment, landmark (optional)" autoComplete="address-line2" placeholder="Apartment, area, landmark (optional)" value={draft.line2 ?? ""} onChange={set("line2")} className={`${formInputClass} mt-2`} />
      </FormField>
      <FormField label="City" htmlFor="ad-city" required>
        <input id="ad-city" required autoComplete="address-level2" placeholder="City" value={draft.city} onChange={set("city")} className={formInputClass} />
      </FormField>
      <FormField label="State" htmlFor="ad-state" required>
        <input id="ad-state" required autoComplete="address-level1" placeholder="State" value={draft.state} onChange={set("state")} className={formInputClass} />
      </FormField>
      <FormField label="Pincode" htmlFor="ad-pin" required>
        <input id="ad-pin" required inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="Pincode" value={draft.pincode} onChange={set("pincode")} className={formInputClass} />
      </FormField>
      <FormField label="Label" htmlFor="ad-label">
        <input id="ad-label" placeholder="Home / Work" value={draft.label} onChange={set("label")} className={formInputClass} />
      </FormField>
      <label className="flex items-center gap-2 font-sans text-sm text-paper/80">
        <input type="checkbox" checked={draft.isDefault} onChange={set("isDefault")} className="accent-[#c10e12]" />
        Make this my default address
      </label>
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className={`${redButtonClass} px-5 !text-sm`}>
          {saving ? "Saving…" : "Save address"}
        </button>
        <button type="button" onClick={onCancel} className="font-sans text-sm text-paper/70 hover:text-paper">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesTab() {
  const { authFetch } = useAuth();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    authFetch<{ addresses: Address[] }>("/addresses")
      .then(({ addresses }) => setAddresses(addresses))
      .catch(() => setError("Couldn't load your addresses."));
  }, [authFetch]);

  useEffect(load, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await authFetch(`/addresses/${id}`, { method: "DELETE" });
      load();
    } catch {
      setError("Couldn't delete the address.");
    }
  };

  const makeDefault = async (id: string) => {
    try {
      await authFetch(`/addresses/${id}`, { method: "PATCH", body: JSON.stringify({ isDefault: true }) });
      load();
    } catch {
      setError("Couldn't update the address.");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 sm:h-16">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-heading text-xl leading-8 font-normal text-paper sm:text-2xl">My Addresses</h2>
          <p className="m-0 font-heading text-sm leading-6 text-[#ddd] sm:text-base">Manage your shipping addresses</p>
        </div>
        {!editing && <AddButton label="Add New Address" onClick={() => setEditing("new")} />}
      </div>

      <ErrorText>{error}</ErrorText>

      {editing ? (
        <AddressForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : addresses === null ? (
        !error && <p className="m-0 pt-6 font-sans text-sm text-paper/40">Loading…</p>
      ) : addresses.length === 0 ? (
        <>
          <div className="mt-6 flex flex-col items-center bg-[#171717] px-6 py-12 text-center">
            <Image src="/account/empty-address.svg" alt="" width={64} height={64} />
            <h3 className="m-0 pt-4 font-heading text-xl leading-7 font-normal text-[#ddd]">No addresses found</h3>
            <p className="m-0 pt-2 pb-6 font-heading text-base leading-6 text-[#e6e6e6]">Add your first shipping address to get started.</p>
            <AddButton label="Add Address" onClick={() => setEditing("new")} />
          </div>
          <div className="mt-6 border border-[#f21b1b] bg-[#262626] p-6">
            <h3 className="m-0 font-heading text-base leading-6 font-normal text-paper">Shipping Information</h3>
            <p className="m-0 pt-2 font-heading text-sm leading-5 text-[#ddd]">
              Please double-check shipping address, as this cannot be modified once your order is placed.
            </p>
          </div>
        </>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {[...addresses]
            .sort((x, y) => Number(y.isDefault) - Number(x.isDefault))
            .map((a) => (
              <Panel key={a._id} className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 flex-col gap-4">
                  <PanelTitle>{a.isDefault ? "Default Shipping Address" : `${a.label || "Other"} Address`}</PanelTitle>
                  <AddressLines address={a} />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <button type="button" onClick={() => setEditing(a)} className={panelLinkClass}>
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button type="button" onClick={() => makeDefault(a._id)} className="font-heading text-xs font-bold text-paper/60 uppercase hover:text-paper">
                      Set default
                    </button>
                  )}
                  <button type="button" onClick={() => remove(a._id)} className="font-heading text-xs font-bold text-paper/60 uppercase hover:text-[#eb141a]">
                    Delete
                  </button>
                </div>
              </Panel>
            ))}
        </div>
      )}
    </div>
  );
}
