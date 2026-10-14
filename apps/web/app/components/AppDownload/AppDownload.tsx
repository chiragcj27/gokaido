import Image from "next/image";

export interface AppDownloadProps {
  playStoreUrl: string;
  appStoreUrl: string;
}

// Native size of /app_ss.png — the aspect ratio keeps the overlaid badges
// pinned to the same spot under the tagline at every width.
const IMG_W = 3200;
const IMG_H = 1816;

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

// The banner art (logo, headline, tagline, phones) is one flat PNG, so the
// store badges are overlaid on it rather than laid out with it. Below `md`
// the image is too small for a tappable overlay, so they stack underneath
// instead. Store URLs come in as props — placeholders until the real links
// are supplied.
export default function AppDownload({ playStoreUrl, appStoreUrl }: AppDownloadProps) {
  return (
    <section className="relative w-full bg-black">
      <div
        className="relative mx-auto w-full max-w-[1600px]"
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}`, containerType: "inline-size" }}
      >
        <Image
          src="/app_ss.png"
          alt="Our app is here — download and unlock exclusive benefits"
          fill
          sizes="(min-width: 1600px) 1600px, 100vw"
          className="object-contain"
        />

        {/* Left edge matches the logo/headline (x 5% of the art); sits just
            under the tagline, which ends at ~55% of the art's height. Sizes
            are in cqw so the badges scale with the image. */}
        <StoreBadges
          playStoreUrl={playStoreUrl}
          appStoreUrl={appStoreUrl}
          className="absolute left-[5%] top-[62%] hidden w-[29cqw] grid-cols-2 gap-[1.2cqw] md:grid"
        />
      </div>

      <StoreBadges
        playStoreUrl={playStoreUrl}
        appStoreUrl={appStoreUrl}
        className="mx-auto grid max-w-110 grid-cols-2 gap-3 px-4 pb-10 md:hidden"
      />
    </section>
  );
}
