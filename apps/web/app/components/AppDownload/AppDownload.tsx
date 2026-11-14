import Image from "next/image";

export interface AppDownloadProps {
  playStoreUrl: string;
  appStoreUrl: string;
}

// /app-download-mobile.png is the mobile art: mascot beside the three phones on the
// rock, composed tighter (near-square) so it fills the phone width.
const MOBILE_ART_W = 856;
const MOBILE_ART_H = 688;

// /app-download-mascot.png is the desktop art (mascot, phones, belt, rock), trimmed
// to its content on black. The belt runs off its right edge, so it sits flush right
// and that edge is faded once the capped container stops reaching the viewport edge.
const DESKTOP_ART_W = 1200;
const DESKTOP_ART_H = 515;

// /gokaido-wordmark.png is the GOKAIDO wordmark from the footer logo (2718×600).
const WORDMARK_W = 2718;
const WORDMARK_H = 600;

// Same store badges as the footer (/footer/app-badge-*.png, 300×90).
function StoreBadges({ playStoreUrl, appStoreUrl, className }: AppDownloadProps & { className: string }) {
  const badgeClass =
    "block w-full transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-90";
  return (
    <div className={className}>
      <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" className={badgeClass}>
        <img src="/footer/app-badge-google-play.png" alt="Get it on Google Play" className="block h-auto w-full rounded-sm" />
      </a>
      <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store" className={badgeClass}>
        <img src="/footer/app-badge-app-store.png" alt="Download on the App Store" className="block h-auto w-full rounded-sm" />
      </a>
    </div>
  );
}

// On desktop the copy + store badges sit on the left with the banner art to their
// right. Sizes are in cqw so everything scales together. Below `md` there's no room
// for both side by side, so the copy sits above the mascot + phones art, with the
// badges underneath.
// Store URLs come in as props — placeholders until the real links are supplied.
export default function AppDownload({ playStoreUrl, appStoreUrl }: AppDownloadProps) {
  const copy = (
    <>
      <h2 className="m-0 font-heading text-[8.5vw] leading-[1.05] font-black tracking-[-0.03em] text-paper uppercase md:text-[4.4cqw]">
        <span className="flex items-center gap-[0.25em]">
          THE
          <Image
            src="/gokaido-wordmark.png"
            alt="Gokaido"
            width={WORDMARK_W}
            height={WORDMARK_H}
            sizes="(min-width: 768px) 22vw, 50vw"
            className="h-auto w-[5.5em] max-w-none"
          />
        </span>
        EXPERIENCE,
        <br />
        UNLOCKED.
      </h2>
      <p className="m-0 mt-3 text-base text-paper md:mt-[2.4cqw] md:text-[1.2cqw]">
        Your martial arts essentials, <br className="md:hidden" />
        now easier to access than ever.
      </p>
    </>
  );

  return (
    <section className="relative w-full bg-black">
      <div
        className="relative mx-auto hidden w-full max-w-[1600px] md:block"
        style={{ aspectRatio: "100 / 46", containerType: "inline-size" }}
      >
        <Image
          src="/app-download-mascot.png"
          alt="The Gokaido mascot beside the Gokaido app on three phones"
          width={DESKTOP_ART_W}
          height={DESKTOP_ART_H}
          sizes="(min-width: 1600px) 960px, 60vw"
          className="absolute top-1/2 right-0 h-auto w-[60cqw] -translate-y-1/2 min-[1600px]:mask-[linear-gradient(to_right,#000_96%,transparent)]"
        />

        <div className="absolute top-1/2 left-[5%] -translate-y-1/2">
          {copy}
          <StoreBadges
            playStoreUrl={playStoreUrl}
            appStoreUrl={appStoreUrl}
            className="mt-[4.4cqw] grid w-[29cqw] grid-cols-2 gap-[1.2cqw]"
          />
          <p className="m-0 mt-[3.2cqw] text-[1.2cqw] text-paper">Download the Gokaido App.</p>
        </div>
      </div>

      <div className="pt-10 pb-10 md:hidden">
        <div className="px-6">{copy}</div>
        <Image
          src="/app-download-mobile.png"
          alt="The Gokaido mascot beside the Gokaido app on three phones"
          width={MOBILE_ART_W}
          height={MOBILE_ART_H}
          sizes="100vw"
          className="mt-6 block h-auto w-full"
        />
        <p className="m-0 mt-2 text-center font-heading text-lg font-bold text-red uppercase">Download the Gokaido App</p>
        <StoreBadges
          playStoreUrl={playStoreUrl}
          appStoreUrl={appStoreUrl}
          className="mx-auto mt-5 grid max-w-110 grid-cols-2 gap-4 px-6"
        />
      </div>
    </section>
  );
}
