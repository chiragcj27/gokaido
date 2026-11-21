import { apiGet } from "./pdp/api";

export type EventImage = { src: string; alt: string };

// View-model for the /events scroller. Managed in Admin → Events.
export type GokaidoEvent = {
  id: string;
  /** Small label over the name, e.g. "2026". */
  year: string;
  /** Kind of event, shown beside the year, e.g. "World Championship". */
  category: string | null;
  name: string;
  /** "About event" paragraph in the right-hand list. */
  about: string;
  /** Human-readable date range, e.g. "5–10 October 2026". */
  dates?: string;
  /** "Event place" — venue / city. */
  place: string;
  sport: string;
  /** Gokaido's role or the event's recognition, e.g. "Official sponsor". */
  recognition?: string;
  hostedBy?: string;
  /** First image is the cover; up to two more fan out behind it. */
  images: EventImage[];
};

interface ApiEvent {
  _id: string;
  name: string;
  year: string;
  category?: string;
  about: string;
  dates?: string;
  place: string;
  sport: string;
  recognition?: string;
  hostedBy?: string;
  images?: string[];
}

// 5 min cache, tagged "events" — same TTL / no-purge-route situation as getStores.
// Empty list on failure; the page then shows DUMMY_EVENTS (lib/fallbacks.ts).
export async function getEvents(): Promise<GokaidoEvent[]> {
  try {
    const { events } = await apiGet<{ events: ApiEvent[] }>("/events", { revalidate: 300, tags: ["events"] });
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.images && e.images.length > 0)
      .map((e) => ({
        id: e._id,
        year: e.year,
        category: e.category ?? null,
        name: e.name,
        about: e.about,
        dates: e.dates,
        place: e.place,
        sport: e.sport,
        recognition: e.recognition,
        hostedBy: e.hostedBy,
        images: (e.images ?? []).map((src, i) => ({ src, alt: `${e.name} — photo ${i + 1}` })),
      }));
  } catch {
    return [];
  }
}
