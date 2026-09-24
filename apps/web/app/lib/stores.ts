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
}

// 5 min cache, tagged "stores" — same TTL/no-purge-route situation as
// getHomepageSettings. Empty list on failure; the homepage then shows its
// dummy stores instead of a broken section.
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
    }));
  } catch {
    return [];
  }
}
