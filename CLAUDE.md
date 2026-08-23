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
| Payments | Razorpay (UPI, Card, Net Banking) |
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

## Phase 1 — Go Live (Must Have)

### Features to Build
1. **UI/UX & Branding** — glove-shaped custom cursor, splash/intro animation, interactive mascot, smooth page transitions, mobile-first
2. **Customer Journey** — guest browsing, max 3 clicks to purchase, persistent cart (localStorage/cookie), recently viewed, wishlist, "continue where you left off"
3. **Homepage** — hero banner, featured categories, new arrivals/bestsellers, about section, gallery, testimonials, floating WhatsApp button
4. **Product Pages** — SEO URLs (`/products/karate-gi-red`), image gallery + zoom, size/colour selector, region-based pricing (auto-detect by state), reviews/ratings, JSON-LD structured data, WhatsApp share button
5. **Search & Discovery** — full-text search with suggestions, filters (category, subcategory, size, colour, price, sport), sort options, AI natural language search
6. **Cart & Checkout** — one-page checkout, progress indicator, reward points redemption, promo/coupon codes, multiple saved addresses, Razorpay payment, invoice download, success sound on payment return
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
- `SITE_URL` — public storefront base URL, used to build absolute links/images in the Google Shopping feed
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`
- `RESEND_API_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

Admin (`apps/admin`) needs:
- `NEXT_PUBLIC_API_URL` — defaults to `http://localhost:3001`

## Data Models Needed (MongoDB)

- `User` — name, mobile (immutable), email, DOB, region, language, referralCode, rewardPoints
- `Product` — name, slug, sport, category, images, variants (size/colour/price), regionPricing, stock
- `Order` — user, items, status, address, payment, invoice
- `Cart` — user or guestId, items, expiresAt
- `Address` — user, label, full address fields
- `Review` — product, user, rating, text, mediaUrls, verified, helpful votes, status (pending/approved/rejected)
- `Coupon` — code, type, value, expiry, usageLimit
- `RewardTransaction` — user, points, type, description, expiresAt
- `Referral` — referrer, referee, pointsAwarded
- `Notification` — user, channel, type, status, sentAt
- `CampaignBlast` — segment, channel, message, scheduledAt, status
- `BlogPost` — title, slug, content, language, metaTitle, metaDescription
