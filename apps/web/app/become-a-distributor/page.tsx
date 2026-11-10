import type { Metadata } from "next";
import RevealText from "../components/RevealText/RevealText";
import FranchiseSignup from "./FranchiseSignup";
import PhotoCollage from "./PhotoCollage";
import WhyWhatWho from "./WhyWhatWho";

export const metadata: Metadata = {
  title: "Become a Distributor",
};

export default function BecomeADistributorPage() {
  return (
    <>
    <main className="overflow-hidden pt-16 pb-24 sm:pt-20">
      <section className="relative">
        <h1 className="relative z-10 m-0 mx-auto max-w-[14ch] px-4 text-center font-heading text-[clamp(2.25rem,7vw,5.5rem)] leading-[1.1] font-semibold text-paper">
          Bring Gokaido to your city/country
        </h1>

        <PhotoCollage />
      </section>

      <section className="mt-[20%] px-4 sm:px-15 lg:px-20">
        <RevealText className="m-0 mx-auto max-w-290 text-center font-heading text-xl leading-snug font-normal text-paper/50 sm:text-3xl lg:text-5xl [&_em]:text-red [&_em]:not-italic">
          To become the <em>most trusted</em> and <em>technologically advanced</em> martial arts brand, bridging{" "}
          <em>tradition</em> with <em>innovation</em> and supporting the growth of the global martial arts community.
        </RevealText>
      </section>
    </main>
    <WhyWhatWho />
    <FranchiseSignup />
    </>
  );
}
