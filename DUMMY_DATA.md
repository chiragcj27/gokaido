# Dummy / Placeholder Data Tracker

Every place the storefront (`apps/web`) shows hard-coded, fake, or stubbed data that must become dynamic before launch. **Keep this current:** add a row when you introduce dummy data, delete the row when you wire the real source.

Paths are relative to `apps/web/app/`. Line numbers are approximate — search for the named constant.

## 🟡 Dynamic with dummy fallback

These are wired to the real source; the dummy only shows when the API is unreachable or has nothing yet, and disappears on its own once real data exists. All placeholders live in `lib/fallbacks.ts`; fetchers in `lib/catalog.ts` / `lib/homepage.ts`.

| Where | Real source | Fallback shown when |
|---|---|---|
| Homepage Bestsellers row, `/best-sellers` (paginated), search modal "Bestsellers", cart "You May Also Like" | `getBestsellers()` → `GET /api/products?bestseller=true` (flag in admin → Bestsellers) | No product is flagged bestseller, or API down |
| Navbar category menu, homepage "Unify Your Kits" ring | `getCategories()` → `GET /api/categories` (name, `image`, links to `/collections/{slug}`) | No active categories, or API down — dummies link to the sample `/collections` |
| `/collections` | Redirects to the first category with products | Sample Karate page (`collections/page.tsx`) while no category has products |
| `/search` | `GET /api/products?search=&sort=relevance` | Catalogue is empty or API down (`lib/search/dummySearch.ts`) — a real no-match on a populated catalogue shows "no results" |
| Search modal trending chips + typewriter placeholder | Admin → Homepage → Trending searches | None saved (`DUMMY_TRENDING_SEARCHES`) |
| FAQs on every PDP, `/best-sellers`, `/search` | Admin → Homepage → Store FAQs | None saved (`DEFAULT_FAQS` in `lib/pdp/defaults.ts`) |
| `<BeyondTheMedal>` CTA, `<AppDownload>` store buttons | Admin → Homepage links | Not set — renders `href="#"` |
| `lib/reels.ts` — `DUMMY_REELS` | Admin → Reels | No reels |
| Hero `/hero/*` files | Admin → Homepage hero uploads | Not uploaded |
| `lib/pdp/defaults.ts` — `DEFAULT_SIZE_GUIDE` | Subcategory `sizeGuide` in admin | Subcategory has none |

## Product listings

| Where | What's fake | Real source |
|---|---|---|
| `components/Bestsellers`, `CollectionScroll` — `onAddToCart` | Card "add to cart" just `console.log`s | Needs a size picker (or open PDP) then cart store |

## Homepage sections

| Where | What's fake | Real source |
|---|---|---|
| `components/PresenceMap/PresenceMap.tsx` | Map art + stats baked into flat mockup PNGs | Designer's layered SVG + real numbers |

## Product page

| Where | What's fake | Real source |
|---|---|---|
| `lib/dummyProduct.ts` + `sample-product/**` | Entire hard-coded sample PDP at `/sample-product/karate-guards` | Delete once the Figma-final dynamic PDP is signed off (see CLAUDE.md) |
| `components/SizeGuide/SizeGuide.tsx` — `PLACEHOLDER` | Before/after slider placeholder images (sample product only — the intro copy and stats are now per-product `protectionDescription` / `protectionStats`) | `competitorImage` / `cardImage` per product |
| `components/BuildYourKit/BuildYourKit.tsx` | Lorem ipsum description copy | Copy from client |
| `components/ProductInfo/ProductInfo.tsx` — `DUMMY_DELIVERY_DAYS` | Mobile pincode check accepts any 6-digit pincode and always promises "Express Delivery By" today + 4 days; desktop shows a fixed "Tue, 1 Sept - Wed, 2 Sept" line | Courier serviceability/ETA API by pincode |

## About Us

| Where | What's fake | Real source |
|---|---|---|
| `about-us/AwardsFloat.tsx` — `AWARDS` | Placeholder awards | Client's real awards |
| `about-us/StatsTrail.tsx` — `IMAGES` | Placeholder photos | Client's brand/story images |
| `about-us/page.tsx` — `SEGMENTS` | Generic "Industrial / Office" / "Retail" copy unrelated to Gokaido | Copy from client |
| `our-franchise/page.tsx` — franchise paragraph | Franchise pitch copy written by us (support offered, etc. not confirmed by client) | Copy from client |
| `our-franchise/FranchiseSignup.tsx` — form intro/thanks copy; `components/EnquiryForm/EnquiryForm.tsx` — `SOURCES` | "Sign up today" intro copy and the "How did you hear about us?" options are ours | Copy/options from client (keep options in sync with `FRANCHISE_ENQUIRY_SOURCES` in the database package) |
| `contact-us/page.tsx` — enquiry form intro/thanks copy | Written by us; the rest of the page copy is from the design | Copy from client |

## Stubbed behaviour (not data, but fake)

| Where | What's fake | Real behaviour |
|---|---|---|
| `components/Checkout/PaymentStep.tsx` — method choice + UPI ID | UPI/Card/Net Banking selection and the UPI ID field aren't sent anywhere — ICICI's hosted page offers every method itself | Drop the field, or pass a preferred `paymode` to `initiateSale` if ICICI supports it |
| `cart/page.tsx` — save-for-later & discount code | `console.log` only | Wishlist API / cart coupon apply API (both exist in backend) |
| `components/Bestsellers`, `CollectionScroll` — `onAddToCart` | Card "add to cart" just `console.log`s | Needs a size picker (or open PDP) then cart store |
| `components/PoppedCardShowcase/PoppedCardShowcase.tsx` | Dev showcase with dummy cards — not imported anywhere | Delete when no longer needed |
