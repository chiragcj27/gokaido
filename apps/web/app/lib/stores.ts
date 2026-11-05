import { apiGet } from "./pdp/api";

export interface Store {
  id: string;
  city: string;
  name: string;
  address: string;
  hours: string | null;
  phone: string | null;
  image: string | null;
  directionsUrl: string | null;
  isHeadOffice: boolean;
}

interface ApiStore {
  _id: string;
  city: string;
  name: string;
  address: string;
  hours?: string;
  phone?: string;
  image?: string;
  directionsUrl?: string;
  isHeadOffice?: boolean;
}

/** The admin's Google Maps link, or a Maps search on the store's name + address when none is set. */
export function directionsHref(store: Pick<Store, "name" | "address" | "directionsUrl">): string {
  return (
    store.directionsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`
  );
}

// 5 min cache, tagged "stores" — same TTL/no-purge-route situation as
// getHomepageSettings. Empty list on failure, which
// hides the section (StoreLocator renders nothing for an empty list).
export async function getStores(): Promise<Store[]> {
  try {
    const { stores } = await apiGet<{ stores: ApiStore[] }>("/stores", { revalidate: 300, tags: ["stores"] });
    if (!Array.isArray(stores)) return [];
    return stores.map((s) => ({
      id: s._id,
      city: s.city,
      name: s.name,
      address: s.address,
      hours: s.hours ?? null,
      phone: s.phone ?? null,
      image: s.image ?? null,
      directionsUrl: s.directionsUrl ?? null,
      isHeadOffice: s.isHeadOffice ?? false,
    }));
  } catch {
    return [];
  }
}
