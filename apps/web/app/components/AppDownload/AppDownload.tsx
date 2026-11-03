import Image from "next/image";

export interface AppDownloadProps {
  playStoreUrl: string;
  appStoreUrl: string;
}

// Native size of /app-download-bg.png — the aspect ratio keeps the overlaid copy and
// badges pinned to the same spot beside the phones at every width.
const IMG_W = 3200;
const IMG_H = 1816;

// /gokaido-wordmark.png is the GOKAIDO wordmark from the footer logo (2718×600).
const WORDMARK_W = 2718;
const WORDMARK_H = 600;

// Mobile shows only the phones/belt/rock part of the banner, cropped larger
// (source px).
const CROP = { x: 1420, y: 400, w: 1450, h: 1100 };

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

// The banner art is one flat PNG (phones, belt, rock); its left half is plain
// black, and the copy + store badges are laid out over it. Sizes are in cqw so
// everything scales with the image. Below `md` the image is too small for
// readable overlaid copy, so the copy sits above a cropped close-up of the
// phones, with the badges underneath.
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
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}`, containerType: "inline-size" }}
      >
        <Image
          src="/app-download-bg.png"
          alt="The Gokaido app on three phones"
          fill
          sizes="(min-width: 1600px) 1600px, 100vw"
          className="object-contain"
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
        <div className="relative mt-6 w-full overflow-hidden" style={{ aspectRatio: `${CROP.w} / ${CROP.h}` }}>
          <Image
            src="/app-download-bg.png"
            alt="The Gokaido app on three phones"
            width={IMG_W}
            height={IMG_H}
            sizes="175vw"
            className="absolute h-auto max-w-none"
            style={{
              width: `${(IMG_W / CROP.w) * 100}%`,
              left: `${(-CROP.x / CROP.w) * 100}%`,
              top: `${(-CROP.y / CROP.h) * 100}%`,
            }}
          />
        </div>
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
