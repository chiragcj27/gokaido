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

export function isCustomerInfoComplete(info: CustomerInfo) {
  return Boolean(
    info.fullName.trim() &&
      info.email.trim() &&
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

export default function CustomerInfoStep({
  value,
  onChange,
}: {
  value: CustomerInfo;
  onChange: (value: CustomerInfo) => void;
}) {
  const set = (field: keyof CustomerInfo) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: event.target.value });

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="m-0 font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
        Delivery Information
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    </div>
  );
}
