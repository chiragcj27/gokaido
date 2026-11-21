import { apiGet } from "./pdp/api";
import { DUMMY_EVENTS } from "./fallbacks";

export type EventImage = { src: string; alt: string };

// View-model for the /events scroller. Managed in Admin → Events.
export type GokaidoEvent = {
  id: string;
  /** /events/{slug} */
  slug: string;
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
  /** External "Visit event site" link on the detail page. */
  link?: string;
  /** First image is the cover; up to two more fan out behind it; all of them make the detail gallery. */
  images: EventImage[];
};

interface ApiEvent {
  _id: string;
  name: string;
  slug: string;
  year: string;
  category?: string;
  about: string;
  dates?: string;
  place: string;
  sport: string;
  recognition?: string;
  hostedBy?: string;
  link?: string;
  images?: string[];
}

// 5 min cache, tagged "events" — same TTL / no-purge-route situation as getStores.
// Empty list on failure — pages go through loadEvents(), which falls back to DUMMY_EVENTS.
export async function getEvents(): Promise<GokaidoEvent[]> {
  try {
    const { events } = await apiGet<{ events: ApiEvent[] }>("/events", { revalidate: 300, tags: ["events"] });
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.images && e.images.length > 0)
      .map((e) => ({
        id: e._id,
        slug: e.slug,
        year: e.year,
        category: e.category ?? null,
        name: e.name,
        about: e.about,
        dates: e.dates,
        place: e.place,
        sport: e.sport,
        recognition: e.recognition,
        hostedBy: e.hostedBy,
        link: e.link,
        images: (e.images ?? []).map((src, i) => ({ src, alt: `${e.name} — photo ${i + 1}` })),
      }));
  } catch {
    return [];
  }
}

/**
 * The list both /events and /events/{slug} render: Admin → Events, or the placeholders
 * (lib/fallbacks.ts, tracked in DUMMY_DATA.md) while the API is down or empty — so dummy
 * detail pages resolve exactly when the dummy list is showing, and 404 once real events exist.
 */
export async function loadEvents(): Promise<GokaidoEvent[]> {
  const fetched = await getEvents();
  return fetched.length > 0 ? fetched : DUMMY_EVENTS;
}
