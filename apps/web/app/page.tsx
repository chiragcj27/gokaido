import Hero from "./components/Hero/Hero";
import UnifyKits from "./components/UnifyKits/UnifyKits";
import Bestsellers from "./components/Bestsellers/Bestsellers";
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

export default async function Home() {
  const settings = await getHomepageSettings();

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
    </main>
  );
}
