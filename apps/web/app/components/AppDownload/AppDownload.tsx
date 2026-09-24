import Image from "next/image";

export interface AppDownloadProps {
  playStoreUrl: string;
  appStoreUrl: string;
}

// Native size of /app_ss.png — the aspect ratio keeps the overlaid buttons
// pinned to the same spot under the tagline at every width.
const IMG_W = 1600;
const IMG_H = 908;

function StoreButton({
  href,
  store,
  label,
  children,
}: {
  href: string;
  store: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${store}`}
      className="flex items-center gap-[0.6em] rounded-[0.6em] border border-paper/40 bg-ink px-[1em] py-[0.55em] text-paper transition-colors duration-200 hover:border-paper hover:bg-panel"
    >
      <span className="h-[1.8em] w-[1.8em] shrink-0">{children}</span>
      <span className="flex flex-col leading-none">
        <span className="text-[0.6em] uppercase tracking-wide opacity-80">{label}</span>
        <span className="mt-[0.2em] text-[1.05em] font-semibold">{store}</span>
      </span>
    </a>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path fill="#00d7fe" d="M3.6 1.6c-.3.3-.5.8-.5 1.4v18c0 .6.2 1.1.5 1.4l.1.1L14 12.2v-.2L3.7 1.5z" />
      <path fill="#ffce00" d="M17.4 15.6 14 12.2v-.2l3.4-3.4.1.1 4 2.3c1.1.6 1.1 1.7 0 2.3l-4 2.3z" />
      <path fill="#ff3a44" d="M17.5 15.5 14 12 3.6 22.4c.4.4 1 .4 1.7.1z" />
      <path fill="#00f076" d="M17.5 8.5 5.3 1.5c-.7-.4-1.3-.4-1.7 0L14 12z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6 0 0-2.5-1-2.5-3.9zM14.2 5.7c.6-.8 1.1-1.9.9-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.3z" />
    </svg>
  );
}

// The banner art (logo, headline, tagline) is baked into one flat PNG, so the
// store buttons are overlaid on it rather than laid out with it. Below `md`
// the image is too small for a legible overlay, so they stack underneath
// instead. Store URLs come in as props — placeholders until the real links
// are supplied.
export default function AppDownload({ playStoreUrl, appStoreUrl }: AppDownloadProps) {
  const buttons = (
    <>
      <StoreButton href={playStoreUrl} store="Google Play" label="Get it on">
        <PlayIcon />
      </StoreButton>
      <StoreButton href={appStoreUrl} store="App Store" label="Download on the">
        <AppleIcon />
      </StoreButton>
    </>
  );

  return (
    <section className="relative w-full bg-black">
      <div
        className="relative mx-auto w-full max-w-[1600px]"
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}`, containerType: "inline-size" }}
      >
        <Image
          src="/app_ss.png"
          alt="Gokaido app is here — download and unlock exclusive benefits"
          fill
          sizes="(min-width: 1600px) 1600px, 100vw"
          className="object-contain"
        />

        {/* Sits just under the tagline (~y 60–70% of the art). Font size is
            tied to container width so the buttons scale with the image. */}
        <div className="absolute left-[5%] top-[63%] hidden gap-[1.2cqw] text-[1.3cqw] md:flex">{buttons}</div>
      </div>

      <div className="flex justify-center gap-3 px-4 pb-10 text-sm md:hidden">{buttons}</div>
    </section>
  );
}
