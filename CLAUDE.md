# Gokaido D2C Website

Gokaido is a martial arts equipment brand (Karate, Boxing, Taekwondo) building a D2C ecommerce website. This is a **freelance project** — UI/UX is handled by a separate design team delivering Figma files; we handle all development.

## Monorepo Structure

```
apps/
  web/        — Next.js 15 (React 19) frontend, port 3000
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
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`
- `RESEND_API_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

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
