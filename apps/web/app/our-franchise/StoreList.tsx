import Image from "next/image";
import { directionsHref, type Store } from "../lib/stores";

const SMALL_CAPS = "font-sans text-[13px] leading-[13px] font-medium text-white uppercase";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Every active store from Admin → Stores, in its display order: city (with a
 * "Head office" tag where flagged), address, a Google Maps link and the phone.
 * Desktop is the design's three-column table; phones stack each store.
 */
export default function StoreList({ stores }: { stores: Store[] }) {
  return (
    <section aria-labelledby="store-list-title" className="px-4 pt-20 sm:px-10 lg:px-[7%]">
      <h2 id="store-list-title" className="sr-only">
        Gokaido stores
      </h2>
      <ul className="m-0 list-none border-t-[0.8px] border-dashed border-[rgba(193,14,18,0.3)] p-0">
        {stores.map((store) => (
          <li
            key={store.id}
            className="grid gap-x-4 gap-y-3 border-b-[0.8px] border-dashed border-[rgba(193,14,18,0.3)] py-6 lg:grid-cols-[38fr_42.7fr_19.3fr] lg:gap-y-0 lg:py-[0.94rem]"
          >
            <h3 className="m-0 font-heading text-[clamp(1.75rem,2.8vw,2.667rem)] leading-[36px] font-normal tracking-[-0.02em] text-white uppercase">
              {store.city}
              {store.isHeadOffice && (
                <span className="ml-[0.6em] align-baseline text-[clamp(0.875rem,1.3vw,1.25rem)]">Head office</span>
              )}
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <address className="m-0 max-w-[335px] font-sans text-base leading-[17px] tracking-[-0.36px] text-white not-italic">
                {store.address}
              </address>
              <a
                href={directionsHref(store)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${SMALL_CAPS} group flex shrink-0 items-center gap-3 pt-1 transition-colors hover:text-[#c10e12] focus-visible:text-[#c10e12]`}
                aria-label={`Directions to Gokaido ${store.city} on Google Maps`}
              >
                <Image
                  src="/our-franchise/directions-arrow.svg"
                  alt=""
                  width={23}
                  height={15}
                  className="transition-transform group-hover:translate-x-1"
                />
                Directions
              </a>
            </div>

            {store.phone && (
              <p className={`${SMALL_CAPS} m-0 flex gap-3 pt-1 lg:justify-end`}>
                <span>Phone no.</span>
                <a href={telHref(store.phone)} className="transition-colors hover:text-[#c10e12] focus-visible:text-[#c10e12]">
                  {store.phone}
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
