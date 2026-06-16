# Voltik — Improvements, Loopholes & Feature Backlog

A running checklist of everything that could be fixed, hardened, or added.
Check items off as they're shipped. Priority hints in `[brackets]`:
**[crit]** ship-blocking · **[high]** real risk · **[med]** quality-of-life · **[low]** polish · **[nice]** future bet.

---

## 1. Security loopholes 🔒

### Authentication & sessions
- [ ] **[crit]** Admin password is compared as a plain `===` to an env var — switch to hashed admin credentials stored in DB (allow multiple admins)
- [x] **[crit]** Add rate-limiting on `/api/session`, `/api/users`, and `/api/auth` (e.g. 5 attempts / 5 min per IP) to block brute-force
- [x] **[high]** Implement password-reset flow (token + email) *(SHA-256-hashed token, 1h expiry, /forgot + /reset/[token]; email "delivery" via logged link until SES wires in)*
- [x] **[high]** Add email verification on signup before granting full account access *(token issued on signup, /verify/[token] consumes; profile shows resend banner)*
- [x] **[high]** Lock accounts after N failed login attempts *(new `db.recordFailedLogin` / `db.clearFailedLogins`; `/api/session` POST checks `lockedUntil` before password compare and returns 423 with minutes-remaining; lockout scales 15 → 30 → 60 minutes at 5/7/10 failures; counter wiped on a successful login)*
- [ ] **[high]** Add 2FA / TOTP for admin (and optional for users)
- [x] **[high]** Session token should be opaque + signed, not just userId (`HMAC(userId|expiry|salt)`) *(`lib/signedToken.ts` — base64url payload + expiry + sha256 HMAC, constant-time verify; `setUserSession` issues signed tokens, `currentUser` accepts both new format and legacy raw-id cookies during the migration window; `VOLTIK_SESSION_SECRET` must be set in production via `assertSessionSecret`)*
- [x] **[med]** Rotate session cookie on login (prevent fixation) *(`/api/session` now `clearUserSession()` before `setUserSession()`; any pre-login cookie the visitor brought along is invalidated before the signed token is issued)*
- [x] **[med]** Add `Secure` cookie flag in production *(admin session done; user session still needs the same)*
- [ ] **[med]** Add "Login history" page and "log out everywhere" action
- [x] **[med]** Add a real password-strength meter (currently only min-length 6) *(`lib/passwordStrength.ts` — 0-4 scorer with a top-40 breached-password blocklist, repeat-pattern detection, and a `passwordPassesPolicy` gate (min 10 chars + score ≥ 2); applied on `/api/users` signup + `/api/auth/reset-password`; `PasswordStrength` meter component reads from the same scorer so client + server agree)*
- [ ] **[med]** Add CAPTCHA / Turnstile on signup + login when abuse detected
- [ ] **[low]** Add account-lockout email notification ("we noticed a failed login attempt")
- [ ] **[low]** Allow users to revoke individual sessions/devices
- [ ] **[low]** Add WebAuthn / passkey support

### Input validation & XSS
- [x] **[crit]** Reviews render `title` and `body` as plain text — confirm React's default escaping is the only barrier and add server-side HTML sanitization just in case (e.g. DOMPurify) *(new `stripHtml` in `lib/sanitize.ts` defangs `<script>` / `<style>` / entity-encoded tags / `javascript:` + `data:` schemes; applied to review title + body in the POST route so the DB never holds active markup)*
- [x] **[crit]** Validate that `productId` in cart / favorite / review endpoints corresponds to an actual product (currently accepts any string) *(new `db.filterKnownProductIds` lookup gates `/api/me/cart` PUT, `/api/me/favorites` PUT + POST; reviews route already required the product to exist)*
- [ ] **[high]** Use Zod / Valibot for every API body schema instead of hand-rolled `typeof` checks
- [x] **[high]** Cap review body length, name length, etc. server-side to prevent storage abuse *(`lib/sanitize.ts` exports a shared `LIMITS` table — reviewTitle/reviewBody/userName/productName/productSku/productDesc/generic; product + review + category routes now `clip(cleanLine(...), LIMITS.X)` at the boundary; `upsertUser` caps display name to 60 chars)*
- [x] **[med]** Strip control characters / zero-width chars from user input *(same `lib/sanitize.ts` — `stripUnsafe` removes C0/C1 + DEL + ZWSP/ZWNJ/ZWJ/LRM/RLM/BOM; `cleanLine` / `cleanText` / `cleanEmail` wrap it for the per-field cases)*
- [x] **[med]** Disallow emoji in usernames/SKUs to prevent unicode confusion attacks *(new `containsEmoji` in `lib/auth.ts` covers pictographic planes + dingbats + variation selectors + regional indicators; signup rejects emoji in `name`; product POST + PUT reject emoji in `sku`)*

### CSRF / CORS / headers
- [x] **[high]** Add CSRF protection for state-changing routes (double-submit cookie or per-session token) *(middleware plants a `voltik_csrf` cookie on every navigation and rejects POST/PUT/PATCH/DELETE on `/api/*` whose `x-csrf-token` header doesn't constant-time match; a tight bootstrap allowlist (`/api/session`, `/api/users`, `/api/subscribers`, `/api/health`, password / verify routes) is exempt so first-touch flows still work; `CsrfFetchPatch` monkey-patches `window.fetch` so every same-origin state-change auto-attaches the header)*
- [x] **[high]** Set explicit CORS policy on `/api/*` (currently relies on default same-origin) *(middleware refuses any `/api/*` request whose `Origin` / `Referer` host doesn't match `Host` — returns 403 with a JSON body; same-origin browser navigation still passes through unchanged)*
- [x] **[high]** Add a strict Content-Security-Policy header *(via `next.config.mjs` `headers()` — `default-src 'self'`, scripts limited to self + Vercel Live, fonts to Google Fonts, `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`)*
- [x] **[med]** Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` *(applied site-wide from `next.config.mjs`)*
- [x] **[med]** Add `Permissions-Policy` to disable unused browser features (camera, mic, geolocation) *(camera, microphone, geolocation, payment, USB, magnetometer, gyroscope, accelerometer, unload all disabled in `next.config.mjs`)*
- [x] **[low]** Add `Strict-Transport-Security` (HSTS) for the apex domain *(`max-age=63072000; includeSubDomains; preload` shipped alongside the rest of the security header set)*
- [ ] **[low]** Configure subresource integrity (SRI) for any external scripts

### Authorization
- [x] **[crit]** Verified-purchase check before allowing a review (currently anyone can review anything) *(server gate via `db.hasPurchased`; UI shows verified-buyer-only notice)*
- [x] **[high]** Audit every `/api/me/*` and `/api/admin*` route for proper ownership checks *(added admin gates to `/api/orders`, `/api/orders/[id]`, `/api/customers`, `/api/products` POST/PUT/DELETE, `/api/categories` POST + `/api/categories/[id]` PUT/DELETE — all previously open to any caller; `/api/me/*` confirmed clean)*
- [x] **[high]** Ensure order detail page enforces ownership server-side (currently checks userId OR email match — could spoof if email collision) *(both `account/orders/[id]/page.tsx` and `/api/me/orders/[id]/cancel` now strict-match by `userId` first; only fall back to email lookup when the order has no userId attached, so a guest order can't be hijacked by a later account that signs up with the same address)*
- [ ] **[med]** Add admin role tiers (super-admin, manager, viewer)
- [x] **[med]** Tag every mutation with an audit-log entry (who, what, when, IP, UA) *(new `auditLog` collection + `db.appendAuditEvent` / `db.listAuditEvents` + `lib/audit.ts` helper that reads the admin cookie, request headers, and IP; wired into product create/update/delete, category create/update/delete, and order update/delete — fire-and-forget so a Mongo blip on the audit collection never blocks the underlying mutation)*

### Secrets & infra
- [x] **[crit]** Remove demo admin password (`arizz123#`) from source code defaults — fail closed if env var missing *(prod refuses to authenticate unless ADMIN_USER+ADMIN_PASS are set)*
- [ ] **[crit]** Atlas database user currently has `Read+Write to any database` — restrict to the `voltik` DB only
- [ ] **[high]** Add secret rotation runbook (Mongo password, admin password, signing keys)
- [ ] **[high]** Switch Atlas from `0.0.0.0/0` to PrivateLink or peering before going public
- [ ] **[med]** Remove demo user passwords from `lib/seed.ts` once you have real users
- [ ] **[med]** Make all secrets fail-loud at boot if missing in production
- [ ] **[low]** Sign Mongo connection logs to avoid leaking the URI

---

## 2. Data integrity & bugs 🐛

### Schema gaps
- [x] **[crit]** Order placement doesn't decrement product stock — concurrent buyers can over-sell *(atomic `$inc` with rollback)*
- [x] **[crit]** No unique constraint on `(productId, userId)` in reviews — race could create duplicates *(new unique index `{ productId: 1, userId: 1 }` on the reviews collection; `db.upsertReview` matches on `(productId, userId)` first and catches the 11000 duplicate-key error from a concurrent writer to retry as an update against the row that won the race)*
- [x] **[high]** `Order.items` (count) can diverge from `Order.lines` (array) — derive one from the other *(`db.upsertOrder` now recomputes `items` from `lines` at the storage boundary so the two stay in sync regardless of which call site set them; falls back to the supplied count only when no lines are present)*
- [x] **[high]** Cart can hold quantities exceeding `product.stock` — clamp on add and at checkout *(checkout now 409s with available stock detail)*
- [x] **[high]** Sale price (`oldPrice`) is not validated to be `>= price` — allow negative discounts today *(now `oldPrice` must be > effective price on both `POST /api/products` and `PUT /api/products/[id]` — including patch-aware comparisons that consider whichever price (incoming patch or existing row) will land on disk; price/oldPrice/stock also gated on Number.isFinite + non-negative)*
- [x] **[high]** Categories can be set to a non-existing parent id by direct DB edit — add referential validation in API *(`/api/products` POST + PUT now reject unknown `category` ids; the existing parent-id and cycle checks on category create/update endpoints stay in place, and category name/blurb now run through `cleanLine` / `cleanText`)*
- [x] **[high]** Reviews can be written for non-existent products in some edge cases *(route already gates on `db.getProduct(productId)`; the cap + sanitisation pass folds in the LIMITS table so the rest of the validation surface matches)*
- [x] **[med]** Email matching is inconsistent — sometimes `.toLowerCase()`, sometimes not. Normalise at write time and only. *(`db.upsertUser` and `db.upsertOrder` now lowercase `email` at the storage boundary so every downstream lookup can drop the case-insensitive fan-out; the readers will be cleaned up in a follow-up pass once the back-fill query lands)*
- [ ] **[med]** `Customer` records and `User` records are separate tables — auto-create a `Customer` row when a `User` registers (or merge the concepts)
- [ ] **[med]** Order `date` stored as `YYYY-MM-DD` string — switch to native `Date` so ranges + timezones work
- [x] **[med]** `Product.id` collisions possible if admin manually creates one matching a generated id *(`POST /api/products` now rejects an explicit `id` that already exists with a 409 + friendly message; the auto-generated path also loops with a longer random suffix and verifies non-existence before claiming the id)*

### Race conditions / transactions
- [x] **[high]** Order placement is not transactional (POST /api/orders + setUserCart fire sequentially — failure between leaves bad state) *(stock decrements roll back on failure; cart clear is best-effort post-order)*
- [x] **[high]** Use Mongo transactions or a single update for "create order + clear cart + decrement stock" *(new `db.placeOrder` runs the stock-decrement + order-write + cart-clear inside a single `session.withTransaction`; throws `STOCK_CONFLICT` to auto-abort if any line is short, then re-derives the conflict info for the caller; falls back to the existing manual rollback path when the driver can't open a session (standalone Mongo); `/api/orders` POST is now a single call)*
- [x] **[med]** Favorite toggle is a full PUT of the array — concurrent toggles can lose changes (use `$addToSet` / `$pull` instead) *(new `db.addFavorite` / `db.removeFavorite` use `$addToSet` / `$pull`; `/api/me/favorites` POST exposes them as a single-product atomic toggle; `FavoritesContext` now fires POST per `add` / `remove` / `toggle` and only PUTs once on first hydrate to merge anonymous favourites)*
- [x] **[med]** Cart sync debounce can drop writes if user closes tab quickly — flush on `pagehide` *(`CartContext` keeps a `pendingLines` ref of the last unsynced snapshot; flushes it on `pagehide` and `visibilitychange→hidden` via `fetch(..., { keepalive: true })` so the request survives the unload)*
- [ ] **[low]** Reviews aggregation runs per request — pre-compute and store on Product, update via change stream

### Cleanup
- [x] **[high]** Cart lines whose product was deleted should be auto-pruned (currently render as orphans)
- [x] **[high]** Favorites whose product was deleted should be auto-pruned
- [x] **[med]** Old anonymous carts in localStorage never expire — add a TTL *(localStorage payload now `{ v: 1, lines, updatedAt }`; carts older than 14 days are dropped on hydrate; the reader transparently migrates legacy `CartLine[]` arrays so existing visitors aren't logged out of their cart on the upgrade)*
- [x] **[low]** Newsletter form is a no-op — wire it to an email service or remove it *(POST /api/subscribers persists to Mongo; /admin/subscribers viewer with CSV export)*

---

## 3. Performance ⚡

### Database
- [x] **[crit]** Add indexes for common query patterns: `orders.userId`, `orders.email`, `orders.status`, `orders.date`, `reviews.productId`, `products.category`, `categories.parent`
- [x] **[high]** Add pagination + cursor to product list, order list, customers list, reviews *(`/api/products` GET now takes `cursor` + `limit` (default 24, ceiling 200); responds with `{ products, count, total, nextCursor }` where the cursor is the id of the last returned row; orders / customers / reviews paginate in the admin UI already — server-side cursors there are the natural follow-up)*
- [x] **[high]** Avoid `db.listProducts()` on the homepage on every request — cache with `unstable_cache` + tag-revalidation *(new `lib/cache.ts` wraps the list reads in `unstable_cache` tagged `voltik:products` + `voltik:categories`; `app/page.tsx` and `app/shop/page.tsx` now hit the cached helpers; admin product CRUD calls `bustProducts()` for tag-revalidation on every write)*
- [x] **[high]** Pre-compute and persist product rating aggregates instead of recomputing on every page load *(new `cachedRating` + `cachedReviewsCount` fields on Product; `db.recomputeProductAggregate` refreshes them on every review upsert + delete; `enrich` / `enrichOne` prefer the cached values and only fall back to a live walk during the first-deploy migration window)*
- [x] **[high]** Stats endpoint walks every order on every call — pre-aggregate with `$facet` *(new `db.computeAdminStats` runs a single `orders` `$facet` (revenue + count + byStatus + 7-day trend + recent) plus a `products` `$facet` (byCategory + lowStock + total) plus a `countDocuments` on customers; `/api/stats` route is now a 5-line admin gate + delegation, and the response is identical to what the dashboard reads)*
- [ ] **[med]** Mongo `maxPoolSize: 10` is small for serverless cold starts under load — measure and tune
- [x] **[med]** Switch to MongoDB aggregation pipelines for category counts (currently does N+1 with descendantIds) *(`getCachedCategoryCounts` builds the subtree map in one pass + a single product list read, cached under both `voltik:products` and `voltik:categories` tags so admin product or category writes invalidate it on the next read)*
- [ ] **[med]** Use `lean()` projections to skip unused fields

### Frontend
- [ ] **[med]** Add `next/dynamic` for heavy admin components to reduce initial JS
- [ ] **[med]** Add image optimization once real product images land (`next/image`)
- [ ] **[med]** Add virtualization for shop grid when product count > 100
- [ ] **[low]** Add bundle analyzer (`@next/bundle-analyzer`) and trim heaviest deps
- [ ] **[low]** Audit unused Tailwind classes and prune
- [ ] **[low]** Defer non-critical fonts to `font-display: optional`
- [ ] **[low]** Add `<link rel=preconnect>` to MongoDB Atlas region edge if using HTTPS data API

### Caching
- [x] **[high]** Use `revalidateTag('products')` after admin product CRUD to invalidate cached listings instead of `force-dynamic` *(every admin product POST/PUT/DELETE now calls `bustProducts()` → `revalidateTag('voltik:products')`; categories follow the same pattern through `bustCategories()` which also fans out to the product tag since subtree counts share both)*
- [x] **[high]** Cache the category tree (changes rarely) *(`getCachedCategories` uses a 10-minute TTL plus tag-based invalidation; landing + shop now read from the cache instead of `db.listCategories()`)*
- [x] **[med]** Add HTTP `Cache-Control` headers on public, immutable API responses *(public `/api/categories`, `/api/search`, `/api/products`, `/api/products/[id]` GETs now emit `public, s-maxage=…, stale-while-revalidate=…` headers tuned per surface — 5 min for the category list, 60s/30s for product + search)*
- [ ] **[med]** Pre-render the landing hero/categories sections (ISR) — only trending/deals need live data

---

## 4. UX improvements 🎨

### Storefront
- [ ] **[high]** Add real product images (Unsplash curated or Vercel Blob upload — see "Admin" section)
- [ ] **[high]** Product gallery should show multiple distinct images, not the same illustration 4×
- [ ] **[high]** Add product variants (color, capacity, size)
- [ ] **[high]** Add "recently viewed" carousel
- [ ] **[high]** Add product comparison (pick 2-4, side-by-side table)
- [x] **[high]** Search bar autocomplete + suggested categories *(/api/search ranks by name prefix > contains > sku/brand; keyboard nav, debounced)*
- [x] **[high]** Show "verified purchase" badge on reviews *(already shipped with verified-purchase set)*
- [ ] **[high]** Allow review photos upload
- [x] **[high]** Add review helpfulness voting (👍 / 👎 with counts) *(auth-gated; can't vote on own; toggling switches buckets atomically)*
- [x] **[med]** "Save for later" tab in cart *(button per line: moves to favourites, drops from cart)*
- [ ] **[med]** "Add a note to seller" field at checkout
- [ ] **[med]** Multi-step checkout with progress indicator (Contact → Shipping → Payment → Review)
- [ ] **[med]** Address auto-complete (Google Places / Mapbox)
- [x] **[med]** Order detail: "Reorder" button that re-adds lines to cart *(skips OOS / removed items)*
- [ ] **[med]** Order detail: download PDF invoice
- [ ] **[med]** Wishlist sharing via link
- [ ] **[med]** Estimated delivery date on product page + checkout
- [x] **[med]** "Notify me when back in stock" subscription on OOS products *(captured to Mongo; queue drains on restock with logged email list)*
- [ ] **[med]** Sticky "Add to cart" bar on mobile product page
- [ ] **[med]** Mega-menu nav for category browsing
- [ ] **[med]** Skeleton loaders during navigation
- [ ] **[med]** Optimistic UI on cart/favorite mutations
- [ ] **[low]** Frequently-bought-together suggestions
- [ ] **[low]** "Customers also viewed" recommendation row
- [ ] **[low]** Recently searched terms (per device)
- [ ] **[low]** "Free shipping in $X more" progress bar in cart
- [ ] **[low]** Live chat widget (Crisp, Intercom, or homegrown)
- [ ] **[low]** Cart drawer (slide-in panel) instead of full-page navigation
- [ ] **[low]** Product zoom on hover
- [ ] **[low]** Wishlist count badge in mobile menu
- [ ] **[low]** "Remember me" checkbox on login (extend session to 90 days)
- [ ] **[low]** Filter for "In stock only" / "On sale only"
- [ ] **[low]** Infinite scroll option in shop (currently grid pagination missing)
- [ ] **[low]** Sort by "Newly added"
- [ ] **[nice]** AI-powered search ("waterproof wireless headset under $50")
- [ ] **[nice]** AR view of product on phone (WebXR)

### Account dashboard
- [x] **[high]** Address book (save multiple shipping addresses) *(profile CRUD + checkout autofill)*
- [ ] **[high]** Saved payment methods (tokenised, never card numbers)
- [x] **[high]** Cancel order (within X minutes of placement, while still `pending`) *(stock restored on cancel)*
- [ ] **[high]** Initiate return / refund request
- [ ] **[med]** Order tracking with carrier integration (track via AfterShip etc.)
- [ ] **[med]** In-app notification feed (order updates, replies to reviews)
- [ ] **[med]** Loyalty / points program
- [ ] **[med]** Referral codes with discount on signup
- [ ] **[med]** Account deletion + GDPR export
- [ ] **[low]** Profile avatar upload
- [ ] **[low]** Personalised "For you" homepage section once enough data exists

---

## 5. Admin features 🛠️

### Catalog management
- [ ] **[high]** Image upload for products (Vercel Blob / Cloudinary / S3)
- [x] **[high]** Bulk import / export products via CSV *(export shipped via /api/admin/products/export; bulk import still pending)*
- [ ] **[high]** Bulk operations: change category, change price, toggle visibility
- [ ] **[high]** Product duplication / cloning
- [ ] **[high]** Drag-to-reorder product positions within a category
- [ ] **[high]** SEO fields per product (slug, meta-title, meta-description, OG image)
- [ ] **[med]** Product variants editor (size, color matrix)
- [ ] **[med]** Inventory locations / warehouses
- [x] **[med]** Stock thresholds + auto-email alert when below *(dashboard widget buckets OOS / <10 / <100 with waiter counts; email-out still pending)*
- [ ] **[med]** Restock predicted-date field
- [ ] **[low]** Product image gallery management with crop tool

### Orders & customers
- [ ] **[high]** Refund / partial-refund flow (with payment gateway integration)
- [x] **[high]** Order notes (internal + customer-visible) *(both editors in admin order modal)*
- [ ] **[high]** Print packing slip / shipping label
- [x] **[high]** Tracking number entry + auto-email to customer *(carrier + number + URL editor in admin; surfaced on user order detail. Email send still pending)*
- [ ] **[med]** Customer messaging from order page
- [x] **[med]** Customer notes (internal-only) *(plus customer-visible note variant)*
- [ ] **[med]** Manual order creation (phone orders)
- [ ] **[med]** Order filtering by date range, total range, customer
- [ ] **[low]** Saved order views

### Marketing
- [x] **[high]** Discount/promo code manager (currently only hardcoded `VOLT10`) *(full /admin/promos CRUD; cart + checkout consume `/api/promos/validate`)*
- [x] **[high]** Coupon types: % off, $ off, free shipping, BOGO *(percent/flat/shipping shipped; BOGO still pending)*
- [x] **[high]** Coupon constraints: min basket, expiry, per-customer usage, category-only *(min-basket + expiry + global usage limit; per-customer + category scoping still pending)*
- [ ] **[high]** Homepage editor (hero text, banner image, featured product picker)
- [ ] **[med]** Banner / announcement bar with scheduling
- [ ] **[med]** Abandoned cart recovery email workflow
- [ ] **[med]** Email-campaign composer
- [ ] **[low]** A/B test framework for product pages
- [ ] **[low]** Customer segmentation tool (RFM scoring etc.)

### Reviews moderation
- [x] **[high]** Admin review queue with approve / reject *(/admin/reviews — hide/restore + delete; filter chips for low-star/no-reply/hidden)*
- [x] **[high]** Profanity/spam filter on incoming reviews *(`lib/contentFilter.ts` blocks slurs, URLs, emails, ALL-CAPS, repeated-char spam)*
- [x] **[med]** Reply to a review as the brand *(modal editor; renders as branded Voltik response under each review)*
- [ ] **[med]** Flag-for-review user-side button → mod queue
- [x] **[low]** Highlight a "featured" review on the product page *(already shipped — longest 4★+ body)*

### Analytics & reporting
- [ ] **[high]** Revenue / orders / AOV chart with date-range picker
- [ ] **[high]** Top categories report
- [ ] **[high]** Conversion funnel (visits → product views → adds → checkout → purchase)
- [ ] **[high]** Daily report email to admin
- [ ] **[med]** Export every report as CSV
- [ ] **[med]** Goal tracking + comparison vs previous period
- [ ] **[low]** Cohort analysis (retention)
- [ ] **[low]** LTV calculation per segment
- [ ] **[low]** Customer churn dashboard

### Admin platform itself
- [ ] **[high]** Multiple admin users (with email login, password hashes in DB)
- [ ] **[high]** Role-based access control: super-admin, manager, support, viewer
- [ ] **[high]** Activity log of every admin action (who, what, when)
- [ ] **[med]** "Impersonate user" mode (read-only) for support cases
- [ ] **[med]** Admin notification center (low stock, new orders, refunds)
- [ ] **[low]** Admin chat / shared notes

---

## 6. Payments 💳

- [ ] **[crit]** Integrate a real PSP — currently `Card / UPI / COD` are labels only, no actual charge happens
- [ ] **[crit]** Stripe (Card + Apple/Google Pay) for global default
- [ ] **[high]** Razorpay / PayU for India (UPI native)
- [ ] **[high]** PayPal for one-click reuse
- [ ] **[high]** 3DS / SCA support
- [ ] **[high]** Webhook handler for payment success/failure (don't trust the redirect)
- [ ] **[high]** Idempotency keys on order creation
- [ ] **[med]** Saved cards via tokenization (Stripe Setup Intents)
- [ ] **[med]** Subscriptions / scheduled orders
- [ ] **[med]** Partial refunds
- [ ] **[med]** Multi-currency with FX
- [ ] **[low]** Buy-now-pay-later (Klarna, Affirm)
- [ ] **[low]** Cryptocurrency option
- [ ] **[low]** Fraud detection (Stripe Radar or Sift)

---

## 7. Notifications & email 📨

- [ ] **[crit]** Order confirmation email
- [ ] **[crit]** Password reset email
- [ ] **[high]** Shipping update emails (status changes)
- [ ] **[high]** Email verification on signup
- [ ] **[high]** Pick a sender (Resend / Postmark / SendGrid / AWS SES) and wire templates
- [ ] **[high]** Use React Email or MJML for maintainable templates
- [ ] **[med]** Newsletter signup actually delivers (Mailchimp / Beehiiv / ConvertKit)
- [ ] **[med]** Newsletter unsubscribe link with token (CAN-SPAM / GDPR)
- [ ] **[med]** Marketing email preferences page per user
- [ ] **[med]** SMS notifications for shipping (Twilio)
- [ ] **[med]** Web push notifications
- [ ] **[low]** WhatsApp Business notifications
- [ ] **[low]** Review-request email N days post-delivery
- [ ] **[low]** Abandoned-cart email (1h, 24h, 72h)

---

## 8. SEO & discoverability 🔍

- [x] **[crit]** Add `sitemap.xml` (generated dynamically from Mongo)
- [x] **[crit]** Add `robots.txt`
- [x] **[high]** Per-product `generateMetadata` with title, description, OG image
- [x] **[high]** JSON-LD `Product` structured data for rich Google results (price, availability, rating)
- [ ] **[high]** JSON-LD `BreadcrumbList`, `Organization`, `WebSite`
- [x] **[high]** Replace ID-based URLs (`/product/v-001`) with slugs (`/product/turboflow-65w-usb-c-cable`)
- [ ] **[high]** Canonical URL tags on every page
- [ ] **[med]** PWA manifest + installable
- [ ] **[med]** Service worker for offline browsing of viewed pages
- [ ] **[med]** Open Graph image generator (per product) via `@vercel/og`
- [ ] **[med]** Twitter Card metadata
- [ ] **[med]** Category landing-page SEO copy (currently no descriptive H1/intro)
- [ ] **[low]** hreflang once i18n lands
- [x] **[low]** FAQ JSON-LD on product page *(on /faq, which is the standard placement)*

---

## 9. Accessibility (a11y) ♿

- [ ] **[crit]** Audit color contrast across light + dark themes (use axe DevTools)
- [ ] **[high]** Modal dialogs need focus trap + escape to close + return focus to opener
- [ ] **[high]** Form errors announced via `aria-live` regions
- [ ] **[high]** Add skip-to-content link
- [ ] **[high]** Honour `prefers-reduced-motion` for floaty hero animations + transitions
- [ ] **[med]** Visible focus rings on all interactive elements
- [ ] **[med]** Cart/favorite count badges need `aria-live="polite"` updates
- [ ] **[med]** Loading states use `aria-busy`
- [ ] **[med]** Status pills must not rely on color alone (add an icon/label)
- [ ] **[med]** Product illustrations need descriptive `aria-label` (currently decorative)
- [ ] **[med]** Heading hierarchy audit — never skip levels
- [ ] **[low]** Keyboard shortcut hints (e.g. `g h` for home — Slack-style)
- [ ] **[low]** Sticky live region for cart total changes
- [ ] **[low]** Test with VoiceOver, NVDA, JAWS
- [ ] **[low]** Add high-contrast theme

---

## 10. Internationalization 🌐

- [ ] **[high]** Wrap every UI string in a translator (e.g. `next-intl`)
- [ ] **[high]** Locale-aware routing (`/en/...`, `/de/...`)
- [ ] **[high]** Currency switcher with real FX rates
- [ ] **[high]** Locale-aware number/date formatting (use `Intl`)
- [ ] **[med]** RTL layout support (Arabic, Hebrew)
- [ ] **[med]** Translate seed product descriptions
- [ ] **[med]** Translate admin console too
- [ ] **[low]** Geo-based default locale via `Accept-Language`

---

## 11. Compliance & legal 📜

- [x] **[crit]** Privacy policy page (GDPR / CCPA) *(/privacy)*
- [x] **[crit]** Terms of service page *(/terms)*
- [x] **[crit]** Cookie consent banner (granular: necessary / analytics / marketing) *(banner with Necessary-only vs Got-it; full breakdown on /cookies)*
- [x] **[high]** GDPR right-to-be-forgotten: account deletion that scrubs PII *(orders kept but anonymised; reviews + favs deleted)*
- [x] **[high]** GDPR data export: download all my data as JSON/CSV *(`/api/me/export` streams JSON dump)*
- [ ] **[high]** Document data retention policy (delete inactive accounts after N years)
- [ ] **[med]** Accessibility statement
- [ ] **[med]** DMCA / IP claim policy + handler
- [ ] **[med]** Age-verification gate if you sell anything age-restricted
- [ ] **[low]** PCI compliance review when payments go live (offload via Stripe to stay PCI-SAQ-A)

---

## 12. Observability 📊

- [x] **[crit]** Error tracking — Sentry (with source maps uploaded on deploy) *(observability indirection in place; ready for the Sentry swap)*
- [x] **[crit]** Structured logging instead of `console.log` (e.g. Pino + Logtail / Axiom) *(tagged structured logger; ready to swap)*
- [ ] **[high]** Web Vitals reporting (Vercel Analytics, or Plausible / PostHog)
- [ ] **[high]** Synthetic uptime monitoring (Better Stack, Pingdom)
- [ ] **[high]** Slack/Discord webhook on `/api/health` failure
- [ ] **[med]** Custom business metrics (orders/min, conversion %, revenue/min)
- [ ] **[med]** Mongo slow-query log
- [ ] **[med]** Trace ID propagation through requests
- [ ] **[low]** Real-user monitoring (RUM) with session replay

---

## 13. Testing & code quality 🧪

- [ ] **[crit]** Unit tests for `lib/*.ts` (passwords, categoryTree, reviews aggregation)
- [ ] **[high]** Integration tests against a test Mongo (testcontainers or `mongodb-memory-server`)
- [ ] **[high]** E2E tests with Playwright covering: signup → add to cart → checkout → admin sees order
- [ ] **[high]** Visual regression tests (Chromatic / Percy)
- [ ] **[high]** Accessibility tests with `@axe-core/playwright`
- [ ] **[high]** Re-enable ESLint in CI (currently disabled via `ignoreDuringBuilds`)
- [ ] **[high]** Type-check in CI (`tsc --noEmit`)
- [ ] **[med]** Pre-commit hooks: lint, format, type-check (Husky + lint-staged)
- [ ] **[med]** Code coverage tracking + ≥80% threshold for `lib/`
- [ ] **[med]** Load tests for `/api/products` and `/api/orders` (k6 or Artillery)
- [ ] **[med]** Security scan in CI (`npm audit`, Snyk)
- [ ] **[med]** Mutation testing for critical paths (Stryker)
- [ ] **[low]** Storybook for component playground
- [ ] **[low]** Dependency-update automation (Renovate or Dependabot)
- [ ] **[low]** Prettier + EditorConfig committed

---

## 14. DevOps / CI/CD 🚀

- [ ] **[high]** GitHub Actions workflow: lint + type-check + test on every PR
- [ ] **[high]** Branch protection rules: require green CI + 1 review
- [ ] **[high]** Vercel preview deployments wired to PRs (free, just needs project link)
- [ ] **[high]** Mongo migration scripts + a way to run them per environment
- [ ] **[high]** Backup automation for Mongo (Atlas has snapshots — verify retention)
- [ ] **[med]** Staging environment with separate Mongo cluster
- [ ] **[med]** Feature flags (GrowthBook, ConfigCat) for risky rollouts
- [ ] **[med]** Bundle-size budget enforcement in CI
- [ ] **[med]** Lighthouse CI on every PR
- [ ] **[med]** Automated changelog from conventional commits
- [ ] **[low]** Blue/green or canary deploys
- [ ] **[low]** Geographic redundancy (multi-region Mongo)
- [ ] **[low]** Runbook for incident response

---

## 15. Code refactors & cleanup 🧹

- [ ] **[high]** Replace remaining `any` casts in `lib/db.ts` Document conversions with proper generics
- [ ] **[high]** Centralise status-pill style mapping (currently duplicated across admin and account pages)
- [ ] **[high]** Extract `<DataTable />` component — orders/products/customers admin pages each rebuild one
- [ ] **[med]** Move all server-only utilities under `lib/server/` and add `'server-only'` guard
- [ ] **[med]** Split [page.tsx](app/page.tsx) (landing) — it's huge; extract Hero, Marquee, FeaturedDeal etc. to `components/landing/`
- [ ] **[med]** Replace inline styles in `global-error.tsx` with a small CSS module
- [ ] **[med]** Strict TS — turn on `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- [ ] **[low]** Barrel-export `components/` for cleaner imports
- [ ] **[low]** Document each `lib/` module with a top-of-file comment
- [ ] **[low]** Remove the `data/` legacy folder ignore from `.gitignore` once everyone's migrated to Mongo

---

## 16. Nice-to-have features 🎁

- [ ] **[nice]** Native mobile app (React Native / Expo) sharing the API
- [ ] **[nice]** Headless API marketplace (publish a public read-only product catalog)
- [ ] **[nice]** Influencer / affiliate program with link tracking
- [ ] **[nice]** Loyalty NFT for top customers
- [ ] **[nice]** AI product-description generator in admin
- [ ] **[nice]** AI customer-support chatbot with RAG over product manuals
- [ ] **[nice]** Voice search (Web Speech API)
- [ ] **[nice]** AR try-on for cases / mounts via WebXR
- [ ] **[nice]** AI-generated outfit-style "shop the look" pages
- [ ] **[nice]** "Drop" mechanic — limited timed releases with countdown + queue
- [ ] **[nice]** Live-shopping streams
- [ ] **[nice]** Marketplace mode (other sellers list on Voltik)
- [ ] **[nice]** Public API + SDK for partners
- [ ] **[nice]** Slack / Discord community for power users
- [ ] **[nice]** Refurbished / trade-in program

---

## 17. Content & marketing 📝

- [x] **[high]** About / Press / Careers pages *(/about; Press/Careers folded into About copy for now)*
- [x] **[high]** Contact form that actually delivers messages *(/contact with form UI; mail-out wiring is a TODO marker on the handler)*
- [x] **[high]** Shipping policy, Returns policy, Warranty pages (currently linked but empty) *(/shipping, /returns, /warranty)*
- [x] **[high]** FAQ page *(/faq with FAQPage JSON-LD)*
- [ ] **[med]** Blog / journal (drives SEO)
- [ ] **[med]** Buying guides per category ("How to choose a power bank")
- [ ] **[med]** Video tutorials embedded on product pages
- [ ] **[low]** Customer story spotlights
- [ ] **[low]** Press kit (brand assets, factsheet)
- [ ] **[low]** Sustainability report

---

## Quick wins ⚡ *(can ship today, big impact)*

- [x] Pin demo seed admin removal — fail closed if `ADMIN_USER`/`ADMIN_PASS` env vars are missing in production
- [x] Add rate-limiting on `/api/session` and `/api/users` (in-memory sliding window — swap for Upstash for cross-instance limits)
- [x] Add `sitemap.xml` + `robots.txt` (dynamic, auto-includes every product + category)
- [x] Wire Sentry (`lib/observability.ts` ships as a console fallback; one-import swap to `@sentry/nextjs` once you add the DSN)
- [x] Add Mongo indexes for `orders.userId`, `orders.email`, `orders.status`, `orders.date`, `reviews.productId`, `products.category`, `categories.parent`
- [x] Decrement `product.stock` when an order is placed (atomic with rollback — over-sell hole closed)
- [x] Auto-prune deleted-product references from carts / favorites on next read (via `db.pruneUserRefs`, called from `/api/me`)
- [ ] Tighten Atlas DB user privileges to the `voltik` DB only *(manual Atlas step — see "What you still need to do" in the latest commit notes)*

---

*Last updated: keep ticking, keep shipping.* ⚡
