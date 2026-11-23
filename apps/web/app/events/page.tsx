import type { Metadata } from "next";
import { loadEvents } from "../lib/events";
import EventsScroller from "./EventsScroller";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Championships and tournaments Gokaido sponsors and supports, from the 8th WGKF World Goju Ryu Championship in Pune to national karate, boxing and taekwondo events.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await loadEvents();
  return (
    // Pulled up under the sticky navbar: the section is exactly one screen tall and pads
    // for the navbar itself, so in flow its bottom would sit off-screen until you scroll.
    <main className="-mt-(--navbar-h) bg-ink">
      <EventsScroller events={events} />
    </main>
  );
}
