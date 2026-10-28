import type { Metadata } from "next";
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

const REASONS = [
  { lead: "Since 1975", rest: "Decades of experience in martial arts uniforms and equipment." },
  { lead: "Quality & durability", rest: "Products developed around performance and long-term use." },
  { lead: "Complete range", rest: "Uniforms, belts, protective equipment, training gear, bags and accessories." },
  { lead: "Wide network", rest: "Franchise presence across India and international markets." },
];

const EYEBROW = "m-0 font-heading text-[13px] font-bold tracking-[0.08em] text-red uppercase";
const LINK = "transition-colors hover:text-red focus-visible:text-red";

const ICON_PROPS = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-5",
} as const;

const MailIcon = () => (
  <svg {...ICON_PROPS}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const PhoneIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
);

const PinIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

function ContactCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="group flex flex-col gap-5 rounded-xl border border-paper/15 bg-panel p-6 transition-colors duration-300 hover:border-red/70 sm:p-7">
      <span className="grid size-11 place-items-center rounded-full bg-red/15 text-red transition-colors duration-300 group-hover:bg-red group-hover:text-paper">
        {icon}
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-heading text-sm font-bold tracking-[0.06em] text-paper uppercase">{title}</h3>
        <div className="font-sans text-[0.9375rem] leading-relaxed text-paper/70">{children}</div>
      </div>
    </div>
  );
}

export default function ContactUsPage() {
  return (
    <main className="mx-auto flex max-w-360 flex-col gap-20 px-4 pt-20 pb-24 sm:gap-28 sm:px-15 sm:pt-28 sm:pb-32 lg:px-20">
      <header className="flex flex-col gap-4">
        <p className={EYEBROW}>Get in touch &middot; Since 1975</p>
        <h1 className="m-0 font-heading text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05] font-extrabold uppercase">
          <span className="block text-paper">Contact</span>
          <span className="block text-red">Gokaido</span>
        </h1>
        <p className="m-0 max-w-xl font-sans text-base leading-relaxed text-paper/60">
          We&rsquo;re here to assist with product enquiries, orders, pricing, franchise opportunities and support.
        </p>
      </header>

      <section aria-labelledby="contact-info-title" className="flex flex-col gap-6">
        <h2 id="contact-info-title" className="sr-only">
          Contact information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <ContactCard icon={<MailIcon />} title="Email us">
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

          <ContactCard icon={<PhoneIcon />} title="Call us">
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

          <ContactCard icon={<PinIcon />} title="Visit us">
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
            <h2 id="why-gokaido-title" className="m-0 font-heading text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight font-extrabold text-paper uppercase">
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
            <h2 id="enquiry-title" className="m-0 font-heading text-[clamp(1.5rem,3vw,2rem)] leading-tight font-extrabold text-paper uppercase">
              Send us an enquiry
            </h2>
          </div>
          <div className="rounded-xl border border-paper/20 bg-panel p-4 shadow-[0_0_80px_-20px] shadow-red/30 sm:p-6">
            {/* Placeholder copy (tracked in DUMMY_DATA.md). */}
            <EnquiryForm
              intro="Tell us what you’re looking for and our team will get back to you with pricing or franchise details."
              thanks="We’ve got your enquiry. Our team will be in touch soon."
            />
          </div>
        </section>
      </div>
    </main>
  );
}
