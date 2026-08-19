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
- [ ] Wishlist — `User.wishlist` field exists, no endpoints yet
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
- [x] SEO slug URLs — backend
- [x] Region-based pricing — backend
- [ ] Image gallery + zoom — frontend
- [ ] Size/colour selector — frontend
- [ ] Reviews/ratings display — frontend (Review model exists, no API yet)
- [ ] JSON-LD structured data
- [ ] WhatsApp share button

### 5. Search & Discovery
- [x] Full-text search + filters (category/subcategory/size/colour/price/sport) + sort + pagination — backend
- [ ] Search suggestions/autocomplete
- [ ] AI natural language search

### 6. Cart & Checkout
- [x] Persistent cart, guest + user, merge on login — backend
- [ ] One-page checkout — frontend
- [ ] Progress indicator — frontend
- [ ] Reward points redemption — backend
- [x] Promo/coupon codes — backend (admin CRUD + cart apply/remove, min-order/expiry/usage-limit/per-user-limit/product-category restriction all enforced)
- [x] Multiple saved addresses — backend
- [ ] Razorpay payment integration
- [ ] Order creation from cart
- [ ] Invoice generation/download
- [ ] Success sound on payment return — frontend

### 7. User Account
- [x] OTP login (SMS via Twilio) — backend
- [x] Registration — backend
- [ ] My Orders (track + cancel) — backend
- [x] My Addresses — backend
- [ ] Reward Points dashboard — backend
- [ ] Refer & Earn dashboard — signup bonus logic exists, no history/dashboard endpoint
- [ ] Edit Profile (mutable fields only — name/mobile stay immutable) — backend
- [ ] Language settings — backend

### 8. Product Reviews
- [ ] Star rating + written review submission — backend
- [ ] Photo/video upload — needs S3 presign utility
- [ ] Purchase-verified badge — backend
- [ ] Helpful votes — backend
- [ ] Admin moderation (approve/reject) — backend

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

### 11. Super Admin Panel
- [ ] Review moderation — backend + UI
- [x] Coupon management — backend done (create/list/get/update/deactivate); UI pending
- [ ] CRM campaign management — backend + UI
- [ ] Blog/content management — backend + UI
- [ ] Google Shopping feed export
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
- [ ] Google Shopping Feed
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

- [ ] AWS S3 bucket + upload plumbing
- [ ] AWS EC2 deployment pipeline
- [ ] CI (lint/type-check on push)
