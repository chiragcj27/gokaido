import type { Metadata } from "next";
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

const REASONS = [
  { lead: "Since 1975", rest: "decades of experience in martial arts uniforms and equipment." },
  { lead: "Quality & durability", rest: "products developed around performance and long-term use." },
  { lead: "Complete range", rest: "uniforms, belts, protective equipment, training gear, bags and accessories." },
  { lead: "Wide network", rest: "franchise presence across India and international markets." },
];

const EYEBROW = "m-0 font-heading text-xs font-bold tracking-[0.02em] text-red uppercase";
const LABEL = "font-sans text-sm text-paper uppercase";
const VALUE = "font-sans text-sm text-paper [&_a]:transition-colors [&_a:hover]:text-red";

export default function ContactUsPage() {
  return (
    <main className="mx-auto flex max-w-266 flex-col gap-24 px-4 pt-24 pb-24 sm:gap-28 sm:pt-40 sm:pb-32">
      <header className="flex flex-col gap-3">
        <h1 className="m-0 font-heading text-[clamp(2.25rem,6vw,3.5rem)] leading-tight font-semibold text-red">Contact Us</h1>
        <p className="m-0 font-sans text-base text-paper">
          We&rsquo;re here to assist with product enquiries, orders, pricing, franchise opportunities and support.
        </p>
        <p className={EYEBROW}>Since 1975</p>
      </header>

      <section aria-labelledby="contact-info-title" className="flex flex-col gap-6">
        <h2 id="contact-info-title" className={EYEBROW}>
          Contact information
        </h2>
        <dl className="m-0 flex flex-col gap-5">
          <div>
            <dt className={LABEL}>Email</dt>
            <dd className={`m-0 ${VALUE}`}>
              {EMAILS.map((email, i) => (
                <span key={email}>
                  {i > 0 && " / "}
                  <a href={`mailto:${email}`} className="break-all">
                    {email}
                  </a>
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className={LABEL}>Contact</dt>
            <dd className={`m-0 ${VALUE}`}>
              {PHONES.map((phone, i) => (
                <span key={phone.tel}>
                  {i > 0 && <span aria-hidden> &bull; </span>}
                  <a href={`tel:${phone.tel}`} className="whitespace-nowrap">
                    {phone.label}
                  </a>
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className={LABEL}>Address</dt>
            <dd className={`m-0 ${VALUE}`}>
              <address className="not-italic">{ADDRESS}</address>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="why-gokaido-title" className="flex flex-col gap-8">
        <h2 id="why-gokaido-title" className="m-0 font-heading text-[clamp(1.5rem,3vw,1.875rem)] font-semibold text-red uppercase">
          Why choose Gokaido?
        </h2>
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {REASONS.map((r) => (
            <li key={r.lead} className="font-sans text-[0.9375rem] text-paper">
              {r.lead} &mdash; {r.rest}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="enquiry-title" className="flex flex-col gap-10">
        <h2 id="enquiry-title" className="m-0 font-sans text-[clamp(1.375rem,3vw,2rem)] leading-tight font-medium text-paper uppercase">
          Send us an enquiry for pricelist / franchise
        </h2>
        <div className="w-full max-w-md rounded-xl border border-paper/30 bg-panel p-4 sm:p-5">
          {/* Placeholder copy (tracked in DUMMY_DATA.md). */}
          <EnquiryForm
            intro="Tell us what you’re looking for and our team will get back to you with pricing or franchise details."
            thanks="We’ve got your enquiry. Our team will be in touch soon."
          />
        </div>
      </section>
    </main>
  );
}
