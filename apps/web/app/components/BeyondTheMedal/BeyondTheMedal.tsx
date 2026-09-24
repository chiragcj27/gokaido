import Image from "next/image";

export interface BeyondTheMedalProps {
  /** Where "Share your story" goes (form, mailto, WhatsApp…). */
  ctaHref: string;
}

/**
 * Homepage "Beyond the Medal": a call for athletes to send in their story —
 * copy on the left, the medal artwork on the right. The quote and tagline
 * over the photo are baked into /beyond_medal.png (rounded corners too), so
 * the image is rendered as-is with no overlay of its own.
 */
export default function BeyondTheMedal({ ctaHref }: BeyondTheMedalProps) {
  return (
    <section className="w-full bg-black py-16 text-paper md:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div>
          <h2 className="m-0 font-heading font-bold uppercase leading-[1.02]">
            <span className="block text-[clamp(48px,6.4vw,88px)]">Beyond</span>
            <span className="block text-[clamp(32px,4.4vw,60px)]">the medal</span>
          </h2>

          <p className="mt-8 font-heading text-xl font-bold leading-snug md:mt-10 md:text-2xl">
            Every medal has a story.
            <br />
            Tell us yours.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed">
            Are you a national player, international medalist, champion or rising athlete? Share your journey with us.
            Your story could inspire thousands and become part of the story behind Gokaido.
          </p>

          <a
            href={ctaHref}
            className="mt-8 inline-block rounded-lg bg-[#333] px-6 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-[#444] md:mt-10"
          >
            Share your story
          </a>
        </div>

        <Image
          src="/beyond_medal.png"
          alt="Three medals in front of a karate athlete at sunset — “Behind every achievement lies discipline, sacrifice, and an unbreakable spirit.”"
          width={712}
          height={513}
          sizes="(min-width: 1152px) 600px, (min-width: 768px) 52vw, 100vw"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
