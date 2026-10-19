import AccordionItem from "../Accordion/AccordionItem";
import type { Faq } from "../../lib/dummyProduct";

export interface ProductFAQProps {
  faqs: Faq[];
  /** Render dark below `lg` (the product page's mobile design); light everywhere otherwise. */
  darkOnMobile?: boolean;
}

export default function ProductFAQ({ faqs, darkOnMobile = false }: ProductFAQProps) {
  const dm = darkOnMobile;

  return (
    <section
      className={`-mx-6 flex flex-col gap-10 bg-[#CCCCCC] px-6 py-16 text-ink lg:-mx-10 lg:px-10 ${
        dm ? "max-lg:mx-0 max-lg:gap-6 max-lg:bg-transparent max-lg:px-0 max-lg:py-0 max-lg:text-paper" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h2
          className={`m-0 font-heading text-2xl font-bold text-ink ${
            dm ? "max-lg:text-lg max-lg:font-normal max-lg:text-paper" : ""
          }`}
        >
          Frequently Asked Questions
        </h2>
        <p className={`m-0 font-sans text-sm text-ink/55 ${dm ? "max-lg:hidden" : ""}`}>
          You&apos;ve got questions, we&apos;ve got answers
        </p>
      </div>

      <div className="mx-auto w-full max-w-180">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} title={faq.question} theme={dm ? "darkMobile" : "light"}>
            {faq.answer}
          </AccordionItem>
        ))}
      </div>

      <div
        className={`flex flex-col items-center gap-4 border-t border-ink/10 pt-8 text-center ${
          dm ? "max-lg:mt-10 max-lg:border-0 max-lg:pt-0" : ""
        }`}
      >
        <p className={`m-0 font-sans text-sm text-ink/60 ${dm ? "max-lg:hidden" : ""}`}>
          Do you have more questions about this product or need some recommendations?
        </p>
        {dm && <p className="m-0 font-heading text-lg font-light text-paper/80 lg:hidden">Do you have more questions ?</p>}
        <a
          href="/contact-us"
          className={`flex h-13 items-center justify-center rounded-lg border border-ink bg-ink px-8 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-transparent hover:text-ink ${
            dm
              ? "max-lg:h-10 max-lg:w-63 max-lg:rounded-none max-lg:border-paper/80 max-lg:bg-transparent max-lg:text-sm max-lg:font-semibold max-lg:tracking-normal max-lg:normal-case max-lg:hover:bg-paper"
              : ""
          }`}
        >
          Contact Us
        </a>
      </div>
    </section>
  );
}
