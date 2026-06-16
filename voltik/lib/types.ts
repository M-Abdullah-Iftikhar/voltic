export type Category = {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  gradient: string;
  parent: string | null;   // null = root category
};

export type CategoryNode = Category & { children: CategoryNode[]; depth: number };

/** Core product record — rating + review count are NOT stored, they're
 *  computed from the reviews table at display time. */
export type Product = {
  id: string;
  /** URL-safe slug, derived from name. Used in /product/[slug] URLs. */
  slug?: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  badge?: string;
  icon: string;
  brand: string;
  sku: string;
  description: string;
  features: string[];
  /** Accessible alt text for the product image — when blank, the
   *  storefront falls back to a generic "category icon" label. */
  altText?: string;
  /** Cached rating average + count, refreshed by `db.recomputeProductAggregate`
   *  whenever the review set changes. Lets the storefront skip the
   *  O(reviews) recompute on every product list. */
  cachedRating?: number;
  cachedReviewsCount?: number;
};

/** A saved shipping address on a User profile. */
export type Address = {
  id: string;
  label: string;           // "Home" / "Work"
  recipient: string;
  street: string;
  city: string;
  country: string;
  phone: string;
  isDefault?: boolean;
};

/** Newsletter subscriber. */
export type Subscriber = {
  id: string;
  email: string;
  createdAt: string;
  source?: string;
};

/** Back-in-stock notification request. Fulfilled (and then deleted) when
 *  the product's stock goes above zero. */
export type BackInStock = {
  id: string;
  productId: string;
  email: string;
  createdAt: string;
};

/** Promo code with discount semantics. */
export type PromoCode = {
  id: string;             // same value as `code`, uppercased
  code: string;
  type: 'percent' | 'flat' | 'shipping';
  /** percent: 0-100, flat: dollars, shipping: ignored */
  value: number;
  /** Minimum basket total (subtotal) to use. 0 = no min. */
  minBasket?: number;
  /** ISO date string; undefined = no expiry. */
  expiresAt?: string;
  /** Total uses allowed across all customers. undefined = unlimited. */
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

/** Product + its real-time aggregate stats (computed from reviews). */
export type EnrichedProduct = Product & {
  rating: number;        // 0..5 average; 0 when there are no reviews
  reviewsCount: number;  // total reviews
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  customer: string;
  email: string;
  total: number;
  status: OrderStatus;
  date: string;
  items: number;
  payment: 'Card' | 'COD' | 'UPI';
  userId?: string;             // set when the order belongs to a registered user
  lines?: CartLine[];          // optional per-product breakdown
  shipping?: {
    address: string;
    city: string;
    country: string;
    phone: string;
  };
  /** Carrier tracking number — added by admin once the parcel ships. */
  tracking?: { carrier: string; number: string; url?: string };
  /** Free-form notes the admin keeps but never sends to the customer. */
  internalNote?: string;
  /** A note the admin chooses to surface on the customer's order detail page. */
  customerNote?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  since: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
};

export type CartLine = { id: string; qty: number };

/** Storefront user — separate from the admin. */
export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;   // never sent to the client
  createdAt: string;
  cart: CartLine[];
  favorites: string[];    // product ids
  /** Optional — "save for later" lines that aren't in the active cart. */
  savedForLater?: string[];
  /** Optional address book. The first address (or one with isDefault) is used to prefill checkout. */
  addresses?: Address[];
  /** Email-verification: token issued at signup, cleared once the user clicks the link. */
  emailVerified?: boolean;
  emailVerifyToken?: string;
  /** Password-reset: single-use token + ISO expiry. Cleared after a successful reset. */
  passwordResetToken?: string;
  passwordResetExpires?: string;
  /** Bot/brute-force protection. Reset to 0 on a successful login. */
  failedLogins?: number;
  /** ISO timestamp until which logins are refused for this account. */
  lockedUntil?: string;
};

/** A user as exposed to the client (no password). */
export type PublicUser = Omit<User,
  'passwordHash' | 'emailVerifyToken' | 'passwordResetToken' | 'passwordResetExpires'>;

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;       // denormalised for fast rendering
  rating: number;         // 1..5
  title: string;
  body: string;
  createdAt: string;      // ISO date
  /** Admin hides spammy/abusive reviews here without losing the row. */
  hidden?: boolean;
  /** Brand reply rendered under the review. Set by admin from /admin/reviews. */
  reply?: {
    body: string;
    by: string;          // admin email or display name
    createdAt: string;   // ISO date
  };
  /** Aggregate counts maintained by /api/reviews/[id]/vote. */
  helpfulCount?: number;
  notHelpfulCount?: number;
  /** UserIds that have already voted — keeps voting idempotent. */
  helpfulVoters?: string[];
  notHelpfulVoters?: string[];
};

/** Promotional "ad" entry — drives the rotating ad surfaces (hero
 *  carousel, RotatingAd widgets, deal strips). Lives in the `ads`
 *  Mongo collection and is editable end-to-end from the admin console. */
export type Ad = {
  id: string;
  headline: string;
  /** Subtitle / supporting tagline. */
  tagline: string;
  /** CTA button label — kept short so it fits on small slots. */
  ctaLabel: string;
  /** CTA target — relative path (`/product/foo`) or external URL. */
  ctaHref: string;
  /** Linked product (optional). When set, the slot pulls the illustration + price chip from this SKU. */
  productId?: string;
  /** Slot tag — surface decides which `placement` it wants ("hero", "rotator", etc.) */
  placement: 'hero' | 'rotator' | 'bento' | 'banner';
  /** Tailwind gradient class for the slide background ("from-brand to-brand2"). */
  gradient: string;
  /** ISO date strings — inclusive window. If unset, the ad is always active. */
  startsAt?: string;
  endsAt?: string;
  /** Higher priority surfaces float to the top of the rotation. */
  priority: number;
  /** Off-switch without losing the row. */
  active: boolean;
  createdAt: string;
};

/** Audit-log entry for every admin mutation. Surfaces who-did-what so
 *  follow-ups (refund disputes, accidental deletes, support cases) can
 *  reconstruct the timeline without a Mongo dive. */
export type AuditEvent = {
  id: string;
  /** Who performed the action — admin email if known, else 'system'. */
  actor: string;
  /** The mutation, e.g. 'product.upsert', 'order.delete'. */
  action: string;
  /** Optional reference to the affected row (product id, order id, etc.). */
  targetType?: string;
  targetId?: string;
  /** Free-form context payload — kept short on the write side so the
   *  audit collection doesn't grow into a generic log dump. */
  meta?: Record<string, unknown>;
  /** Caller IP + UA — best-effort, may be missing on edge proxies. */
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

/** Admin account — separate collection from customer Users so admin auth
 *  has its own attack surface. Seeded on first run; you can add more
 *  admins later straight into Mongo or via a future admin-users page. */
export type Admin = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};
