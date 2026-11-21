import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEvents, type GokaidoEvent } from "../../lib/events";
import EventGallery from "./EventGallery";

// /events/{slug} — one event's full photo gallery, opened from any photo on /events.
// Layout after huyml.co's project pages: sticky details on the left, the photos in one
// tall column, a minimap on the right, the event name in oversized type over the first
// screen, and "Next event" at the end.

type Params = { slug: string };

const pad = (n: number) => String(n).padStart(2, "0");

async function findEvent(slug: string) {
  const events = await loadEvents();
  const index = events.findIndex((e) => e.slug === slug);
  return { events, index, event: index >= 0 ? events[index] : undefined };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await findEvent(slug);
  if (!event) return { title: "Event not found" };
  const description = event.about.length > 160 ? `${event.about.slice(0, 157).trimEnd()}…` : event.about;
  return {
    title: event.name,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.name,
      description,
      images: event.images[0] ? [{ url: event.images[0].src, alt: event.images[0].alt }] : undefined,
    },
  };
}

function Meta({ event }: { event: GokaidoEvent }) {
  const rows: [string, string | undefined][] = [
    ["Event place", event.place],
    ["Sport", event.sport],
    ["Recognition", event.recognition],
    ["Hosted by", event.hostedBy],
  ];
  return (
    <dl className="m-0 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-6 text-xs leading-snug">
      <dt className="text-[11px] text-paper/45">About</dt>
      <dd className="m-0 text-[13px] leading-relaxed text-paper">{event.about}</dd>

      {/* Year + dates side by side, like the reference's Role / Launch pair. */}
      <dt className="text-[11px] text-paper/45">Year</dt>
      <dd className="m-0 flex flex-wrap gap-x-8 gap-y-1 text-paper">
        <span>{event.year}</span>
        {event.dates && (
          <span>
            <span className="mr-3 text-[11px] text-paper/45">Dates</span>
            {event.dates}
          </span>
        )}
      </dd>

      {rows
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[11px] text-paper/45">{label}</dt>
            <dd className="m-0 text-paper">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export default async function EventPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { events, index, event } = await findEvent(slug);
  if (!event) notFound();
  const next = events.length > 1 ? events[(index + 1) % events.length] : null;

  const title = (
    <h1 className="m-0 font-heading text-[clamp(2.5rem,5.5vw,6.25rem)] leading-[0.9] font-extrabold tracking-tight text-balance text-red uppercase">
      {event.name}
    </h1>
  );

  return (
    <main className="relative bg-ink">
      {/* Oversized name over the bottom of the first screen (desktop), as on the reference. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-[calc(100svh-var(--navbar-h))] lg:block">
        <div className="absolute right-10 bottom-8 left-[calc(33%+1rem)] max-w-384">{title}</div>
      </div>

      <div className="mx-auto max-w-384 px-4 pt-[calc(var(--navbar-h)+1.25rem)] sm:px-8 lg:px-10">
        {/* Top strip */}
        <div className="flex items-start justify-between gap-6 text-[11px]">
          <Link href={`/events#${event.slug}`} className="text-paper hover:text-gold">
            ← All events
          </Link>
          <span className="text-paper/50">
            Event <span className="text-paper">{pad(index + 1)}</span> / {pad(events.length)}
          </span>
          <p className="m-0 text-paper/50">
            For enquiries
            <Link href="/contact-us" className="ml-3 text-paper underline underline-offset-4 hover:text-gold">
              Contact us
            </Link>
          </p>
        </div>

        {/* Mobile title, in flow */}
        <div className="mt-10 lg:hidden">{title}</div>

        <div className="mt-10 grid gap-10 pb-24 lg:mt-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,0.55fr)] lg:gap-12">
          {/* Left: sticky details */}
          <aside className="flex flex-col lg:sticky lg:top-[calc(var(--navbar-h)+1.5rem)] lg:h-[calc(100svh-var(--navbar-h)-3rem)] lg:self-start lg:pt-[18vh]">
            <Meta event={event} />
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 self-start font-heading text-lg text-paper underline underline-offset-4 hover:text-gold lg:ml-30"
              >
                Visit event site →
              </a>
            )}
            <span className="mt-auto hidden pt-10 text-[11px] text-paper/50 lg:block">Scroll</span>
          </aside>

          {/* Centre: photos · Right: minimap — EventGallery renders both grid cells. */}
          <EventGallery images={event.images} name={event.name} />
        </div>
      </div>

      {next && (
        <section className="flex min-h-[70svh] flex-col items-center justify-center border-t border-paper/10 px-4 py-24 text-center">
          <span className="text-[11px] text-paper/70">Next event</span>
          <Link
            href={`/events/${next.slug}`}
            className="mt-6 font-heading text-[clamp(2.5rem,8vw,8rem)] leading-[0.9] font-extrabold tracking-tight text-balance text-red uppercase transition-colors hover:text-gold"
          >
            {next.name}
          </Link>
          <span className="mt-6 text-[11px] text-paper/50">
            {next.year}
            {next.category ? ` · ${next.category}` : ""}
          </span>
        </section>
      )}
    </main>
  );
}
