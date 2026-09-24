import Hero from "./components/Hero/Hero";
import UnifyKits from "./components/UnifyKits/UnifyKits";
import Bestsellers from "./components/Bestsellers/Bestsellers";
import PresenceMap from "./components/PresenceMap/PresenceMap";
import AppDownload from "./components/AppDownload/AppDownload";
import StoreLocator from "./components/StoreLocator/StoreLocator";
import ReelShowcase from "./components/ReelShowcase/ReelShowcase";
import BeyondTheMedal from "./components/BeyondTheMedal/BeyondTheMedal";
import { getStores, type Store } from "./lib/stores";
import { getReels, type Reel } from "./lib/reels";
import { getHomepageSettings } from "./lib/homepage";

// Dummy categories until the ring is wired to real category data (name +
// cardImage). Order matters: index 0 starts front-and-centre, and the ring
// wraps, so the last entries sit to its left.
const DUMMY_KIT_CATEGORIES = [
  { name: "Karate", image: "/dummy/product-placeholder.png" },
  { name: "Taekwondo", image: "/dummy/product-placeholder.png" },
  { name: "Jujutsu", image: "/dummy/product-placeholder.png" },
  { name: "MMA", image: "/dummy/product-placeholder.png" },
  { name: "Boxing", image: "/dummy/product-placeholder.png" },
];

// Dummy bestsellers until this is backed by real product data (cardImage,
// price, colour variants).
const DUMMY_COLORS = [
  { name: "Red", hex: "#c8102e" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Blue", hex: "#1f4fbf" },
];
const DUMMY_BESTSELLERS = [1, 2, 3, 4].map((n) => ({
  slug: `dummy-bestseller-${n}`,
  title: "Lorem ipsum",
  subtitle: "Lorem ipsum",
  imageSrc: "/card/card-sample.png",
  price: 2499,
  mrp: 3499,
  colors: DUMMY_COLORS,
}));

// Dummy stores until the admin adds real ones (Stores page) — same idea as the
// dummy categories/bestsellers above. Cities mirror the design mockup.
const DUMMY_STORES: Store[] = [
  "Pune", "Nagpur", "Bhilai", "Surat", "Baroda", "Indore", "Guwahati", "Bengaluru", "Goa", "Chennai",
].map((city) => ({
  id: `dummy-store-${city.toLowerCase()}`,
  city,
  name: `Gokaido VR Mall ${city}`,
  address: "136-B, Deccan Chamber Building, Jagarnath Shankar Sheth (J.S.S.) Road, Girgaon, Mumbai - 400004",
  hours: "11 AM - 10 PM (Open Everyday)",
  phone: "+91 7996000781",
  image: null,
  directionsUrl: null,
}));

// Dummy reels until the admin adds real ones (Reels page). Reuses the hero reel
// as the video, with the placeholder card as the attached product.
const DUMMY_REELS: Reel[] = [1, 2, 3].map((n) => ({
  id: `dummy-reel-${n}`,
  videoUrl: "/hero/hero-reel.mp4",
  posterUrl: "/hero/hero-reel-poster.jpg",
  instagramUrl: null,
  product: { name: "Lorem ipsum", slug: `dummy-reel-product-${n}`, image: "/card/card-sample.png", price: 2499 },
}));

export default async function Home() {
  const [settings, stores, reels] = await Promise.all([getHomepageSettings(), getStores(), getReels()]);

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
      <UnifyKits categories={DUMMY_KIT_CATEGORIES} backgroundUrl="/home/unify_your_kits_bg.png" />
      <Bestsellers products={DUMMY_BESTSELLERS} />
      <PresenceMap />
      <StoreLocator stores={stores.length > 0 ? stores : DUMMY_STORES} />
      <ReelShowcase reels={reels.length > 0 ? reels : DUMMY_REELS} />
      {/* Placeholder link until the real submission route (form / WhatsApp / email) is decided. */}
      <BeyondTheMedal ctaHref="#" />
      {/* Placeholder store links until the real ones are supplied. */}
      <AppDownload playStoreUrl="#" appStoreUrl="#" />
    </main>
  );
}
