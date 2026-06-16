# Voltik — Design Improvements & Visual Polish

A separate, design-focused checklist. Where [IMPROVEMENTS.md](IMPROVEMENTS.md) covers
*what the app does*, this covers *how it feels* — visual hierarchy, motion, density,
data storytelling, and the constantly-rotating product ads you asked for.

Priority hints in `[brackets]`:
**[must]** keeps the brand competitive · **[should]** clear quality jump · **[nice]** delightful polish · **[wow]** "screenshot-worthy" moments.

---

## 1. Landing page rebuild 🚀

The current landing has the bones (mesh hero, floating cards, category grid, testimonials).
This section turns it into a destination people *want* to share.

### Above the fold — rotating product ads
- [x] **[wow]** **Hero ad carousel**: a full-bleed slot at the top that cross-fades between 4-6 hero product ads every 5 seconds, with pause-on-hover and swipe controls. Each slide has its own gradient, headline, supporting tagline, and CTA button.
- [x] **[wow]** **Floating "currently trending" widget** in the hero corner that fades to a different product every 3 seconds — small card, product illustration, name, "X bought today"
- [x] **[wow]** **3D Coverflow product strip** below the hero — products tilt as they scroll past, foreground item is large + crisp, edges blur *(rotateY tilts + depth blur per offset; keyboard / arrow / touch nav; reduced-motion flattens to a row)*
- [x] **[should]** **Animated category showcase**: 8 category tiles that auto-pulse in sequence (Charging → Audio → Cases…), each pulse fades the tile into its top-selling product for 1.5s then fades back *(reduced-motion + offscreen pause respected)*
- [x] **[should]** **Bento grid for "what's hot"** — one large hero spot (rotating product), 2 medium spots, 4 small ones. Each cell crossfades on its own timer (12s, 8s, 6s) so the page is always moving but not chaotic *(disjoint pools so no two cells show the same product)*
- [x] **[nice]** **Sticky promo bar at top**: scrolling marquee with "Free shipping over $50 · 30-day returns · New: Volt Buds Pro 2 — Shop now"
- [x] **[nice]** **Floating ad pop-card** that slides up from bottom-right every 25 seconds: "🔥 PowerCore 20K is down 30% — 04:12 left" with close button + jump to product
- [x] **[nice]** **Live "Just purchased" ticker** along bottom of hero ("Alex from Singapore just got Volt Buds Pro 2"). Cycles every 4 seconds. Pulls real recent order data.
- [x] **[wow]** **Tilted phone mockup mid-hero** with product on its screen — auto-cycles between 5 products, each entrance is a slide-in + glow burst *(SVG-only phone chassis; notch + tabs; reduced-motion freezes it on the first product)*

### Hero copy & visuals
- [x] **[must]** **Typewriter / morphing headline** — base line is "Power up your". The second word rotates every 4s through: *mobile life · workflow · creative · commute · weekend · battery anxiety*
- [x] **[should]** Add a **15-second product showcase video** (autoplay muted loop) layered behind the hero with a subtle dark overlay *(`HeroShowcaseVideo` — programmatic stand-in built from drifting gradient blobs + hue-rotate + scanline sweep + vignette; corner pill shows Live · 00:15 with play/pause toggle; freezes for prefers-reduced-motion; real `<video>` slots in by replacing the layers)*
- [x] **[should]** Replace the static "500K+ customers" stat row with **odometer-counting numbers** that animate up on scroll
- [x] **[nice]** Add **a faint particle field** in the hero background (drifting dots) — pure CSS, doesn't tank perf *(18 deterministic dots with `motion-reduce:hidden`)*

### Below the fold — make it scroll-worthy
- [x] **[must]** **"Build your charging kit" interactive builder** — pick phone → pick cable type → pick power bank size → see a bundle assemble in real-time with running price total *(4-step wizard + sticky kit summary + 5% bundle discount when all required steps filled; haptic on add-to-cart)*
- [x] **[should]** **Side-scrolling deal strip** ("FLASH DEALS — ends in 02:14:47") — countdown timer + 5 product cards, swipe or auto-advance every 4s with a left-flowing slide *(arrow keys + manual nav buttons + pause-on-hover)*
- [x] **[should]** **Category mosaic** with photo-style overlap (not flat tiles) — slightly rotated cards layered with hover-to-front interaction *(deterministic Polaroid tilts; hover snaps the tile upright and lifts it to the front)*
- [x] **[should]** **Editorial story sections** — a 2-column layout ("How we engineered the GaN Cube" with image left, copy right) breaks up the catalog feel and gives the brand a voice
- [x] **[nice]** **Comparison cards**: "Our 65W cable vs the average $5 cable" with 3 quick spec bars showing the gap
- [x] **[nice]** **Customer photo wall** — masonry grid of user-submitted photos with their reviews on hover *(`CustomerPhotoWall` — CSS-columns masonry with deterministic per-product gradient "photos" as a UGC stand-in; reviewer chip always visible, slide-up excerpt + city on hover/focus; varying spans for the rhythm)*
- [x] **[nice]** **Award / press strip** — fake but believable: "As featured in The Verge / Wired / Engadget" logos in muted greyscale, color on hover
- [x] **[wow]** **Interactive product spec hover**: hover a featured product and the empty space around it fills with floating spec callouts (15W · IPX5 · 30hr · ANC) that arrange themselves like sci-fi UI *(feature lines regex-mined for unit specs and arranged on an orbit; reduced-motion renders nothing)*

### Newsletter & footer polish
- [x] **[should]** Newsletter section gets a **gradient glow border** and a 10%-off badge prominently displayed *(brand→accent2 halo behind the card + tangerine 10% pill on top)*
- [x] **[nice]** Newsletter input shows **a celebratory micro-animation** on submit (confetti burst from the button) *(`Confetti` now accepts `originRef` so the burst spawns at the submit button)*
- [x] **[nice]** Footer **adds a giant marketing logo** that fades up as you scroll into it (parallax-style) *(scroll-driven progress writes opacity + translate-Y on a gradient-filled VOLTIK wordmark; tagline rises into place last)*

---

## 2. Product ad system — constantly rotating 🎞️

A dedicated subsystem so any page can drop in an "ad" component that auto-rotates.
Reusable across landing, shop, cart "you might also like", and account dashboard.

- [x] **[must]** Build a single **`<RotatingAd>`** component that takes a list of products and a transition style: `fade`, `slide`, `cube`, `stack`, `flip` *(generic over `T`; all five transitions implemented; pause-on-hover + offscreen + reduced-motion respected)*
- [x] **[must]** **Promotional content model** — admin can create "Ad" entries (image/gradient + headline + CTA + product reference + active dates + priority). Store in `ads` collection. *(end-to-end: `Ad` type in lib/types, `listAds`/`listActiveAds`/`upsertAd`/`deleteAd` in db.ts, `/api/ads` + `/api/ads/[id]` routes, full CRUD at `/admin/ads` with placement filter, gradient picker and live preview, plus `PromoSlot` rendering active rotator/banner ads above the editor's-picks strip on the landing)*
- [x] **[should]** **Auto-rotation timer with intersection-observer pause** — stop the rotation when the component is offscreen (saves CPU)
- [x] **[should]** **Pause-on-hover** with subtle progress indicator (thin bar at the bottom)
- [x] **[should]** **Swipeable on touch** with snap points + momentum
- [x] **[nice]** **Ken Burns effect** on each slide's image (slow zoom + pan) for cinematic feel
- [x] **[nice]** **Crossfade with depth** — outgoing slide fades + scales down to 95%, incoming fades + scales up from 105% *(applied on the HeroCarousel)*
- [x] **[nice]** **Liquid morph between slides** — SVG path morph for the background gradient between products *(opt-in `liquidBackground` on RotatingAd; SMIL `<animate>` interpolates between 5 blob paths per slide)*
- [x] **[wow]** **Spotlight cursor** — a soft circular glow follows the mouse over the ad, illuminating the product underneath *(reusable `SpotlightCursor` wrapper, plus-lighter blend, disabled on touch + reduced-motion)*
- [x] **[wow]** **Parallax layers** — product floats slightly faster than background as the user scrolls past the ad *(RAF-throttled scroll listener on RotatingAd; `parallax` prop = max pixel drift; reduced-motion bypasses)*
- [x] **[wow]** **Sound-effect option** (off by default, opt-in) — subtle whoosh on slide change for that Apple-keynote feel *(corner mute toggle synthesises a 880→440Hz sweep via Web Audio; lazy AudioContext)*

---

## 3. Motion & micro-interactions 🎬

### Globally apply
- [x] **[must]** **Page-transition fade** when navigating (50ms, just enough to feel smooth)
- [x] **[must]** **Respect `prefers-reduced-motion`** everywhere — kill all auto-rotation, parallax, ambient particles when set
- [x] **[should]** **Hover-lift on every card** (translate-y -4px + shadow grow over 200ms)
- [x] **[should]** **Magnetic buttons** — primary CTAs attract the cursor by 4-8px when within 60px
- [x] **[should]** **Number-count-up animation** on KPIs as they scroll into view
- [x] **[nice]** **Cursor-aware tilt** on hero floating cards (3D tilt following mouse position) *(reusable `TiltCard` wrapper with glare highlight; disabled on touch + reduced-motion)*
- [x] **[nice]** **Confetti burst** on first successful order / signup
- [x] **[nice]** **Heart-burst animation** when favoriting — particles fly outward + spring-scale
- [x] **[wow]** **"Add to cart" fly animation** — product image arcs from product card → cart icon in nav, cart badge does a quick wiggle on arrival
- [x] **[wow]** **Scroll-driven gradient shift** — the bg-mesh hue rotates 0-30deg as user scrolls down the landing *(composes with the time-of-day hue via CSS calc())*

### Skeletons + loading
- [x] **[must]** **Skeleton loaders** for product grids, dashboard tables, and cart while data loads (instead of empty space)
- [ ] **[should]** **Progressive image blur-up** for product photos (Plaiceholder or LQIP) once real images land
- [x] **[nice]** **Shimmer effect** on skeleton placeholders (gentle diagonal sweep)

### Micro-interactions on form elements
- [x] **[should]** **Floating labels** that lift on focus
- [x] **[should]** **Inline success ticks** when a field validates (green check that pops in)
- [x] **[should]** **Shake animation** on validation errors
- [x] **[nice]** **Password strength meter** with animated colored bar
- [x] **[nice]** **Quantity stepper** with a subtle spring on +/− tap

---

## 4. Data display — make information sing 📊

### Admin dashboard
- [x] **[must]** **Sparklines next to every KPI card** showing the trend at a glance
- [x] **[must]** Add **comparison vs previous period** ("$8,420 ↑ 12.4% vs last week") under each KPI with green/red color
- [x] **[should]** **Heat-map calendar** of orders (GitHub-style contribution graph) *(12 weeks, 5 intensity buckets, hover for date + revenue)*
- [x] **[should]** **Donut chart** for orders-by-status instead of the current horizontal bars
- [x] **[should]** **Hover-revealed annotations** on the revenue chart (peak day, lowest day, marketing campaign markers) *(PEAK/LOW badges baked in; crosshair tooltip on hover; campaign-marker annotation slot)*
- [x] **[should]** **Live metric ticks** — small green pulse-dot beside KPIs that updated in the last 10 minutes *(pulsing dot per KPI; today-precision since we don't store sub-day timestamps yet)*
- [x] **[nice]** **Drag-to-rearrange** dashboard widgets (use a layout state per user) *(HTML5 DnD + localStorage order + drop-target ring + "Reset order" link)*
- [x] **[nice]** **Dense / spacious toggle** — switch the dashboard between airy and data-dense layouts *(Compact / Roomy segmented control, persisted per browser)*
- [x] **[nice]** **Compare two date ranges** overlay on the chart (this week vs last week as two lines) *(toggle chip; dashed neutral previous-period line + delta % in the hover tooltip)*
- [x] **[wow]** **Real-time map** showing where orders are coming from in the last hour (animated pings on a world map) *(stylised SVG continent-dot canvas; projected city lookup with id-hash fallback; cycling "active" highlight with detail strap)*

### Tables (admin orders / products / customers / reviews)
- [x] **[must]** **Sortable column headers** with arrow indicators
- [x] **[must]** **Sticky header row** so scrolling long tables doesn't lose context
- [x] **[should]** **Hover row highlighting** with a subtle left-border accent *(via `.admin-row` utility; applied across products/orders/promos/subscribers admin tables)*
- [x] **[should]** **Inline row expansion** — click a row to expand details without leaving the list
- [x] **[should]** **Multi-select with bulk action toolbar** (sticky toolbar appears at top when rows selected) *(bottom-floating toolbar on admin products with bulk delete + set-to-low-stock; per-page select-all checkbox with indeterminate state)*
- [x] **[should]** **Pagination footer** showing "1-10 of 247" + page size selector
- [x] **[nice]** **Saved views** ("Pending high-value orders", "Out-of-stock products") with quick switcher *(reusable `SavedViews` chips; 3 admin-orders presets + user snapshots; localStorage per table)*
- [x] **[nice]** **Column visibility toggle** so users can hide columns they don't care about *(per-table popover, persists in localStorage; never lets the user hide every column)*
- [x] **[nice]** **Export-to-CSV** button in the table toolbar *(reusable `ExportCsvButton` — wired into admin orders, products and subscribers; client-side build with UTF-8 BOM so Excel doesn't garble characters; per-row generic columns API)*
- [x] **[wow]** **Spreadsheet-like inline editing** — double-click a price cell, edit, enter to save *(price + stock cells on admin products; optimistic write with server roll-back)*

### Customer-side cards
- [x] **[must]** **Product card price has a strikethrough animation** when an oldPrice → price transition happens
- [x] **[should]** **Stock bar** under the price ("3 left! 🔥") with a thin fuel-gauge style indicator
- [x] **[should]** **"Why we love it" callout** on featured products (a 2-line italic tagline) *(reusable `WhyWeLoveIt`; gated to badged / 4.5★+ / ≥20% off products; in-line on FeaturedDeal + always on product detail)*
- [x] **[nice]** **Rating bar chart** on product cards (small 5-bar histogram of rating distribution)

---

## 5. Product detail page polish 🛍️

### Gallery
- [x] **[must]** **True multi-image gallery** with thumbnails that show different product angles *(`ProductGallery` — four synthesised angles (front/detail/tilt/back) derived by transforming the existing illustration; full-size hero + active-ring thumbnail strip; real photos slot in by swapping the illustration call)*
- [x] **[must]** **Click-to-zoom modal** with smooth scale-in *(`ZoomModal` inside `ProductGallery` — fullscreen card on click/Enter, overshoot zoomIn keyframe, escape closes, angle selector duplicated inside)*
- [x] **[should]** **Pan + zoom on hover** (Amazon-style — sweep cursor over image, magnified detail appears beside it) *(pointer-move shifts `transform-origin` to cursor position and bumps to 2×; magnifier chip fades in on hover; respects reduced-motion)*
- [x] **[nice]** **360° spin view** for premium products *(Spin tab inside `ProductGallery` — pointer drag scrubs through 24 rotateY frames; aria-slider semantics; progress bar + degree chip; copy is honest that it's a single-illustration spin until photogrammetry ships)*
- [x] **[nice]** **Video tab** in the gallery (looping 15s product video) *(programmatic stand-in inside `ProductGallery` — three CSS keyframes (pan, hue-shift backdrop, progress) sync over a 15s loop; play/pause toggle and timecode chip; real footage drops in by replacing the illustration layer)*
- [x] **[wow]** **AR view button** ("View in your room") via WebXR for cases / mounts *(`ARViewButton` — only renders for cases/stands/mounts/audio categories; UA feature-detect chip distinguishes "AR ready" vs "preview only"; click opens a synthesised room preview with reticule + corner brackets until per-SKU glTF/USDZ ship)*

### Info column
- [x] **[must]** **Sticky "Add to cart" panel** that pins to the right when the user scrolls past the fold
- [x] **[must]** **Variant selector** with color/size swatches (animated underline on the selected option) *(`VariantSelector` derives a believable variant catalogue from each product's category — colour + length for cables, capacity + plug for chargers, finish for power banks, etc. — and renders a gradient pill that slides between options on click)*
- [x] **[should]** **Animated quantity stepper** with subtle spring *(direction-aware bump animation + hold-to-repeat at 250ms→80ms cadence; pressed button glows brand-ring; haptic per step)*
- [x] **[should]** **Real-time stock counter** ("8 in stock — order in next 2h for tomorrow delivery") with a live ticking countdown *(fuel-gauge stock bar + 23:00 UTC delivery cutoff + drifting viewer count)*
- [x] **[should]** **Trust badges row** below the CTA (free shipping, 30-day returns, 2-yr warranty) with icons *(`TrustBadgesRow` — gradient-icon plates + hover-revealed "Read details" deep-link to /shipping, /returns, /warranty)*
- [x] **[nice]** **Bundle suggestion** card right under the CTA ("Add Lightning cable for $9 more — save 15%")
- [x] **[nice]** **"X people are viewing this right now"** indicator (mock from view counter) *(deterministic per-product seed + gentle drift; honest about being a vibe signal, not real traffic)*

### Reviews section
- [x] **[should]** **Rating distribution bar chart** in the sidebar *(now an interactive filter — each bar is a button that toggles the star filter, tone-coloured per row (success/warn/danger), "% positive vs % negative" narrative line beneath)*
- [x] **[should]** **Filter reviews by rating** (click 5★ bar → only show 5-star reviews)
- [x] **[should]** **Featured review at the top** (the longest, most-helpful one) with a "FEATURED" ribbon
- [x] **[nice]** **Avatar gradient generated from username hash** so each reviewer has a unique brand color
- [x] **[nice]** **Reviews with photos** show a row of thumbnails users can click to see fullscreen *(`ReviewPhotos` — deterministic 0-4 placeholder "photos" per review seeded by review id, biased toward reviews with helpful votes; arrow-key + dot-pager lightbox; UGC URLs slot in by extending `Review` with `photos?: string[]`)*

---

## 6. Shop page polish 🏬

- [x] **[must]** **Grid / list view toggle** in the toolbar
- [x] **[should]** **Quick-view modal** — eye icon on product card opens a modal with key details + add-to-cart without leaving the grid
- [x] **[should]** **Pinned filter chips** at the top showing active filters with × to remove
- [x] **[should]** **"Clear all filters"** button when any filter is active
- [x] **[should]** **Sort-by improvements** — visual icon for each sort (price ↓, star, clock) *(custom dropdown menu replaces native select; icons rotate for price direction)*
- [x] **[nice]** **Smooth filter transitions** — products re-arrange with a FLIP animation when filters change *(`FlipGrid` records bounding rects, inverts, releases — new cards fade-scale in; reduced-motion bypasses)*
- [x] **[nice]** **"You've seen all results"** end-of-grid graphic with a suggestion to relax filters
- [x] **[nice]** **Recently viewed strip** at the bottom of the shop page
- [x] **[wow]** **AI-generated product blurbs** that change with the active filter ("Looking for travel-friendly chargers? We picked these…") *(`FilterAwareBlurb` — heuristic templates keyed by category/query/budget; gradient-underline headline, kicker chip, sort flavour text; replays the slide-in on every filter change)*

---

## 7. Cart & checkout polish 🛒

- [x] **[must]** **Cart drawer** (slide-in from right) instead of a full page redirect from the cart icon
- [x] **[must]** **Free-shipping progress bar** ("Add $15 more for free shipping") with a fuel gauge animation
- [x] **[should]** **Each cart item gets an animated remove** (slide-left + fade) instead of disappearing instantly
- [x] **[should]** **Quantity changes animate the line total** (number tick-up/down) *(reusable `AnimatedPrice` — ease-out cubic tween + green/amber tint while moving)*
- [x] **[should]** **Empty cart illustration** that's actually fun (e.g. dancing power bank, sad earbud)
- [x] **[should]** **Promo code input** with a "How do I get a code?" hint that opens a tooltip *(inline expand panel with the three real ways to get a code; click-outside / Escape closes)*
- [x] **[should]** **Estimated delivery date** shown next to each line ("Arrives Mon, Jun 17")
- [x] **[nice]** **You might also like** carousel under the cart summary
- [x] **[wow]** **Multi-step checkout with progress dots** + slide transitions between Contact → Shipping → Payment → Review

---

## 8. Account dashboard polish 👤

### Overview page
- [x] **[must]** **Personalised greeting with time of day** ("Good evening, Aliza ✨")
- [x] **[must]** **Profile-completion progress ring** ("Your profile is 60% complete — add a phone to finish")
- [x] **[should]** **Tier / loyalty badge** prominently shown (Bronze → Silver → Gold) with a progress bar to next tier
- [x] **[should]** **Activity timeline** down the right side ("Today · Reviewed Volt Buds · Yesterday · Order delivered")
- [x] **[should]** **"Reorder favourites"** quick action (one-click cart-fill from a previous order)
- [x] **[nice]** **Total impact widget** ("You've saved $128 with promos · Helped 12 shoppers via your reviews") *(savings from `oldPrice` deltas + helpful-vote tally + distinct products reviewed)*
- [x] **[nice]** **Achievement system** ("First Review", "5+ Orders", "Wishlist Champion") with badges and animated unlocks

### Orders page
- [x] **[must]** **Real visual order tracker** — animated truck moving along a route line from Placed → Delivered
- [x] **[should]** **Filter chips** along the top (in addition to the existing tabs) for Year, Total range
- [x] **[should]** **Order card hover state** reveals quick actions (Track, Reorder, Download invoice) *(desktop slide-in toolbar; touch keeps the always-visible Track button)*
- [x] **[nice]** **Calendar view toggle** — see orders laid out on a monthly calendar *(month-nav grid with Mon-first weekday header; cells show first 2 order totals + overflow count; today gets a brand ring)*

### Reviews page
- [x] **[should]** **Stats row at the top** — Avg stars given, Most-helpful review, Total upvotes received *(uses the new helpfulness vote counts)*
- [x] **[nice]** **Each review card has a "Helpful?" widget** showing how many other shoppers found it useful *(`HelpfulImpact` shows helpful/not-helpful chips + "X% of voters found it useful"; nudge copy when no votes yet)*

---

## 9. Admin console polish 🛠️

- [x] **[must]** **Command palette (Cmd/Ctrl+K)** to jump anywhere ("orders pending", "product TurboFlow", "edit profile")
- [x] **[must]** **Sticky page header** with breadcrumbs + primary action button always visible
- [x] **[should]** **Side-by-side product editor** — left column shows the form, right column shows a live storefront preview *(modal goes `max-w-5xl`; sticky `ProductPreview` mirrors the real ProductCard with badges, gradient price, stock pill, features)*
- [x] **[should]** **"Recent edits" panel** in the sidebar so admins can quickly revisit what they were working on *(`AdminRecentEdits` collapsible card backed by `lib/recentEdits.ts` in localStorage; products + order-status changes drop breadcrumbs; custom-event refresh keeps tabs in sync; MAX 12, 5-min dedupe)*
- [x] **[should]** **Bulk-edit drawer** that slides in when multiple rows are selected *(right-side drawer on admin products — toggle the field you want to overwrite (price, stock, category, brand, badge), only enabled rows get patched; closes + clears selection on success)*
- [x] **[nice]** **Onboarding tour** (Shepherd.js) for first-time admins *(in-house — no extra deps; spotlight rect frames the target, keyboard nav + click-anywhere advance, skipped permanently in localStorage)*
- [x] **[nice]** **Light/dark theme switcher in admin** (already inherited, but show it prominently in the topbar) *(segmented `AdminThemeSwitch` shows both states at once; same localStorage key so storefront stays in sync)*
- [x] **[wow]** **Mini-charts on the products table** — last 7 days of view-count for each product as a sparkline column *(`ProductViewsCell` + `lib/productViewSeries.ts` — deterministic per-product 7-day series until impression tracking lands, with weekend dip + low-stock boost; tone shifts to red when the 3-day trend is down)*

---

## 10. Empty states & errors 🌵

- [x] **[must]** Every empty state gets a **custom SVG illustration** (cart, no orders, no reviews, no favorites, 404, 500)
- [x] **[should]** Each empty state has a **clear primary CTA** that gets the user back on track
- [x] **[should]** **404 page** becomes a delightful "lost in the cables" illustration with a search bar
- [x] **[should]** **500 page** (`global-error.tsx`) stays as functional, but adds a small "what happened" character *(SVG unplugged-cable mascot with a gentle breathe loop above the diagnostic)*
- [x] **[nice]** **"Coming soon" placeholders** for sections not yet built — playful, not embarrassing *(reusable `ComingSoon` shell + conic-halo card; `/press`, `/careers`, `/sustainability`, `/blog` all land here)*

---

## 11. Trust & social proof 🛡️

- [x] **[must]** **Live counter** on the landing ("⚡ 1,247 chargers shipped this week")
- [x] **[must]** **"As seen in"** logo row even if mocked for now *(`PressLogos` — six wordmark SVGs (Verge, WIRED, Engadget, TechCrunch, Gizmodo, MKBHD), greyscale at rest + colour on hover; rotating pull-quote underneath cycles every 6s with a dot pager and pause-on-hover)*
- [x] **[should]** **Verified-purchase badge** on reviews (depends on functional fix in IMPROVEMENTS.md)
- [x] **[should]** **Customer story spotlight** rotating on landing ("Maya · Berlin · 'Replaced my GoPro'") with photo
- [x] **[should]** **Trust seals row at footer** (SSL secure, GDPR, 30-day return guarantee, Verified payments)
- [x] **[nice]** **Real-time "users currently shopping"** ticker in the corner *(`LiveShoppersTicker` drifts ±3 every ~5s + rotates a city pool; honest "vibe signal" not real traffic)*

---

## 12. Promotional UI 🎯

- [x] **[must]** **Top promo bar** that's editable from admin (text + bg color + CTA)
- [x] **[should]** **Exit-intent modal** for first-time visitors offering 10% off *(top-edge mouse-leave or mobile blur trigger, 4s arm delay, once-per-browser; shows WELCOME10 + optional email capture)*
- [x] **[should]** **Flash-sale countdown banners** site-wide ("Ends in 02:14:47") with synchronised timers
- [x] **[should]** **Free-shipping floating bar** at the bottom of the screen showing how close to the threshold *(global `FreeShippingFloater`, dismissible per session, hidden on cart/checkout/admin routes)*
- [x] **[nice]** **Spin-the-wheel coupon** for newsletter signups *(SVG wheel with weighted picks at `/spin`; post-win email capture saves to subscribers; once-per-browser via localStorage)*
- [x] **[nice]** **Mystery deal card** on landing — "Today's secret deal — unlock to reveal" (one click + email shows the discount) *(daily deterministic pick from the discounted pool; obscured "?" tile until reveal, then product art + CTA)*
- [x] **[wow]** **Lottery/scratch card** for unique customers ("Scratch to reveal your discount!") *(canvas at `/scratch`; pointer-driven destination-out brush; 55%-cleared threshold reveals code with success haptic + brand chime)*

---

## 13. Color, typography & theming 🎨

- [x] **[should]** **Add an accent color** beyond brand/brand2 — a warm secondary for highlights (e.g. tangerine) *(`--accent2: 251 146 60` token + `text-accent2`/`bg-accent2` Tailwind shortcuts)*
- [x] **[should]** **Reduce font sizes by ~10%** on body copy for a more refined feel *(html root stays 16px so Tailwind utilities still scale, but `body` + prose tags drop to 0.9375rem with a 1.55-1.6 line-height; per-element Tailwind classes still override where needed)*
- [x] **[should]** **Upgrade display font** to a variable font like Inter Display or Geist Sans *(swapped Space Grotesk → Geist Sans via `next/font/google`; Inter stays as the body face; both registered as CSS variables and wired into Tailwind's fontFamily map — no more runtime CSS @import)*
- [x] **[should]** **Tighten letter-spacing** on H1s (-0.02em) and increase on UPPERCASE labels (+0.18em) *(applied globally via `.font-display` + `h1` + `.uppercase`)*
- [x] **[should]** **Refine dark theme** — current background (`#0a0e1a`) is slightly too pure; lift to `#0d1220` for warmth *(now `13 18 32` — paired with warmer surface/elev so layering stays consistent)*
- [x] **[nice]** **Auto-derive product card accent color** from category gradient (already mostly there — refine) *(thin per-category gradient strip on every ProductCard; `lib/categoryAccent.ts` lookup with substring fallback)*
- [x] **[nice]** **Time-of-day theming** — landing hero subtly shifts background hue based on user's local time (warm at evening, cool at morning)
- [x] **[wow]** **Brand pattern asset** — subtle SVG pattern (cable circuits, lightning bolts) used as section dividers

---

## 14. Mobile-first polish 📱

- [x] **[must]** **Bottom navigation bar** for mobile (Shop · Search · Cart · Favorites · Account)
- [x] **[must]** **Sticky "Add to cart" footer** on product detail mobile *(pinned above the mobile dock with iOS safe-area + 44px touch target + auto-hide when the in-flow CTA is on screen)*
- [x] **[should]** **Pull-to-refresh** on shop, orders, reviews *(touch-only, rubber-band, only engages at scrollTop 0; triggers `router.refresh()` + success haptic; respects reduced-motion)*
- [x] **[should]** **Swipe-to-delete** cart lines on mobile *(reusable `SwipeableRow` with left/right reveal actions; axis-locked, snap-back, commit-on-release past threshold)*
- [x] **[should]** **Card-stack swipe** for browsing products like a Tinder for accessories *(pointer-driven `SwipeStack` at `/discover`; left=skip, right=favourite, up=add-to-cart; haptic per commit; reduced-motion fallback)*
- [x] **[nice]** **Mobile cart drawer** that takes 90% of the screen, not full page *(bottom-sheet at `h-[90vh]` with grab handle; reverts to side drawer at `sm+`)*
- [x] **[nice]** **Haptic feedback** on add-to-cart (vibration on mobile) *(`lib/haptics.ts` with preset patterns; wired into add-to-cart, sticky CTA, favourites toggle, SwipeableRow commit; honours reduced-motion)*
- [x] **[wow]** **Snap-scrolling sections** on landing (each section snaps into view on scroll) *(right-rail dot nav + smooth scrollIntoView with `scroll-margin-top` so the sticky navbar doesn't clip headings; reduced-motion hides the rail)*

---

## 15. Brand identity & marketing visuals 🎯

- [x] **[must]** **Custom illustration set** matching brand (cables, batteries, earbuds — a cohesive style)
- [x] **[must]** **Branded social-share image** generator (`@vercel/og`) — each product shares with a beautiful OG image *(via Next.js `opengraph-image.tsx` convention; auto-wires `<meta og:image>` per product)*
- [x] **[should]** **Voice & tone guide** for product descriptions ("engineered, not assembled") *(`docs/VOICE_AND_TONE.md` — 10-section spec covering voice traits, tone-by-surface table, writing rules, the three-beat product-description structure, reusable microcopy table, pricing format, inclusivity, before/after rewrites, sign-off checklist)*
- [x] **[should]** **Branded loading spinner** (lightning bolt that pulses) instead of generic spinner
- [x] **[nice]** **Brand sound** — a subtle UI ping on success (e.g. order placed) using a single audio sprite *(synthesised at call time via Web Audio — no asset to ship; opt-in via AccessibilityPrefs; plays on add-to-cart + order placed)*
- [x] **[nice]** **Branded cursor** when hovering over CTA buttons (custom SVG cursor) *(inline-SVG gradient bolt with white outline + tip hotspot; falls back to pointer on touch)*
- [x] **[wow]** **3D lightning-bolt logo intro animation** played once on first visit *(rotateY swoop with halo pulse + spark rays + gradient-text wordmark fade-up; skippable on click/keypress, persisted in localStorage)*

---

## 16. Accessibility & inclusive design ♿

- [x] **[must]** **Visible focus rings** on every interactive element (currently subtle)
- [x] **[must]** **Reduced-motion mode** — respect `prefers-reduced-motion` for all auto-rotators and animations
- [x] **[should]** **High-contrast theme toggle** in addition to dark/light *(via `AccessibilityPrefs` floater; bumps borders/ink and suppresses decorative gradients)*
- [x] **[should]** **Font-size scaler** in user preferences (90% / 100% / 115%) *(92/100/112% via `--font-scale` on `<html>`; pre-paint applied so no FOUC)*
- [x] **[should]** **Skip-to-content link** that appears on tab focus
- [x] **[nice]** **Voice search button** in the navbar (Web Speech API) *(feature-detected — only renders on supporting browsers; interim results pipe into autocomplete; mic pulses red while listening)*
- [x] **[nice]** **Image alt-text generator suggestion** in admin product editor *(`AltTextSuggester` derives 3 one-click candidates from name/brand/category/features; length hint + 125-char cap)*

---

## 17. Wow-factor extras 🌟

- [x] **[wow]** **AI product-style chooser** — landing has a 30-second "find your accessory" flow (3 questions → recommended products) *(`ProductChooser` at `/find`; use × budget × priority heuristic scorer ranks the catalog, soft budget edges so a $128 product still wins for the $60-120 shopper)*
- [x] **[wow]** **Virtual showroom** — 3D scrollable room where products are arranged on shelves, click to pick up *(`VirtualShowroom` at `/showroom` — CSS-perspective stage with 5 category shelves at varying translateZ, lamp glow per shelf, hover-spotlight that dims peers; drag the canvas to tilt the room and "look around"; reduced-motion disables the tilt)*
- [x] **[wow]** **Live-stream "drop event"** countdown landing page with reservation queue (Supreme-style hype) *(`DropEventLanding` at `/drop` — 4-cell DD:HH:MM:SS countdown, rotating mesh halo, reserve-by-email queue that posts to `/api/subscribers` with `source: 'drop-event'`, vertical activity ticker; reserve state + hype seed live in localStorage)*
- [x] **[wow]** **Magic search** — search bar accepts natural language ("travel charger under $40 with USB-C") *(`MagicSearch` at `/magic`; regex parser extracts port / price / wattage / feature flags / category and shows a "we heard…" chip row, then ranks the catalog with port + category weighted heaviest)*
- [x] **[wow]** **Animated "Compare phones" lookup** — type your phone, see compatible products auto-filter with a slick transition *(`PhoneCompatLookup` at `/compat`; 12-phone hard-coded dictionary with port + MagSafe flags; staggered slide-in compatible grid)*
- [x] **[wow]** **Branded loading game** during checkout — a tiny "tap the bolts" mini-game while payment processes (15% conversion lift in similar setups) *(`BoltCatcherGame` — RAF loop with up to 6 bolts; score chip; pauses on tab-blur; reduced-motion shows a static loader)*
- [x] **[wow]** **Personalised "Voltik Wrapped"** — yearly Spotify-Wrapped-style recap of the user's purchases, savings, reviews *(Stories-deck at `/account/wrapped`; per-slide gradients, auto-advance + tap-to-continue + keyboard nav; teaser ribbon on /account)*

---

## 18. Implementation order — top design picks 🥇

If you can only do 10 design changes, do these (max wow per minute):

1. [x] **Hero ad carousel** with autoplay + crossfade (section 1) — `components/HeroCarousel.tsx`
2. [x] **Live "Just purchased" ticker** along the hero (section 1) — `components/PurchaseTicker.tsx` + `/api/orders/recent`
3. [x] **Sticky promo bar** at the top, env-configurable via `NEXT_PUBLIC_PROMO_MESSAGES` (section 1 + 12) — `components/PromoBar.tsx`
4. [x] **Floating "currently trending" widget** that fades through products (section 1) — `components/TrendingWidget.tsx`
5. [x] **Cart drawer** slide-in instead of full-page navigation (section 7) — `components/CartDrawer.tsx`
6. [x] **Free-shipping progress bar** in cart + drawer (section 7 + 12) — `components/FreeShippingBar.tsx`
7. [x] **Sticky add-to-cart panel** on product detail (section 5) — `app/product/[id]/StickyAddToCart.tsx`
8. [x] **Add-to-cart fly animation** to the nav (section 3) — `components/FlyToCartContext.tsx` + wire-ups in `ProductCard`, `AddToCartPanel`
9. [x] **Skeleton loader primitives** ready for any list / table (section 3) — `components/Skeleton.tsx`
10. [x] **Sparklines + comparison trend on every KPI** in admin (section 4) — `components/Sparkline.tsx` driving the admin dashboard

Bonus shipped:
- **Morphing headline** that cycles "Power up your *workflow · creative side · …*" — `components/MorphingHeadline.tsx`
- **Global `prefers-reduced-motion` handler** kills all auto-rotators + transitions for users who request it (in `globals.css`)
- **Wiggle animation** on the cart badge whenever an item lands in it

---

## Suggested sequencing — functionality vs design?

**Recommendation**: **alternate**. After every 2-3 functionality items from [IMPROVEMENTS.md](IMPROVEMENTS.md), ship 1-2 design items from this file. Reasons:

- Pure-functionality sprints feel invisible to non-devs reviewing progress; design ships generate "wow"
- Pure-design sprints stack tech debt that hurts later
- Some design items *depend* on functionality (real images, verified-purchase badges)

A good first pairing:
1. **Functionality**: real product images (Vercel Blob upload) — *enables most of section 1 + 5*
2. **Design**: Hero ad carousel + sticky promo bar — *immediate visual impact*
3. **Functionality**: real payment integration (Stripe)
4. **Design**: cart drawer + free-shipping progress bar — *checkout conversion lift*
5. **Functionality**: email service + transactional emails
6. **Design**: live "just purchased" ticker + skeleton loaders

---

*Last updated: keep iterating, keep shipping.* ⚡
