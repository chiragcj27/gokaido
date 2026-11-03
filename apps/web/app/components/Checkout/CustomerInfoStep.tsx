import type { Address } from "../Account/AddressesTab";

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export const EMPTY_CUSTOMER_INFO: CustomerInfo = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

/** Picker value: a saved address id, or "new" to type one in. */
export type AddressChoice = string | "new";

/** Saved address → the form's shape, so the review step can show either the same way. */
export function customerInfoFromAddress(address: Address, email: string): CustomerInfo {
  return {
    fullName: address.name,
    email,
    phone: address.mobile,
    address: [address.line1, address.line2].filter(Boolean).join(", "),
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: "India",
  };
}

// Email is only collected from guests — a logged-in order's notifications go to the account's own email.
export function isCustomerInfoComplete(info: CustomerInfo, { requireEmail = true } = {}) {
  return Boolean(
    info.fullName.trim() &&
      (!requireEmail || info.email.trim()) &&
      info.phone.trim() &&
      info.address.trim() &&
      info.city.trim() &&
      info.state.trim() &&
      info.pincode.trim() &&
      info.country.trim(),
  );
}

const inputClass =
  "h-12 w-full rounded-lg border border-white/20 bg-transparent px-3 font-sans text-sm text-paper placeholder:text-paper/40 focus:border-white/50 focus:outline-none";
const labelClass = "font-sans text-xs tracking-[0.04em] text-paper/50 uppercase";

function SavedAddressPicker({
  addresses,
  choice,
  onChoose,
}: {
  addresses: Address[];
  choice: AddressChoice;
  onChoose: (choice: AddressChoice) => void;
}) {
  const optionClass = (selected: boolean) =>
    `flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors duration-200 ${
      selected ? "border-red bg-red/5" : "border-white/20 hover:border-white/40"
    }`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {addresses.map((a) => (
        <label key={a._id} className={optionClass(choice === a._id)}>
          <input
            type="radio"
            name="saved-address"
            checked={choice === a._id}
            onChange={() => onChoose(a._id)}
            className="mt-0.5 accent-red"
          />
          <span className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <span className="font-heading text-xs font-bold text-paper uppercase">{a.label}</span>
              {a.isDefault && (
                <span className="rounded-sm bg-red/20 px-1.5 py-0.5 font-heading text-[0.55rem] font-bold tracking-[0.06em] text-red uppercase">
                  Default
                </span>
              )}
            </span>
            <span className="font-sans text-xs leading-relaxed text-paper/70">
              {a.name}
              <br />
              {a.line1}
              {a.line2 && `, ${a.line2}`}
              <br />
              {a.city}, {a.state} - {a.pincode}
              <br />
              +91 {a.mobile}
            </span>
          </span>
        </label>
      ))}
      <label className={`${optionClass(choice === "new")} items-center`}>
        <input
          type="radio"
          name="saved-address"
          checked={choice === "new"}
          onChange={() => onChoose("new")}
          className="accent-red"
        />
        <span className="font-heading text-xs font-bold text-paper uppercase">+ Use a new address</span>
      </label>
    </div>
  );
}

export default function CustomerInfoStep({
  value,
  onChange,
  savedAddresses,
  addressChoice = "new",
  onAddressChoice,
  saveAddress,
  onSaveAddressChange,
}: {
  value: CustomerInfo;
  onChange: (value: CustomerInfo) => void;
  /** Logged-in customers only; omitted (or still loading) for guests. */
  savedAddresses?: Address[] | null;
  addressChoice?: AddressChoice;
  onAddressChoice?: (choice: AddressChoice) => void;
  saveAddress?: boolean;
  onSaveAddressChange?: (save: boolean) => void;
}) {
  const set = (field: keyof CustomerInfo) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: event.target.value });

  const isLoggedIn = savedAddresses !== undefined;
  const hasSaved = Boolean(savedAddresses?.length);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="m-0 font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
        Delivery Information
      </h2>

      {isLoggedIn && savedAddresses === null && (
        <p className="m-0 font-sans text-xs text-paper/40">Loading your saved addresses…</p>
      )}
      {hasSaved && onAddressChoice && (
        <SavedAddressPicker addresses={savedAddresses!} choice={addressChoice} onChoose={onAddressChoice} />
      )}

      {addressChoice === "new" && savedAddresses !== null && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!isLoggedIn && (
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={value.email}
                  onChange={set("email")}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={value.phone}
                onChange={set("phone")}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className={labelClass}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Recipient's full name"
              value={value.fullName}
              onChange={set("fullName")}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="address" className={labelClass}>
              Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="Flat, street, area"
              value={value.address}
              onChange={set("address")}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="city" className={labelClass}>
                City
              </label>
              <input id="city" type="text" value={value.city} onChange={set("city")} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="state" className={labelClass}>
                State
              </label>
              <input id="state" type="text" value={value.state} onChange={set("state")} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="pincode" className={labelClass}>
                Pincode
              </label>
              <input id="pincode" type="text" value={value.pincode} onChange={set("pincode")} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="country" className={labelClass}>
                Country
              </label>
              <input id="country" type="text" value={value.country} onChange={set("country")} className={inputClass} />
            </div>
          </div>

          {isLoggedIn && onSaveAddressChange && (
            <label className="flex items-center gap-2 font-sans text-xs text-paper/70">
              <input
                type="checkbox"
                checked={Boolean(saveAddress)}
                onChange={(e) => onSaveAddressChange(e.target.checked)}
                className="accent-red"
              />
              Save this address to my account for next time
            </label>
          )}
        </>
      )}
    </div>
  );
}
