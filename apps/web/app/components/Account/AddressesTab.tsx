"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, useAuth } from "../../lib/auth/authStore";
import { ErrorText, Field, Panel, PanelTitle, inputClass, outlineButtonClass, primaryButtonClass } from "./ui";

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
    <Panel>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <PanelTitle>{initial ? "Edit Address" : "New Address"}</PanelTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Label" htmlFor="ad-label">
            <input id="ad-label" placeholder="Home / Work" value={draft.label} onChange={set("label")} className={inputClass} />
          </Field>
          <Field label="Full Name" htmlFor="ad-name">
            <input id="ad-name" required value={draft.name} onChange={set("name")} className={inputClass} />
          </Field>
          <Field label="Mobile Number" htmlFor="ad-mobile">
            <input id="ad-mobile" required type="tel" inputMode="numeric" maxLength={10} value={draft.mobile} onChange={set("mobile")} className={inputClass} />
          </Field>
          <Field label="Pincode" htmlFor="ad-pin">
            <input id="ad-pin" required inputMode="numeric" maxLength={6} value={draft.pincode} onChange={set("pincode")} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address Line 1" htmlFor="ad-line1">
              <input id="ad-line1" required placeholder="House / flat, building, street" value={draft.line1} onChange={set("line1")} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address Line 2 (optional)" htmlFor="ad-line2">
              <input id="ad-line2" placeholder="Area, landmark" value={draft.line2 ?? ""} onChange={set("line2")} className={inputClass} />
            </Field>
          </div>
          <Field label="City" htmlFor="ad-city">
            <input id="ad-city" required value={draft.city} onChange={set("city")} className={inputClass} />
          </Field>
          <Field label="State" htmlFor="ad-state">
            <input id="ad-state" required value={draft.state} onChange={set("state")} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2 font-sans text-xs text-paper/70">
          <input type="checkbox" checked={draft.isDefault} onChange={set("isDefault")} className="accent-red" />
          Make this my default address
        </label>
        <ErrorText>{error}</ErrorText>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className={outlineButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`${primaryButtonClass} w-auto px-6`}>
            {saving ? "Saving…" : "Save Address"}
          </button>
        </div>
      </form>
    </Panel>
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

  if (editing) {
    return (
      <AddressForm
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex items-center justify-between gap-4">
        <PanelTitle>Saved Addresses</PanelTitle>
        <button type="button" onClick={() => setEditing("new")} className={outlineButtonClass}>
          + Add Address
        </button>
      </Panel>
      <ErrorText>{error}</ErrorText>
      {addresses === null ? (
        !error && <p className="m-0 font-sans text-xs text-paper/40">Loading…</p>
      ) : addresses.length === 0 ? (
        <Panel>
          <p className="m-0 font-sans text-sm text-paper/50">You haven&apos;t saved any addresses yet.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {addresses.map((a) => (
            <Panel key={a._id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-bold text-paper uppercase">{a.label}</span>
                {a.isDefault && (
                  <span className="rounded-sm bg-red/20 px-1.5 py-0.5 font-heading text-[0.55rem] font-bold tracking-[0.06em] text-red uppercase">
                    Default
                  </span>
                )}
              </div>
              <address className="font-sans text-xs leading-relaxed text-paper/70 not-italic">
                {a.name}
                <br />
                {a.line1}
                {a.line2 && `, ${a.line2}`}
                <br />
                {a.city}, {a.state} - {a.pincode}
                <br />
                +91 {a.mobile}
              </address>
              <div className="mt-auto flex gap-4 font-heading text-[0.65rem] font-bold tracking-[0.06em] uppercase">
                <button type="button" onClick={() => setEditing(a)} className="text-paper hover:text-gold">
                  Edit
                </button>
                <button type="button" onClick={() => remove(a._id)} className="text-paper/60 hover:text-red">
                  Delete
                </button>
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a._id)} className="text-paper/60 hover:text-gold">
                    Set as default
                  </button>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
