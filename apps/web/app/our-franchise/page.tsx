import type { Metadata } from "next";
import ReelShowcase from "../components/ReelShowcase/ReelShowcase";
import RevealText from "../components/RevealText/RevealText";
import { DUMMY_REELS, getReels } from "../lib/reels";
import FranchiseSignup from "./FranchiseSignup";
import PhotoCollage from "./PhotoCollage";
import WhyWhatWho from "./WhyWhatWho";

export const metadata: Metadata = {
  title: "Our Franchise",
};

export default async function OurFranchisePage() {
  const reels = await getReels();

  return (
    <>
    <main className="overflow-hidden pt-16 pb-24 sm:pt-20">
      <section className="relative">
        <h1 className="relative z-10 m-0 mx-auto max-w-[14ch] px-4 text-center font-heading text-[clamp(2.25rem,7vw,5.5rem)] leading-[1.1] font-semibold text-paper">
          Bring Gokaido to your city/country
        </h1>

        <PhotoCollage />
      </section>

      {/* Placeholder copy (tracked in DUMMY_DATA.md) — swap for the client's franchise pitch. */}
      <section className="mt-[20%] px-4 sm:px-15 lg:px-20">
        <RevealText className="m-0 mx-auto max-w-290 font-heading text-xl leading-snug font-normal text-paper/50 sm:text-3xl lg:text-5xl [&_em]:text-red [&_em]:not-italic">
          Since <em>1975</em>, <em>GOKAIDO</em> has equipped martial artists with gear built on discipline and trust.
          Now we&rsquo;re inviting passionate partners to bring that legacy to their own city or country. As a{" "}
          <em>GOKAIDO franchise</em>, you get a proven brand, our complete range of martial arts equipment, and
          hands-on support with store setup, training and marketing &mdash; everything you need to build a{" "}
          <em>thriving business</em> in your community.
        </RevealText>
      </section>
    </main>
    <WhyWhatWho />
    <ReelShowcase reels={reels.length > 0 ? reels : DUMMY_REELS} />
    <FranchiseSignup />
    </>
  );
}
