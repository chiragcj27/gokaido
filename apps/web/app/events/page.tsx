import type { Metadata } from "next";
import { getEvents } from "../lib/events";
import { DUMMY_EVENTS } from "../lib/fallbacks";
import EventsScroller from "./EventsScroller";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Championships and tournaments Gokaido sponsors and supports, from the 8th WGKF World Goju Ryu Championship in Pune to national karate, boxing and taekwondo events.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const fetched = await getEvents();
  // Events come from Admin → Events; placeholders stand in while the API is
  // down or empty (tracked in DUMMY_DATA.md).
  const events = fetched.length > 0 ? fetched : DUMMY_EVENTS;
  return (
    <main className="bg-ink">
      <EventsScroller events={events} />
    </main>
  );
}
