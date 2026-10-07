# Dummy / Placeholder Data Tracker

Every place the storefront (`apps/web`) shows hard-coded, fake, or stubbed data that must become dynamic before launch. **Keep this current:** add a row when you introduce dummy data, delete the row when you wire the real source.

Paths are relative to `apps/web/app/`. Line numbers are approximate — search for the named constant.

## 🔴 Temporary — remove on request

| Where | What's fake | Real source / how to remove |
|---|---|---|
| `lib/search/dummySearch.ts` (`USE_DUMMY_SEARCH`), branch in `lib/search/searchProducts.ts` | `/search` returns the same 60 "Lorem ipsum N" products for **every** query (3 pages), so the results page and pagination can be reviewed | Real path is already built: `GET /api/products?search=&sort=relevance&page=&limit=`. Delete `dummySearch.ts` and the `if (USE_DUMMY_SEARCH)` line in `searchProducts.ts` |

## Product listings

| Where | What's fake | Real source |
|---|---|---|
| `page.tsx` — `DUMMY_BESTSELLERS` | Homepage Bestsellers row (4 cards) | `GET /api/products?bestseller=true` → `cardImage`, price, colours (reuse `toRelatedProducts` in `lib/pdp/adapter.ts`) |
| `best-sellers/page.tsx` — `DUMMY_BESTSELLERS` | Best Sellers page grid (12 cards) | Same as above, paginated like `/search` |
| `components/SearchModal/SearchModal.tsx` — `BESTSELLERS` | "Bestsellers in Sports & Lifestyle" row inside the search modal | Same bestseller query (4 items) |
| `components/SearchModal/SearchModal.tsx` — `TRENDING_SEARCHES` | Trending search chips + animated placeholder words (generic sports terms, not Gokaido's) | Needs a trending-searches endpoint or an admin-managed list |
| `collections/page.tsx` — `categoryName`, `subcategories`, `dummyProducts()` | Whole `/collections` sample page (Karate + 7 subcategories of Lorem ipsum cards linking to the sample product) | `/collections/[category]` is already API-backed (`lib/collections/getCollection.ts`); this page should be deleted/redirected once real categories exist |
| `cart/page.tsx` — `dummyProduct.relatedProducts` | "You May Also Like" row on the cart | Related/recommended products from the API based on cart contents |
| `components/Navbar/Navbar.tsx` — `categories` | Category dropdown is a fixed Karate/Boxing/Taekwondo list, all linking to the sample `/collections` | Categories from the API, each linking to `/collections/{slug}` |

## Homepage sections

| Where | What's fake | Real source |
|---|---|---|
| `page.tsx` — `DUMMY_KIT_CATEGORIES` | "Unify Your Kits" category ring (names + placeholder image) | Category data (name + image) from the API |
| `page.tsx` — `DUMMY_STORES` | Store locator — **fallback only**, shown when the API returns no stores | Admin Stores page (`lib/stores.ts`) — already dynamic, drop the fallback once real stores are added |
| `page.tsx` — `DUMMY_REELS` | Reel showcase — **fallback only**, shown when the API returns no reels | Admin Reels page (`lib/reels.ts`) — already dynamic, drop the fallback once real reels are added |
| `page.tsx` — Hero `/hero/*` files | Hero video/showcase images are local files — **fallback only** | Admin homepage settings upload |
| `page.tsx` — `<BeyondTheMedal ctaHref="#">` | CTA goes nowhere | Decide submission route (form / WhatsApp / email) |
| `page.tsx` — `<AppDownload playStoreUrl="#" appStoreUrl="#">` | App store buttons go nowhere | Real Play Store / App Store links from client |
| `components/PresenceMap/PresenceMap.tsx` | Map art + stats baked into flat mockup PNGs | Designer's layered SVG + real numbers |

## Product page

| Where | What's fake | Real source |
|---|---|---|
| `lib/dummyProduct.ts` + `sample-product/**` | Entire hard-coded sample PDP at `/sample-product/karate-guards` | Delete once the Figma-final dynamic PDP is signed off (see CLAUDE.md) |
| `lib/pdp/defaults.ts` — `DEFAULT_FAQS` | FAQs are store-wide defaults on every PDP, `/best-sellers` and `/search` | Needs an FAQ model / admin editor |
| `lib/pdp/defaults.ts` — `DEFAULT_SIZE_GUIDE` | Size guide used when a subcategory has none configured | Subcategory `sizeGuide` in admin — fallback only |
| `lib/pdp/adapter.ts` — `mrp: 0` | No strike-through/MRP price on cards or PDP | Needs an MRP field on the product/variant |
| `components/SizeGuide/SizeGuide.tsx` — `PLACEHOLDER` + Lorem paragraph | Before/after slider placeholder images and Lorem ipsum copy | `competitorImage` / `cardImage` per product; copy from client |
| `components/BuildYourKit/BuildYourKit.tsx` | Lorem ipsum description copy | Copy from client |

## About Us

| Where | What's fake | Real source |
|---|---|---|
| `about-us/AwardsFloat.tsx` — `AWARDS` | Placeholder awards | Client's real awards |
| `about-us/StatsTrail.tsx` — `IMAGES` | Placeholder photos | Client's brand/story images |
| `about-us/page.tsx` — `SEGMENTS` | Generic "Industrial / Office" / "Retail" copy unrelated to Gokaido | Copy from client |

## Stubbed behaviour (not data, but fake)

| Where | What's fake | Real behaviour |
|---|---|---|
| `components/Checkout/PaymentStep.tsx` — method choice + UPI ID | UPI/Card/Net Banking selection and the UPI ID field aren't sent anywhere — ICICI's hosted page offers every method itself | Drop the field, or pass a preferred `paymode` to `initiateSale` if ICICI supports it |
| `cart/page.tsx` — save-for-later & discount code | `console.log` only | Wishlist API / cart coupon apply API (both exist in backend) |
| `components/Bestsellers`, `CollectionScroll` — `onAddToCart` | Card "add to cart" just `console.log`s | Needs a size picker (or open PDP) then cart store |
| `components/PoppedCardShowcase/PoppedCardShowcase.tsx` | Dev showcase with dummy cards — not imported anywhere | Delete when no longer needed |
