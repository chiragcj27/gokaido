# Gokaido — Build Checklist

Tracks Phase 1 (must-have) and Phase 2 (post-launch) scope from `CLAUDE.md`. Check items off as they land — this should reflect actual state, not intent. Backend items are verified working (type-checked + smoke-tested against the live DB). Storefront pages are being built against Figma as it arrives; hard-coded/placeholder data on those pages is tracked separately in `DUMMY_DATA.md`.

## Foundation

- [x] `packages/database` — Mongoose models: User, Product, Order, Cart, Address, Review, Coupon, RewardTransaction, Referral, Notification, CampaignBlast, BlogPost, plus Category, Subcategory, Color, Asset, HomepageSettings, Reel, Store, FranchiseEnquiry. (Notification, CampaignBlast, BlogPost are schema-only — no API uses them yet)

## Phase 1 — Go Live

### 1. UI/UX & Branding
- [ ] Custom glove-shaped cursor
- [ ] Splash/intro animation
- [ ] Interactive mascot
- [ ] Page transitions
- [x] Mobile-first responsive shell — Navbar, Footer, search modal, and all built pages are responsive

### 2. Customer Journey
- [x] Guest browsing (no login wall) — homepage, collections, PDP, search, cart and guest checkout all work signed-out
- [x] Persistent cart — localStorage bag (`lib/cartStore.tsx`), mirrored into the server `Cart` at "Place Order" (`lib/checkout/placeOrder.ts`, guests via `X-Guest-Id`)
- [ ] Recently viewed — backend + frontend
- [x] Wishlist — backend + account Wishlist tab (list/remove)
- [ ] Wishlist heart on product cards — `PoppedCard` has the toggle UI but `onToggleWishlist` isn't wired to the API anywhere
- [ ] "Continue where you left off" — frontend

### 3. Homepage — `apps/web/app/page.tsx`
- [x] Hero banner — video/showcase from admin homepage settings (local files as fallback)
- [x] Featured categories — "Unify Your Kits" ring built, **still dummy data** (`DUMMY_KIT_CATEGORIES`)
- [ ] New arrivals / bestsellers — Bestsellers row + `/best-sellers` page built and admin can flag bestsellers (`apps/admin/.../bestsellers`), but both pages still render `DUMMY_BESTSELLERS` instead of `GET /api/products?bestseller=true`. No new-arrivals row yet
- [ ] About section — `/about-us` page built, copy/images are placeholders (see `DUMMY_DATA.md`)
- [x] Gallery — Reel showcase, admin-managed (`Reel` model + admin Reels page)
- [x] Testimonials — `CustomerReviews` section
- [x] Store locator — admin-managed (`Store` model + admin Stores page)
- [ ] Floating WhatsApp button
- [ ] App download links + "Beyond the Medal" CTA — built, links are `#` pending client

### 4. Product Pages — `/products/{slug}` and `/products/{slug}/{colorSlug}`, API-backed (`lib/pdp/`)
- [x] SEO slug URLs — routing per "Product URLs, Variants & Google Shopping Feed" in CLAUDE.md
- [x] Region-based pricing — backend. **Not applied on the storefront** (base price is cached and rendered)
- [x] Image gallery — `ProductGallery`
- [ ] Image zoom — not implemented in `ProductGallery`
- [x] Size/colour selector — colour switches the URL, size is `?size=` applied client-side
- [x] Reviews/ratings display — reviews + rating histogram fetched from the API. "Talked about", review photos and down-votes not collected
- [x] JSON-LD structured data — `Product` + offer-per-SKU in `ProductPageClient.tsx`
- [x] Open Graph / Twitter card metadata per product
- [x] Size guide modal (per-subcategory `sizeGuide`, store default as fallback) + before/after slider (placeholder images)
- [x] Related products + Build Your Kit
- [ ] WhatsApp share button
- [ ] MRP / strike-through price — needs an MRP field on product/variant
- [ ] Per-product FAQs — currently store-wide defaults; needs an FAQ model/admin editor
- [ ] Delete `/sample-product/**` + `lib/dummyProduct.ts` once the dynamic PDP is signed off

### 5. Search & Discovery
- [x] Full-text search + filters (category/subcategory/size/colour/price/sport) + sort + pagination — backend
- [x] Search results page + search modal — **`/search` still returns dummy results** (`USE_DUMMY_SEARCH`); remove only when asked
- [x] Collection pages — `/collections/[category]`, API-backed (`lib/collections/getCollection.ts`)
- [ ] Navbar category menu from the API — currently a fixed list pointing at the sample `/collections` page
- [ ] Search suggestions/autocomplete — modal shows hard-coded trending chips only
- [ ] AI natural language search

### 6. Cart & Checkout
- [x] Persistent cart, guest + user, merge on login — backend
- [x] Cart page — `/cart`. Save-for-later and discount code inputs only `console.log`; "You May Also Like" is dummy
- [x] One-page checkout — `/checkout` with Customer info → Review → Payment steps
- [x] Progress indicator — `CheckoutStepper`
- [x] Reward points redemption — backend, redeemed via `rewardPointsToRedeem`, capped/atomic/race-tested. Rate & cap are placeholder defaults, not a client-confirmed spec — see "Reward Points" in CLAUDE.md
- [ ] Reward points redemption in checkout UI — `placeOrder.ts` never sends `rewardPointsToRedeem`
- [x] Promo/coupon codes — backend (admin CRUD + cart apply/remove, all limits enforced)
- [ ] Coupon entry in cart/checkout UI — not wired to the cart coupon API
- [x] Multiple saved addresses — backend + account Addresses tab
- [ ] Saved-address picker in checkout — `CustomerInfoStep` doesn't load `/api/addresses`
- [x] Payment integration — **ICICI Bank PG, not Razorpay**. Standard/redirect flow, secureHash verified live against UAT. See "Payment Gateway" in CLAUDE.md
- [x] Order creation from cart — atomic stock reservation (race-tested), guest + authenticated checkout, coupon consumption on payment success
- [x] Payment return pages — `/orders/{orderNumber}?status=…` (clears bag on success) + `/checkout/failed`
- [x] Retry payment for a failed order — `POST /api/orders/:id/retry-payment`
- [ ] Drop / repurpose the UPI/Card/NB choice + UPI ID field in `PaymentStep` — not sent anywhere; ICICI's hosted page picks the method
- [ ] Invoice generation/download
- [ ] Success sound on payment return
- [ ] Card "add to cart" on listings (`Bestsellers`, `CollectionScroll`) — only `console.log`s; needs a size picker or link to PDP

### 7. User Account — `/account` (OTP login/signup for guests, tabbed dashboard once signed in)
- [x] OTP login (SMS via Twilio) — backend + `LoginSignup` UI. Admin portal uses email+password instead
- [x] Registration — backend + UI
- [x] My Orders (track + cancel) — backend + Orders tab (status, cancel for placed/confirmed)
- [x] My Addresses — backend + Addresses tab
- [x] Reward Points dashboard — backend `GET /api/users/me/reward-transactions`. Point *expiry* sweep not built (no scheduler)
- [ ] Reward Points ledger UI — Overview tab shows the balance only, no transaction history
- [x] Refer & Earn — backend `GET /api/users/me/referrals`
- [ ] Refer & Earn UI — no referral code/history screen
- [x] Edit Profile (mutable fields only) — backend + Profile tab
- [x] Language settings — backend + Settings tab (also notification channel preferences)
- [x] Wishlist — backend + Wishlist tab

### 8. Product Reviews
- [x] Star rating + written review submission — `POST /api/reviews`, gated on a delivered order containing the product; one review per (order, product)
- [x] Photo/video upload — `mediaUrls`, via the `review` upload purpose (S3 presign)
- [x] Purchase-verified badge — `isVerifiedPurchase`
- [x] Helpful votes — `POST /api/reviews/:id/helpful`
- [x] Admin moderation (approve/reject) — `GET/PATCH /api/admin/reviews`; `Product.avgRating`/`reviewCount` recomputed on every change
- [x] Admin can add a review manually — `POST /api/admin/reviews` (partial unique index on `order`)
- [x] Review moderation UI in `apps/admin`
- [ ] Review submission UI on the storefront — no "write a review" form for delivered orders yet

### 9. CRM & Notifications
- [x] SMS OTP — backend
- [ ] SMS order status — backend
- [ ] WhatsApp order updates — backend
- [ ] Email: registration, confirmation, invoice (Resend) — backend
- [ ] Abandoned cart recovery (WhatsApp, 1hr after) — backend job; needs a scheduler (see Infra)

### 10. Multilingual
- [ ] EN/HI/MR/TA content plumbing (`next-intl` or similar) — no `[locale]` routing yet; every route currently sits at the root. Do this before the route tree grows further
- [ ] hreflang tags
- [ ] Language switcher in header
- [x] Language field on User — backend + Settings tab

### 11. Super Admin Panel — `apps/admin`, port 3002, email+password login gated to admin/superadmin. Seed an admin via `pnpm --filter @gokaido/api seed:admin`
- [x] Review moderation UI — list, approve/reject, manual add
- [x] Coupon management — full stack
- [x] Product management — full stack, with `cardImage`/`competitorImage` single-image fields and per-variant `MultiImageUpload`
- [x] Category & subcategory management — full stack, incl. subcategory size guides
- [x] Colour management — full stack (`Color` model, admin Colors page)
- [x] Bestsellers — admin page toggling `isBestseller`
- [x] Homepage settings — hero video/showcase uploads (`HomepageSettings` singleton)
- [x] Reels + Stores — full stack, feed the homepage/franchise sections
- [x] Franchise enquiries — public form at `/our-franchise` (rate-limited) + admin list/status/notes
- [x] Order management — full stack, guarded status transitions, cancel/refund via ICICI
- [x] Asset store — full stack, pre-upload images and paste S3 URLs into the bulk sheet
- [x] Product bulk upload via Excel — `POST /api/products/bulk` + template download, wired into the Products page
- [x] Google Shopping feed export — `GET /api/feeds/google-shopping.xml`. `google_product_category` mapping still coarse (`apps/api/src/utils/googleCategory.ts`)
- [ ] CRM campaign management — backend + UI (`CampaignBlast` model exists, no API)
- [ ] Blog/content management — backend + UI (`BlogPost` model exists, no API)
- [ ] Popup/banner management
- [ ] Flash sale timers
- [ ] FAQ management — needed to replace store-wide default FAQs on the PDP

### 12. Performance & Security
- [ ] Core Web Vitals pass (<3s load)
- [ ] Image compression + lazy loading audit
- [ ] SSL — deploy-time
- [ ] CSRF/XSS protection — no `helmet`/CSRF middleware yet. Rate limiting covers OTP send/verify, admin login and franchise enquiries only
- [ ] GDPR cookie consent banner

## Phase 2 — Post Launch

- [ ] SEO (sitemap.xml, robots.txt) — per-page `metadata` already exists on most storefront routes
- [x] Google Shopping Feed — done in Phase 1
- [ ] Open Graph + Twitter Cards site-wide — done on the PDP only
- [ ] Referral program UTM tracking
- [ ] Flash sale banners
- [ ] Blog section — frontend
- [ ] GA4 e-commerce events
- [ ] Meta Pixel
- [ ] Google Tag Manager
- [ ] Exit intent popup
- [ ] WhatsApp chatbot (product queries / order status / size guide)
- [ ] Product recommendation engine
- [ ] Size assistant (height/weight → size)

## Infra / Cross-cutting

- [x] AWS S3 bucket + upload plumbing — `gokaido-web-storage` (versioned, SSE-S3, public reads under `public/*`), browser presigned uploads, scoped `gokaido-api-runtime` IAM user. Verified live end-to-end
- [ ] Job scheduler (cron/queue) — needed for abandoned-cart recovery and reward-point expiry
- [ ] AWS EC2 deployment pipeline
- [ ] CI (lint/type-check on push)
- [ ] Replace remaining placeholder data — see `DUMMY_DATA.md`
