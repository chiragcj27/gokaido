import type { Metadata } from "next";
import { DUMMY_STORES } from "../lib/fallbacks";
import { getStores } from "../lib/stores";
import DistributorCta from "./DistributorCta";
import StoreGallery from "./StoreGallery";
import StoreList from "./StoreList";
import WorldMap from "./WorldMap";

export const metadata: Metadata = {
  title: "Our Franchise",
  description:
    "Find a Gokaido store near you: stores across India, plus Dubai, Mauritius and Sri Lanka, with addresses, directions and phone numbers.",
};

export default async function OurFranchisePage() {
  const fetched = await getStores();
  // Store list comes from Admin → Stores; the design's list stands in while
  // the API is down or empty (tracked in DUMMY_DATA.md).
  const stores = fetched.length > 0 ? fetched : DUMMY_STORES;

  return (
    // overflow-clip, not hidden: a scroll container here would capture the
    // banner's scroll-snap and stop it snapping to the viewport.
    <main className="overflow-clip pt-8">
      <div className="mx-auto max-w-384">
        <WorldMap />
        <StoreGallery stores={stores} />
        <StoreList stores={stores} />
      </div>
      {/* Outside the width cap: this banner fills the whole viewport. */}
      <DistributorCta />
    </main>
  );
}
