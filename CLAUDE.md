# Gokaido D2C Website

Gokaido is a martial arts equipment brand (Karate, Boxing, Taekwondo) building a D2C ecommerce website. This is a **freelance project** — UI/UX is handled by a separate design team delivering Figma files; we handle all development.

## Monorepo Structure

```
apps/
  web/        — Next.js 15 (React 19) customer storefront, port 3000
  admin/      — Next.js 15 (React 19) internal admin portal, port 3002
  api/        — Express.js backend, port 3001
packages/
  database/   — Shared Mongoose models, built to dist/
```

- Package manager: **pnpm** with workspaces
- Build orchestration: **Turborepo**
- Internal package imports: `@gokaido/database`, `@gokaido/api`, `@gokaido/web`

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB via Mongoose 8 |
| Assets | AWS S3 |
| Deployment | AWS EC2 |
| Payments | ICICI Bank Payment Gateway (UPI, Card, Net Banking) |
| Notifications | Twilio/Plivo (SMS), WhatsApp Business API, Resend (Email), Firebase (Push) |

## Key Architecture Decisions

- **Website backend is completely separate from the Gokaido app backend** — no shared DB, no shared auth, no shared reward points
- OTP login is independent (not shared with mobile app)
- Reward points are website-only (not synced with app)
- Coach / Wholesale users → show popup with QR code to download app (no web flow for them)
- Name and mobile number **cannot be changed** after registration
- Browser push notifications: **deprioritized** (low allow-rate)
- Google CAPTCHA / Cloudflare free plan for bot protection
- Dojo creation (IKEA-style room builder) — **out of scope**
- Screenshot restriction — **not possible on web**
- Languages: **English, Hindi, Marathi, Tamil** (`/en`, `/hi`, `/mr`, `/ta`)

## Product URLs, Variants & Google Shopping Feed

Decided ahead of the PDP build (frontend not started yet, blocked on Figma) so the routing, JSON-LD, and feed all agree on one model. Researched against Google's own ecommerce SEO docs and Merchant Center spec — see sources in the conversation that decided this, or re-verify at https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites and https://support.google.com/merchants/answer/6324507.

**One `Product` document per style, holding every color × size as `variants[]`** (already the shape of `packages/database/src/models/product.ts` — no schema change needed for any of this).

**Color gets its own URL path segment; size stays a query param, never a path segment.** Color has real search intent ("red karate gi") and usually a distinct photo; size doesn't ("gi size M" isn't a search anyone does), so giving it a URL only dilutes ranking for no benefit.

```
/en/products/{slug}                       — base product, canonical, default color
/en/products/{slug}/{colorSlug}           — color-specific, own OG image/title, canonicalizes back to base
/en/products/{slug}/{colorSlug}?size={s}  — deep-link target for ads/feed, still canonical → base
```

Note this is `/{slug}/{colorSlug}` (a real path segment), **not** `/{slug}-{colorSlug}` (hyphen-concatenated) — CLAUDE.md originally sketched the hyphenated form as an illustrative example, but resolving a hyphenated composite back into `{slug, color}` at request time is ambiguous (colors with hyphens, slug-prefix collisions) unless the composite is precomputed and stored. A real path segment needs no parsing and no extra stored field. If the hyphenated look is wanted for branding, it's still doable — just needs the composite slug stored per color at write time rather than parsed at read time.

Every color page's `<link rel="canonical">` points at the base `/en/products/{slug}` — this is Google's own recommendation for variant URLs (consolidate ranking signal on one page rather than having variants "fight each other"). Repeat the same base+color+size structure under `/hi/`, `/mr/`, `/ta/` with per-language self-canonical + hreflang cross-links.

**JSON-LD** on each color page: one `Product` block, `offers: []` with one `Offer` per size-SKU on that color (sku, price, availability, deep-link URL) — same shape as the feed below, one source of truth.

**Google Shopping feed** — live at `GET /api/feeds/google-shopping.xml` (`apps/api/src/controllers/feed.controller.ts`), public/unauthenticated since Google's fetcher can't hold a token. One feed `<item>` per **SKU** (Google requires variants as separate entries, not consolidated — a 3-size × 3-color product is 9 items):

| Feed field | Source |
|---|---|
| `g:id` | `variant.sku` |
| `g:item_group_id` | `product.slug` — ties all colors/sizes of one style together, drives the swatch UI in Shopping results |
| `link` | `{SITE_URL}/products/{slug}/{colorSlug}?size={size}` |
| `g:image_link` | `variant.images[0]` falling back to `product.images[0]` |
| `g:price` | `variant.basePrice` — the default/national price, **not** a region override. GMC feeds are single-price-per-country; region-based pricing stays a site-only feature |
| `g:availability` | `in_stock` if `stock > 0 && isActive`, else `out_of_stock` |
| `g:color`, `g:size` | direct from the variant |
| `g:brand` | `"Gokaido"` |
| `g:mpn` | `variant.sku`, with `g:identifier_exists: no` (no GTINs for a small manufacturer's own gear) |
| `g:google_product_category` | `apps/api/src/utils/googleCategory.ts` — mapped from `productType`; currently coarse (uniform vs. equipment) and **flagged in that file's own comment** to be refined against Google's taxonomy browser once there's a real catalog to test against |

Inactive variants are excluded entirely; out-of-stock-but-active variants stay in the feed as `out_of_stock` (don't drop them — that loses the listing rather than just pausing it).

### Product Image Fields

`Product.images` (product-level) and `variant.images` (per colour) are the general gallery/PDP photos and **may have a studio or lifestyle background** — they're not usable everywhere. Two extra single-image fields on `Product` (`packages/database/src/models/product.ts`) exist for contexts that need something else:

- **`cardImage`** — a finished card visual — the card background and the product already composited into one PNG (594×470, transparent headroom above the background so the product pops out; sample at `apps/web/public/card/card-sample.png`). `PoppedCard` renders it as-is, with no separate `card_bg` layer and no server-side trimming/normalizing pipeline (removed). It's the only image allowed wherever the product renders as a card (listings, related products, kit builder), so card-rendering code should read `cardImage`, not `images`. Subcategory/category card images follow the same rule.
- **`competitorImage`** — a competitor's own product photo, not ours; feeds the "before" side of `BeforeAfterSlider` (`apps/web/app/components/BeforeAfterSlider/`), currently wired with dummy placeholders in `SizeGuide.tsx` pending real product data.

Both are product-level (not per-colour) — matches how `PoppedCard` and `BeforeAfterSlider` currently take a single static image regardless of colour selection. Optional in the schema/Zod validation; admin's `ProductForm` exposes them via the single-image `ImageUpload` component (not `MultiImageUpload`, which is for the array fields). Bulk upload (`productBulk.schema.ts` / `.controller.ts`) carries them as two more columns, filled in once on a product's first row like `images`/`description`/`tags`.

### Product Page (storefront)

`/products/{slug}` and `/products/{slug}/{colorSlug}` are **API-backed**: `apps/web/app/lib/pdp/` fetches the product (+ colors, reviews with rating histogram, related and kit items in parallel) from the API and `adapter.ts` maps it onto the `PdpProduct` view-model that `components/ProductPage/ProductPageClient.tsx` renders. Fetches use Next's fetch cache (product 60s, reviews 5m, colors 1h, related 10m; tags `product:{slug}`, `products`, `colors`, `reviews:{slug}` for on-demand `revalidateTag`). `?size=` is applied client-side after mount so the page stays cacheable.

The old hard-coded page is kept temporarily at `/sample-product/karate-guards` (noindex; `lib/dummyProduct.ts`) — delete it, and the `DummyProduct` alias, once the Figma-final page is signed off. Known gaps in the dynamic page: no MRP field in the catalogue (no strike-through price), FAQs are store-wide defaults (no FAQ model), review "talked about"/photos and down-votes aren't collected, region pricing isn't applied (base price is what's cached and rendered).

## Payment Gateway (ICICI Bank PG)

Switched from the originally-planned Razorpay to **ICICI Bank's own Payment Gateway** — client onboarded directly with ICICI (UAT credentials on file, not in this repo — see `apps/api/.env`, gitignored). Integration built against ICICI's Interface Specification doc; test it against their UAT sandbox before assuming anything below still matches their live behavior if the bank revises the spec.

**Flow: Standard/redirect (`payType: "0"`), not Direct/Seamless (`payType: "1"`).** Seamless mode means collecting raw card PAN/CVV on our own server, which pulls this codebase into PCI-DSS SAQ scope — not something to take on without the client explicitly signing off on that compliance burden. Standard mode redirects the browser to ICICI's own hosted page for card/NB/UPI/OTP entry; we never see the card number.

```
POST /api/orders                    → creates the Order (stock reserved), calls ICICI initiateSale
                                       server-to-server, returns {order, redirectURI, tranCtx}
  (frontend navigates the browser to `${redirectURI}?tranCtx=${tranCtx}`)
POST /api/orders/payment-return     → ICICI's browser-redirect callback (form-urlencoded), verifies
                                       secureHash, updates the order, 303s back to the storefront
POST /api/orders/payment-advice     → ICICI's async server-to-server callback (same verification,
                                       for when the browser-redirect leg is missed/delayed), 200s back
GET  /api/orders/:id/check-status   → manual reconciliation via ICICI's STATUS command, for orders
                                       stuck pending with no return/advice ever received
POST /api/orders/:id/retry-payment  → re-initiates payment on a "failed" order without re-shopping;
                                       re-reserves stock/points, calls initiateSale with a fresh merchantTxnNo
POST /api/orders/:id/cancel         → refund (if paid) or release (if not) via ICICI's REFUND/void command

GET   /api/admin/orders             → admin/superadmin: list all orders, filter by status/payment/search
GET   /api/admin/orders/:id         → admin: any order, not just the caller's own
PATCH /api/admin/orders/:id         → admin: tracking info + status transitions (server-enforced state
                                       machine — see ALLOWED_STATUS_TRANSITIONS in order.controller.ts),
                                       cancelling/refunding via the same refundAndCancel path as above
```

**secureHash (Hash Calc V1)** — `apps/api/src/services/iciciPg.ts`: sort all non-empty request-body keys ascending, concatenate their values with no separator, HMAC-SHA256 with the shared secret, hex, lowercase. Verified correct by a live call against ICICI's UAT `initiateSale` (got back `R1000`, not a hash-mismatch rejection). **Every** field present in an inbound callback must go into the hash check, not just the documented ones — the spec is explicit that only null/empty values may be skipped, so `verifyInboundHash` hashes the body as received rather than a fixed field list.

**Stock is reserved at order-creation, not at payment-success** — decremented inside a Mongo transaction with a `$gte` guard in the update filter (`variants.stock >= quantity`), so two concurrent orders racing for the last unit can't both succeed; the loser gets a clean 400, not a negative-stock bug. Confirmed live with an actual concurrent-request test. Restored automatically if the payment later comes back failed, or the order is cancelled before payment.

**Idempotency**: `payment-return` and `payment-advice` can both fire for the same attempt (or `payment-return` can be replayed). `applyGatewayResult` no-ops once `payment.status` is already `"paid"` — confirmed by literally replaying a successful callback and checking nothing double-applied (coupon `usedCount` included).

**`payment.merchantTxnNo`** (on the `Order` model) is the value sent to ICICI for the *current* attempt — regenerated on retry, since ICICI requires a unique value per `initiateSale` call. `orderNumber` is the permanent customer-facing identifier and never changes.

**Not yet built**: invoice generation. Deliberately deferred, tracked in `TASKS.md`.

## Reward Points

No rate card exists yet from the client — the earn rate, redemption value, and redemption cap in `apps/api/src/utils/rewardPoints.ts` are engineering defaults standing in for a business decision, not a confirmed spec. Revisit before launch.

- **Earn**: 1 point per ₹100 of order total (after discounts), credited when `applyGatewayResult` sees a successful payment. Guest orders earn nothing — there's no account to credit.
- **Redeem**: 1 point = ₹1, sent as `rewardPointsToRedeem` on `POST /api/orders`. Capped at the *lowest* of: what the customer asked for, their actual balance, and 50% of `(subtotal − couponDiscount)` — the 50% cap exists so a coupon plus a large points balance can't zero out an order entirely, which is the usual abuse vector for a referral-funded balance.
- **Atomicity**: redeemed inside the same Mongo transaction as stock reservation, with the identical `$gte`-guarded-update pattern — a race between two requests against the same balance can't double-spend it. Confirmed live: two concurrent orders both redeeming a user's full balance, only one succeeded, final balance landed at exactly 0.
- **Reversal**: any path that releases stock (`payment-return` failure, `payment-advice` failure, cancel, refund) also returns redeemed points via `restoreRewardPoints` — same call sites as `restoreStock`, so the two can't drift.
- **Ledger**: `GET /api/users/me/reward-transactions` — current balance + paginated `RewardTransaction` history. Point *expiry* (the `expiresAt` field already on the model) has no sweep job yet — that needs a cron/scheduler this codebase doesn't have.

## Phase 1 — Go Live (Must Have)

### Features to Build
1. **UI/UX & Branding** — glove-shaped custom cursor, splash/intro animation, interactive mascot, smooth page transitions, mobile-first
2. **Customer Journey** — guest browsing, max 3 clicks to purchase, persistent cart (localStorage/cookie), recently viewed, wishlist, "continue where you left off"
3. **Homepage** — hero banner, featured categories, new arrivals/bestsellers, about section, gallery, testimonials, floating WhatsApp button
4. **Product Pages** — SEO URLs (`/products/karate-gi-red`), image gallery + zoom, size/colour selector, region-based pricing (auto-detect by state), reviews/ratings, JSON-LD structured data, WhatsApp share button
5. **Search & Discovery** — full-text search with suggestions, filters (category, subcategory, size, colour, price, sport), sort options, AI natural language search
6. **Cart & Checkout** — one-page checkout, progress indicator, reward points redemption, promo/coupon codes, multiple saved addresses, ICICI Bank PG payment, invoice download, success sound on payment return
7. **User Account** — OTP login (SMS), registration, My Orders (track + cancel), My Addresses, Reward Points dashboard, Refer & Earn, Edit Profile, language settings
8. **Product Reviews** — star ratings, written reviews, photo/video uploads, purchase-verified badge, helpful votes, admin moderation
9. **CRM & Notifications** — WhatsApp order updates, SMS OTP + order status, Email (registration, confirmation, invoice), abandoned cart recovery (WhatsApp after 1hr)
10. **Multilingual** — EN/HI/MR/TA, hreflang tags, language switcher in header, SEO-friendly language URLs
11. **Super Admin Panel** — review moderation, coupon management, CRM campaigns, blog/content management, Google Shopping feed export, popup/banner management, flash sale timers
12. **Performance & Security** — Core Web Vitals pass (<3s load), image compression + lazy loading, SSL, CSRF/XSS protection, GDPR cookie consent banner

## Phase 2 — Post Launch

1. **Marketing** — SEO (sitemap.xml, robots.txt, meta per page), Google Shopping Feed, Open Graph + Twitter Cards, Referral program with UTM, flash sale banners, blog section, GA4 e-commerce events, Meta Pixel, Google Tag Manager, exit intent popup
2. **AI / WhatsApp Assistant** — WhatsApp chatbot for product queries / order status / size guide, product recommendation engine ("You might also like"), size assistant (height/weight → suggested size)

## Exclusions

- Domain, server, hosting costs (client's responsibility)
- AI/LLM API costs
- External service fees (Twilio, WhatsApp Business API, Meta API)
- All website content: text, images, videos, assets (client provides)
- Dojo creation feature (IKEA-style room builder)

## Running Locally

```bash
pnpm install          # install all deps
pnpm dev              # run web + api concurrently via turbo
pnpm build            # build all packages
pnpm --filter @gokaido/api dev      # api only
pnpm --filter @gokaido/web dev      # web only
```

## Environment Variables

API needs:
- `PORT` — defaults to 3001
- `MONGODB_URI` — MongoDB connection string
- `CORS_ORIGINS` — comma-separated browser origins allowed to call the API (storefront + admin)
- `SITE_URL` — public storefront base URL, used to build absolute links/images in the Google Shopping feed and to redirect the browser back to after payment
- `API_PUBLIC_URL` — this API's own publicly reachable base URL; ICICI redirects the customer's browser to `${API_PUBLIC_URL}/api/orders/payment-return` after payment. Must be a real public URL in UAT/prod (tunnel it, e.g. ngrok, for local testing)
- `ICICI_PG_BASE_URL`, `ICICI_MERCHANT_ID`, `ICICI_AGGREGATOR_ID`, `ICICI_SECRET_KEY` — ICICI Payment Gateway credentials (see `apps/api/.env`, not committed)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`
- `RESEND_API_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

Web (`apps/web`) needs:
- `NEXT_PUBLIC_SITE_URL` — public storefront base URL; used for canonical/Open Graph `metadataBase` and absolute URLs in JSON-LD
- `API_URL` — server-side base URL of the API for product-page fetches (falls back to `NEXT_PUBLIC_API_URL`, then `http://localhost:3001`)

Admin (`apps/admin`) needs:
- `NEXT_PUBLIC_API_URL` — defaults to `http://localhost:3001`

## Data Models Needed (MongoDB)

- `User` — name, mobile (immutable), email, DOB, region, language, referralCode, rewardPoints
- `Product` — name, slug, sport, category, images, variants (size/colour/price), regionPricing, stock
- `Order` — user, items, status, address, payment (ICICI gateway fields — see "Payment Gateway" section above), invoice
- `Cart` — user or guestId, items, expiresAt
- `Address` — user, label, full address fields
- `Review` — product, user, rating, text, mediaUrls, verified, helpful votes, status (pending/approved/rejected)
- `Coupon` — code, type, value, expiry, usageLimit
- `RewardTransaction` — user, points, type, description, expiresAt
- `Referral` — referrer, referee, pointsAwarded
- `Notification` — user, channel, type, status, sentAt
- `CampaignBlast` — segment, channel, message, scheduledAt, status
- `BlogPost` — title, slug, content, language, metaTitle, metaDescription
