import Hero from "./components/Hero/Hero";
import UnifyKits from "./components/UnifyKits/UnifyKits";
import Bestsellers from "./components/Bestsellers/Bestsellers";
import PresenceMap from "./components/PresenceMap/PresenceMap";
import AppDownload from "./components/AppDownload/AppDownload";
import StoreLocator from "./components/StoreLocator/StoreLocator";
import ReelShowcase from "./components/ReelShowcase/ReelShowcase";
import BeyondTheMedal from "./components/BeyondTheMedal/BeyondTheMedal";
import { getStores } from "./lib/stores";
import { DUMMY_REELS, getReels } from "./lib/reels";
import { getHomepageSettings } from "./lib/homepage";
import { getBestsellers, getCategories } from "./lib/catalog";
import { CATEGORY_PLACEHOLDER_IMAGE } from "./lib/fallbacks";

export default async function Home() {
  // Every source below falls back to placeholder data (lib/fallbacks.ts) when the API is down or
  // has nothing yet, so the page never renders an empty section.
  const [settings, stores, reels, categories, bestsellers] = await Promise.all([
    getHomepageSettings(),
    getStores(),
    getReels(),
    getCategories(),
    getBestsellers(4),
  ]);

  return (
    <main>
      <Hero
        // Local /hero/* files are the placeholder until admin uploads real
        // assets via the Homepage settings page — see apps/web/public/hero/.
        videoUrl={settings.heroVideoUrl ?? "/hero/hero-reel.mp4"}
        posterUrl={settings.heroVideoPosterUrl ?? "/hero/hero-reel-poster.jpg"}
        backgroundUrl={settings.heroBackgroundImageUrl ?? "/hero/hero.png"}
        showcaseImages={
          settings.heroShowcaseImages.length > 0
            ? settings.heroShowcaseImages
            : ["/hero/showcase-1.png", "/hero/showcase-2.png", "/hero/showcase-3.png"]
        }
      />
      {/* Phones: while the hero is pinned and its video grows (see Hero.tsx),
          this rises from the bottom and settles just under the video strip.
          The pull-up is the pinned block's height minus the hero (16:9 art)
          plus the strip (16:9) — both are 100vw wide — so at the end of the
          pin its top meets the strip's bottom. z-25 keeps it above the
          hero's fixed video layer (z-20). */}
      <div className="relative z-[25] max-md:-mt-[calc(100svh-112.93vw)]">
        <UnifyKits
          categories={categories.map((c) => ({ name: c.name, image: c.image ?? CATEGORY_PLACEHOLDER_IMAGE, href: c.href }))}
          backgroundUrl="/home/unify_your_kits_bg.png"
        />
      </div>
      <Bestsellers products={bestsellers.products} />
      <PresenceMap />
      <StoreLocator stores={stores} />
      <ReelShowcase reels={reels.length > 0 ? reels : DUMMY_REELS} />
      {/* Links are set in admin → Homepage; "#" until they're filled in. */}
      <BeyondTheMedal ctaHref={settings.beyondTheMedalUrl ?? "#"} />
      <AppDownload playStoreUrl={settings.playStoreUrl ?? "#"} appStoreUrl={settings.appStoreUrl ?? "#"} />
    </main>
  );
}
