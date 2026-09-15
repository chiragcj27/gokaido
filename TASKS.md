# Gokaido — Build Checklist

Tracks Phase 1 (must-have) and Phase 2 (post-launch) scope from `CLAUDE.md`. Check items off as they land — this should reflect actual state, not intent. Backend items are verified working (type-checked + smoke-tested against the live DB); frontend/admin items are mostly blocked on the Figma delivery.

## Foundation

- [x] `packages/database` — all 12 Mongoose models (User, Product, Order, Cart, Address, Review, Coupon, RewardTransaction, Referral, Notification, CampaignBlast, BlogPost)

## Phase 1 — Go Live

### 1. UI/UX & Branding — blocked on Figma (~1 week out)
- [ ] Custom glove-shaped cursor
- [ ] Splash/intro animation
- [ ] Interactive mascot
- [ ] Page transitions
- [ ] Mobile-first responsive shell

### 2. Customer Journey
- [ ] Guest browsing (no login wall) — frontend
- [ ] Persistent cart — backend done (guest cart via `X-Guest-Id` + merge-on-login), needs frontend wiring
- [ ] Recently viewed — backend + frontend
- [x] Wishlist — backend done (see User Account below), needs frontend UI
- [ ] "Continue where you left off" — frontend

### 3. Homepage — frontend, blocked on design
- [ ] Hero banner
- [ ] Featured categories
- [ ] New arrivals / bestsellers — backend flags exist (`isNewArrival`, `isBestseller`), listing UI pending
- [ ] About section
- [ ] Gallery
- [ ] Testimonials
- [ ] Floating WhatsApp button

### 4. Product Pages
- [x] SEO slug URLs — backend. **Routing approach decided** — see "Product URLs, Variants & Google Shopping Feed" in CLAUDE.md before building the PDP: `/products/{slug}` canonical, `/products/{slug}/{colorSlug}` for color, `?size=` query param for size (never a path segment)
- [x] Region-based pricing — backend
- [ ] Image gallery + zoom — frontend
- [ ] Size/colour selector — frontend (colour switch = real navigation to the colour's URL; size = in-page only)
- [ ] Reviews/ratings display — frontend (Review model exists, no API yet)
- [ ] JSON-LD structured data — frontend; same offer-per-SKU shape as the Shopping feed (see CLAUDE.md), no new backend work
- [ ] WhatsApp share button

### 5. Search & Discovery
- [x] Full-text search + filters (category/subcategory/size/colour/price/sport) + sort + pagination — backend
- [ ] Search suggestions/autocomplete
- [ ] AI natural language search

### 6. Cart & Checkout
- [x] Persistent cart, guest + user, merge on login — backend
- [ ] One-page checkout — frontend
- [ ] Progress indicator — frontend
- [x] Reward points redemption — backend, redeemed at checkout via `rewardPointsToRedeem`, capped/atomic/race-tested. Rate & cap are placeholder defaults, not a client-confirmed spec — see "Reward Points" in CLAUDE.md
- [x] Promo/coupon codes — backend (admin CRUD + cart apply/remove, min-order/expiry/usage-limit/per-user-limit/product-category restriction all enforced)
- [x] Multiple saved addresses — backend
- [x] Payment integration — **ICICI Bank PG, not Razorpay** (client switched providers). Standard/redirect flow, secureHash verified live against UAT. See "Payment Gateway" section in CLAUDE.md
- [x] Order creation from cart — atomic stock reservation (race-tested), guest + authenticated checkout, coupon consumption on payment success
- [x] Retry payment for a failed order — `POST /api/orders/:id/retry-payment`, re-reserves stock/points, fresh gateway attempt
- [ ] Invoice generation/download
- [ ] Success sound on payment return — frontend

### 7. User Account
- [x] OTP login (SMS via Twilio) — backend, customer-facing only. Admin portal (`apps/admin`) uses email+password instead, not OTP — see Super Admin Panel below
- [x] Registration — backend
- [x] My Orders (track + cancel) — `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/cancel` (refunds via ICICI if already paid, releases stock either way)
- [x] My Addresses — backend
- [x] Reward Points dashboard — `GET /api/users/me/reward-transactions` (balance + paginated ledger). Point *expiry* sweep not built — needs a cron/scheduler this codebase doesn't have yet
- [x] Refer & Earn dashboard — `GET /api/users/me/referrals` (referral code, referral history, total points earned)
- [x] Edit Profile (mutable fields only — name/mobile stay immutable) — `PATCH /api/users/me`
- [x] Language settings — covered by `PATCH /api/users/me` (`language` field)
- [x] Wishlist — `GET/POST/DELETE /api/users/me/wishlist` (also listed under Customer Journey above, backend now done)

### 8. Product Reviews
- [x] Star rating + written review submission — `POST /api/reviews`. Gated on the order actually being `delivered` and containing that product; one review per (order, product) via a unique index
- [x] Photo/video upload — `mediaUrls`, via the existing `review` upload purpose (S3 presign, any authenticated user)
- [x] Purchase-verified badge — `isVerifiedPurchase` is always true here since creation requires a real delivered order; no unverified-review path exists yet
- [x] Helpful votes — `POST /api/reviews/:id/helpful`, toggles on/off per user, only on approved reviews
- [x] Admin moderation (approve/reject) — `GET/PATCH /api/admin/reviews`, `apps/api/src/controllers/adminReview.controller.ts`. `Product.avgRating`/`reviewCount` recomputed from scratch (not incremented) on every approve/reject so it can't drift
- [x] Admin can add a review manually — `POST /api/admin/reviews` (e.g. one collected over phone/WhatsApp, no real order). `Review.order`/`user` are now optional; `guestName` + `createdBy` added for this path. Defaults to `approved` status (skips the moderation queue) unless the admin picks otherwise. Uniqueness on (order, product) is now a **partial** index (`{ order: { $exists: true } }`), not a plain sparse one — a sparse compound index only skips a doc missing *every* indexed field, and `product` is always present, so a naive sparse index still collided across multiple order-less admin reviews on the same product (caught live during testing)
- [x] Review moderation UI in `apps/admin` — `apps/admin/app/(dashboard)/reviews`, status filter + approve/reject actions + "New review" manual-entry form (`ReviewForm.tsx`, reuses `MultiImageUpload`)

### 9. CRM & Notifications
- [x] SMS OTP — backend
- [ ] SMS order status — backend
- [ ] WhatsApp order updates — backend
- [ ] Email: registration, confirmation, invoice (Resend) — backend
- [ ] Abandoned cart recovery (WhatsApp, 1hr after) — backend job

### 10. Multilingual
- [ ] EN/HI/MR/TA content plumbing (`next-intl` or similar) — frontend
- [ ] hreflang tags — frontend
- [ ] Language switcher — frontend
- [x] Language field on User — backend

### 11. Super Admin Panel — `apps/admin`, port 3002, email+password login gated to admin/superadmin (`POST /api/auth/admin/login` — not OTP, that's customer-only). Seed an admin via `pnpm --filter @gokaido/api seed:admin`
- [x] Review moderation UI — see Product Reviews above (list, approve/reject, manual add)
- [x] Coupon management — full stack (list/create/edit/deactivate)
- [x] Product management — full stack (list incl. inactive/create/edit/deactivate/reactivate). Category/subcategory picked from dropdowns, not freetext — see below. Product-level and per-variant image uploads wired via the reusable `MultiImageUpload` component (`apps/admin/components/MultiImageUpload.tsx`) — same `uploadImage()` presign+PUT helper as Category/Subcategory's `ImageUpload`
- [x] Category & subcategory management — full stack (`Category`/`Subcategory` models, `/api/categories`, `/api/subcategories`, admin list+form pages with image upload). Product's `category`/`subcategory` fields are still plain slug strings (unchanged shape), now expected to match a real Category/Subcategory slug rather than freetext
- [x] Order management — full stack: `GET/PATCH /api/admin/orders`, filter by status/payment/search, order detail with items/customer/shipping/history, tracking info, guarded status-transition dropdown (server re-validates regardless), cancel/refund via the same ICICI path as customer-initiated cancellation
- [x] Asset store — full stack. `Asset` model (name tag + S3 url/key), `GET/POST/DELETE /api/assets` (name search, admin/superadmin only), `apps/admin/app/(dashboard)/assets` page (upload with a name tag, copy URL, delete). Reuses the existing presign+PUT `uploadImage()` helper via a new `asset` upload purpose. Purpose: pre-upload images once and paste the resulting S3 URL into the product bulk-upload spreadsheet's image columns instead of re-uploading per row
- [x] Product bulk upload via Excel — `POST /api/products/bulk` (multer + `exceljs`, admin/superadmin only), `GET /api/products/bulk-template` for a starter `.xlsx`. One row = one variant, grouped into a product by matching `slug`. `category`/`subcategory` columns are matched case-insensitively against existing active `Category`/`Subcategory` names (not freetext, not created on the fly) — unmatched rows are reported as per-row errors, not silently dropped. A `slug` that already exists on a `Product` is skipped (reported, not overwritten/merged) — re-running a sheet is safe but won't update existing products; that needs a separate edit. Wired into the Products admin page (download template / upload spreadsheet / created-skipped-errors summary)
- [ ] CRM campaign management — backend + UI
- [ ] Blog/content management — backend + UI
- [x] Google Shopping feed export — `GET /api/feeds/google-shopping.xml`, public/unauthenticated, one item per SKU. `google_product_category` mapping is deliberately coarse for now — flagged in `apps/api/src/utils/googleCategory.ts` to refine once there's a real catalog. No admin UI needed (it's a machine-fetched feed, not something an admin edits)
- [ ] Popup/banner management
- [ ] Flash sale timers

### 12. Performance & Security
- [ ] Core Web Vitals pass (<3s load) — frontend
- [ ] Image compression + lazy loading — frontend
- [ ] SSL — deploy-time
- [ ] CSRF/XSS protection — backend (rate limiting exists on OTP only, needs extending)
- [ ] GDPR cookie consent banner — frontend

## Phase 2 — Post Launch

- [ ] SEO (sitemap.xml, robots.txt, meta per page)
- [x] Google Shopping Feed — done in Phase 1 (see Super Admin Panel above); this line is about the feed already existing, not new work
- [ ] Open Graph + Twitter Cards
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

- [x] AWS S3 bucket + upload plumbing — `gokaido-web-storage` bucket (versioned, SSE-S3, public reads under `public/*` only) + CORS for browser presigned uploads + scoped `gokaido-api-runtime` IAM user (PutObject on `public/*` only) wired into `apps/api/.env`. Verified live end-to-end (presign → PUT → public GET). Unblocks Reviews photo/video upload — Product, Category, and Subcategory image uploads are now all wired in the admin panel
- [ ] AWS EC2 deployment pipeline
- [ ] CI (lint/type-check on push)
