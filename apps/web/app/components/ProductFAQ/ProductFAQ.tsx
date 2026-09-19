import AccordionItem from "../Accordion/AccordionItem";
import type { Faq } from "../../lib/dummyProduct";

export interface ProductFAQProps {
  faqs: Faq[];
}

export default function ProductFAQ({ faqs }: ProductFAQProps) {
  return (
    <section className="-mx-6 flex flex-col gap-10 bg-paper px-6 py-16 text-ink lg:-mx-10 lg:px-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="m-0 font-heading text-2xl font-bold text-ink">Frequently Asked Questions</h2>
        <p className="m-0 font-sans text-sm text-ink/55">You&apos;ve got questions, we&apos;ve got answers</p>
      </div>

      <div className="mx-auto w-full max-w-180">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} title={faq.question} theme="light">
            {faq.answer}
          </AccordionItem>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-ink/10 pt-8 text-center">
        <p className="m-0 font-sans text-sm text-ink/60">
          Do you have more questions about this product or need some recommendations?
        </p>
        <a
          href="/contact-us"
          className="flex h-13 items-center justify-center rounded-lg border border-ink bg-ink px-8 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-transparent hover:text-ink"
        >
          Contact Us
        </a>
      </div>
    </section>
  );
}
