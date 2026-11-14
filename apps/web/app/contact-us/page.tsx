import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import EnquiryForm from "../components/EnquiryForm/EnquiryForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Gokaido for product enquiries, orders, pricing, franchise opportunities and support.",
};

const EMAILS = ["gikaido@gmail.com", "gokaidoorders@gmail.com"];
const PHONES = [
  { label: "+91-22-23859074", tel: "+912223859074" },
  { label: "+91-9820585200", tel: "+919820585200" },
];
const ADDRESS = "136-B, Deccean Chembers Bldg, J.S.S. Road, Near Majestic Shopping Centre, Mumbai - 400 004, India";
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
// Placeholder target (tracked in DUMMY_DATA.md) until the client says where collaboration requests should go.
const COLLABORATE_HREF = `mailto:${EMAILS[0]}?subject=${encodeURIComponent("Creator & Athlete Collaboration")}`;

/** Icon files are the design's own exports; width/height are each SVG's native size. */
interface Icon {
  src: string;
  width: number;
  height: number;
}

const ICONS = {
  bag: { src: "/contact/icon-bag.svg", width: 14.6843, height: 17.25 },
  store: { src: "/contact/icon-store.svg", width: 22, height: 22 },
  globe: { src: "/contact/icon-globe.svg", width: 17.7083, height: 18.019 },
  support: { src: "/contact/icon-support.svg", width: 22, height: 22 },
  mail: { src: "/contact/icon-mail.svg", width: 20, height: 20 },
  phone: { src: "/contact/icon-phone.svg", width: 20, height: 20 },
  pin: { src: "/contact/icon-pin.svg", width: 20, height: 20 },
} satisfies Record<string, Icon>;

const ENQUIRY_TYPES = [
  { icon: ICONS.bag, title: "Product Enquiries:", body: "For product information, bulk orders, and availability." },
  { icon: ICONS.store, title: "Franchise Opportunities:", body: "For information on bringing the brand to your city." },
  { icon: ICONS.globe, title: "Export & International Business:", body: "For distribution, exports, and global partnerships." },
  { icon: ICONS.support, title: "Customer Support:", body: "For order assistance and after-sales support." },
];

const REASONS = [
  { lead: "Since 1975", rest: "Decades of experience in martial arts uniforms and equipment." },
  { lead: "Quality & durability", rest: "Products developed around performance and long-term use." },
  { lead: "Complete range", rest: "Uniforms, belts, protective equipment, training gear, bags and accessories." },
  { lead: "Wide network", rest: "Franchise presence across India and international markets." },
];

const FOUNDER_NOTE = [
  "When I look at Gokaido today, I feel proud of how far we have come. What started as a small dream in 1975 has become a family legacy that I am honoured to carry forward.",
  "Over the years, your trust, support, and love have given us the strength to keep growing. Every coach who trusted us, every athlete who wore our uniform, and every person who stood by us has become a part of our story.",
  "From my family to yours, thank you for being a part of the Gokaido journey. We have come a long way, but there is still so much more to achieve.",
];
const FOUNDER_SIGN_OFF = ["With heartfelt gratitude,", "The Gokaido Family", "Made to Change the Game."];

const CONTAINER = "mx-auto max-w-360 px-4 sm:px-15 lg:px-20";
const EYEBROW = "m-0 font-heading text-[13px] font-bold tracking-[0.08em] text-red uppercase";
const H1 = "m-0 font-heading text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05] font-extrabold text-paper uppercase";
const LINK = "transition-colors hover:text-red focus-visible:text-red";
const CARD =
  "flex flex-col gap-5 rounded-xl border border-paper/15 bg-panel p-6 transition-colors duration-300 hover:border-red/70 sm:p-7";

function IconBadge({ icon }: { icon: Icon }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red/15">
      <Image src={icon.src} alt="" width={icon.width} height={icon.height} />
    </span>
  );
}

function ContactCard({ icon, title, children }: { icon: Icon; title: string; children: ReactNode }) {
  return (
    <div className={CARD}>
      <IconBadge icon={icon} />
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-heading text-sm font-bold tracking-[0.06em] text-paper uppercase">{title}</h3>
        <div className="font-sans text-[0.9375rem] leading-relaxed text-paper/70">{children}</div>
      </div>
    </div>
  );
}

export default function ContactUsPage() {
  return (
    <>
      <main className={`${CONTAINER} flex flex-col gap-16 pt-20 pb-24 sm:pt-28 sm:pb-32`}>
        <header className="flex flex-col gap-4">
          <p className={EYEBROW}>Every Great Move Starts With a Conversation.</p>
          <h1 className={`${H1} flex flex-wrap items-center gap-x-4 gap-y-2`}>
            <span>Contact</span>
            <Image
              src="/gokaido-wordmark.png"
              alt="Gokaido"
              width={2718}
              height={600}
              priority
              sizes="(min-width: 640px) 335px, 60vw"
              className="h-auto w-[clamp(10rem,23vw,20.9rem)]"
            />
          </h1>
          <p className="m-0 max-w-4xl font-sans text-base leading-relaxed text-paper/60">
            From individual practitioners to academies, distributors and sporting organisations, we&rsquo;re always
            open to meaningful conversations.
          </p>

          <ul className="m-0 mt-2 grid list-none gap-4 p-0 sm:grid-cols-2">
            {ENQUIRY_TYPES.map((t) => (
              <li key={t.title} className={CARD}>
                <IconBadge icon={t.icon} />
                <div className="flex flex-col gap-3 pt-5">
                  <h2 className="m-0 font-heading text-lg leading-7 font-semibold text-paper uppercase">{t.title}</h2>
                  <p className="m-0 font-sans text-[0.9375rem] leading-relaxed text-paper/60">{t.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </header>

        <section aria-labelledby="contact-info-title">
          <h2 id="contact-info-title" className="sr-only">
            Contact information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <ContactCard icon={ICONS.mail} title="Email us">
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {EMAILS.map((email) => (
                  <li key={email}>
                    <a href={`mailto:${email}`} className={`break-all ${LINK}`}>
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </ContactCard>

            <ContactCard icon={ICONS.phone} title="Call us">
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {PHONES.map((phone) => (
                  <li key={phone.tel}>
                    <a href={`tel:${phone.tel}`} className={`whitespace-nowrap ${LINK}`}>
                      {phone.label}
                    </a>
                  </li>
                ))}
              </ul>
            </ContactCard>

            <ContactCard icon={ICONS.pin} title="Visit us">
              <address className="not-italic">{ADDRESS}</address>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-heading text-xs font-bold tracking-[0.06em] text-red uppercase transition-colors hover:text-paper"
              >
                Get directions <span aria-hidden>&rarr;</span>
              </a>
            </ContactCard>
          </div>
        </section>

        <div className="grid items-start gap-16 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-20">
          <section aria-labelledby="why-gokaido-title" className="flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <p className={EYEBROW}>Why us</p>
              <h2
                id="why-gokaido-title"
                className="m-0 font-heading text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight font-extrabold text-paper uppercase"
              >
                Why choose <span className="text-red">Gokaido?</span>
              </h2>
            </div>
            <ol className="m-0 grid list-none gap-x-10 gap-y-10 p-0 sm:grid-cols-2">
              {REASONS.map((r, i) => (
                <li key={r.lead} className="flex flex-col gap-3 border-t border-paper/15 pt-5">
                  <span className="font-heading text-4xl font-light text-red">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="m-0 font-heading text-lg font-semibold text-paper uppercase">{r.lead}</h3>
                  <p className="m-0 font-sans text-[0.9375rem] leading-relaxed text-paper/60">{r.rest}</p>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="enquiry-title"
            className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--navbar-h)+2rem)]"
          >
            <div className="flex flex-col gap-2">
              <p className={EYEBROW}>Pricelist / Franchise</p>
              <h2
                id="enquiry-title"
                className="m-0 font-heading text-[clamp(1.5rem,3vw,2rem)] leading-tight font-extrabold text-paper uppercase"
              >
                Send us an enquiry
              </h2>
            </div>
            <div className="rounded-xl border border-paper/20 bg-panel p-4 shadow-[0_0_80px_-20px] shadow-red/30 sm:p-6">
              <EnquiryForm
                intro="Tell us what you’re looking for and our team will get back to you with pricing or franchise details."
                thanks="We’ve got your enquiry. Our team will be in touch soon."
              />
            </div>
          </section>
        </div>
      </main>

      <section aria-labelledby="collaborate-title" className="px-2.5">
        <div className="relative isolate mx-auto flex min-h-[22rem] max-w-[98.75rem] flex-col items-center justify-center gap-6 overflow-hidden rounded-[10px] px-4 py-16 text-center sm:min-h-108 sm:gap-9.5">
          <Image
            src="/contact/collaboration-bg.png"
            alt=""
            fill
            sizes="100vw"
            className="-z-10 object-cover object-[50%_14%]"
          />
          {/* The design's two stacked tints: black 20% on the photo, warm brown 20% on top. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-black/20" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[rgb(16_11_6/0.2)]" />

          <div className="flex flex-col items-center gap-1 uppercase">
            <h2
              id="collaborate-title"
              className="m-0 font-heading text-[clamp(1.5rem,3.5vw,3rem)] leading-[1.575] font-extrabold text-paper"
            >
              Creator &amp; Athlete Collaboration
            </h2>
            <p className="m-0 font-heading text-[clamp(0.875rem,1.4vw,1.25rem)] leading-snug font-bold tracking-[0.05em] text-white">
              Love martial arts? Want to be a part of Gokaido?
            </p>
          </div>

          <a
            href={COLLABORATE_HREF}
            className="inline-flex h-14 w-full max-w-[24rem] items-center justify-center rounded-[10px] border-[1.6px] border-[#c10e12] bg-[#c10e12] font-heading text-xl font-semibold tracking-[-0.02em] text-white uppercase transition-colors hover:bg-[#a00b0f] sm:h-18 sm:text-[26px]"
          >
            Let&rsquo;s Collaborate
          </a>
        </div>
      </section>

      <section aria-labelledby="founder-note-title" className={`${CONTAINER} flex flex-col gap-4 pt-24 pb-24 sm:pt-40`}>
        <p className={EYEBROW}>Note from the founder</p>
        <h2 id="founder-note-title" className={H1}>
          A Heartfelt Thank You
        </h2>
        <div className="mt-6 flex max-w-[77.75rem] flex-col gap-[26px] font-sans text-base leading-[26px] text-white sm:text-xl">
          {FOUNDER_NOTE.map((p) => (
            <p key={p} className="m-0">
              {p}
            </p>
          ))}
          <p className="m-0">
            {FOUNDER_SIGN_OFF.map((line, i) => (
              <span key={line} className={i === FOUNDER_SIGN_OFF.length - 1 ? "italic" : undefined}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        </div>
      </section>
    </>
  );
}
