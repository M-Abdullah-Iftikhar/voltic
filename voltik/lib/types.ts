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
};

/** A user as exposed to the client (no password). */
export type PublicUser = Omit<User, 'passwordHash'>;

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;       // denormalised for fast rendering
  rating: number;         // 1..5
  title: string;
  body: string;
  createdAt: string;      // ISO date
};
