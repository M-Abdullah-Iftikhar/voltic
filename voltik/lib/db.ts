import type { Collection, Document } from 'mongodb';
import { getDb } from './mongo';
import {
  SEED_CATEGORIES, SEED_CUSTOMERS, SEED_ORDERS, SEED_PRODUCTS,
  SEED_REVIEWS, SEED_USERS, type SeedUser
} from './seed';
import { hashPassword } from './passwords';
import type {
  CartLine, Category, Customer, Order, Product, Review, User
} from './types';

/* ============================================================
   MongoDB-backed data layer.
   Public API is intentionally identical to the previous JSON
   store — every caller (API routes, server components) is
   untouched.

   First-run behaviour: each collection is seeded with the
   SEED_* arrays IF it is empty. Seeding uses bulkWrite upserts
   so concurrent serverless cold starts can't corrupt anything.
   ============================================================ */

type CollName = 'products' | 'orders' | 'customers' | 'categories' | 'users' | 'reviews';

/** Track which collections we've already prepared this process. */
const prepared: Partial<Record<CollName, Promise<void>>> = {};

async function prepare(name: CollName): Promise<void> {
  if (prepared[name]) return prepared[name];
  prepared[name] = (async () => {
    const db = await getDb();
    const col = db.collection(name);

    // Lazy unique indexes.
    if (name === 'users') {
      await Promise.all([
        col.createIndex({ id: 1 }, { unique: true }),
        col.createIndex({ email: 1 }, { unique: true })
      ]);
    } else {
      await col.createIndex({ id: 1 }, { unique: true });
    }

    // First-run seeding if the collection is empty.
    const exists = await col.countDocuments({}, { limit: 1 });
    if (exists === 0) {
      const docs = await buildSeed(name);
      if (docs.length) {
        // Upsert pattern is idempotent under races.
        await col.bulkWrite(
          docs.map(d => ({
            updateOne: {
              filter: { id: (d as { id: string }).id },
              update: { $setOnInsert: d },
              upsert: true
            }
          })),
          { ordered: false }
        );
      }
    }
  })();
  return prepared[name];
}

async function buildSeed(name: CollName): Promise<Document[]> {
  switch (name) {
    case 'products':   return SEED_PRODUCTS as unknown as Document[];
    case 'orders':     return SEED_ORDERS as unknown as Document[];
    case 'customers':  return SEED_CUSTOMERS as unknown as Document[];
    case 'categories': return SEED_CATEGORIES as unknown as Document[];
    case 'reviews':    return SEED_REVIEWS as unknown as Document[];
    case 'users': {
      // Hash demo-user passwords before insert; plaintext never touches disk.
      return SEED_USERS.map((u: SeedUser) => {
        const { plainPassword, ...rest } = u;
        return { ...rest, passwordHash: hashPassword(plainPassword) } as unknown as Document;
      });
    }
  }
}

async function col<T extends Document>(name: CollName): Promise<Collection<T>> {
  await prepare(name);
  const db = await getDb();
  return db.collection<T>(name);
}

/** Strip Mongo's internal _id before returning to callers. */
function clean<T>(doc: T | null): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest as T;
}
function cleanMany<T>(docs: T[]): T[] {
  return docs.map(d => clean(d)!);
}

export const db = {
  /* ─── products ──────────────────────────────────────────── */
  async listProducts(): Promise<Product[]> {
    const c = await col<Product>('products');
    return cleanMany(await c.find({}).toArray());
  },
  async getProduct(id: string): Promise<Product | null> {
    const c = await col<Product>('products');
    return clean(await c.findOne({ id }));
  },
  async upsertProduct(p: Product): Promise<Product> {
    const c = await col<Product>('products');
    await c.updateOne({ id: p.id }, { $set: p }, { upsert: true });
    return p;
  },
  async deleteProduct(id: string): Promise<void> {
    const c = await col<Product>('products');
    await c.deleteOne({ id });
  },

  /* ─── orders ────────────────────────────────────────────── */
  async listOrders(): Promise<Order[]> {
    const c = await col<Order>('orders');
    return cleanMany(await c.find({}).sort({ date: -1 }).toArray());
  },
  async listOrdersForUser(userId: string, email: string): Promise<Order[]> {
    const c = await col<Order>('orders');
    const rows = await c.find({
      $or: [{ userId }, { email: email.toLowerCase() }, { email }]
    }).sort({ date: -1 }).toArray();
    return cleanMany(rows);
  },
  async getOrder(id: string): Promise<Order | null> {
    const c = await col<Order>('orders');
    return clean(await c.findOne({ id }));
  },
  async upsertOrder(o: Order): Promise<Order> {
    const c = await col<Order>('orders');
    await c.updateOne({ id: o.id }, { $set: o }, { upsert: true });
    return o;
  },
  async deleteOrder(id: string): Promise<void> {
    const c = await col<Order>('orders');
    await c.deleteOne({ id });
  },

  /* ─── customers ─────────────────────────────────────────── */
  async listCustomers(): Promise<Customer[]> {
    const c = await col<Customer>('customers');
    return cleanMany(await c.find({}).toArray());
  },

  /* ─── categories ────────────────────────────────────────── */
  async listCategories(): Promise<Category[]> {
    const c = await col<Category>('categories');
    return cleanMany(await c.find({}).toArray());
  },
  async getCategory(id: string): Promise<Category | null> {
    const c = await col<Category>('categories');
    return clean(await c.findOne({ id }));
  },
  async upsertCategory(category: Category): Promise<Category> {
    const c = await col<Category>('categories');
    await c.updateOne({ id: category.id }, { $set: category }, { upsert: true });
    return category;
  },
  async deleteCategory(id: string): Promise<void> {
    const c = await col<Category>('categories');
    await c.deleteOne({ id });
  },

  /* ─── users ─────────────────────────────────────────────── */
  async listUsers(): Promise<User[]> {
    const c = await col<User>('users');
    return cleanMany(await c.find({}).toArray());
  },
  async getUser(id: string): Promise<User | null> {
    const c = await col<User>('users');
    return clean(await c.findOne({ id }));
  },
  async getUserByEmail(email: string): Promise<User | null> {
    const c = await col<User>('users');
    return clean(await c.findOne({ email: email.toLowerCase() }));
  },
  async upsertUser(u: User): Promise<User> {
    const c = await col<User>('users');
    await c.updateOne({ id: u.id }, { $set: u }, { upsert: true });
    return u;
  },
  async setUserCart(id: string, cart: CartLine[]): Promise<User | null> {
    const c = await col<User>('users');
    const res = await c.findOneAndUpdate({ id }, { $set: { cart } }, { returnDocument: 'after' });
    return clean(res);
  },
  async setUserFavorites(id: string, favorites: string[]): Promise<User | null> {
    const c = await col<User>('users');
    const unique = Array.from(new Set(favorites));
    const res = await c.findOneAndUpdate({ id }, { $set: { favorites: unique } }, { returnDocument: 'after' });
    return clean(res);
  },

  /* ─── reviews ───────────────────────────────────────────── */
  async listReviews(): Promise<Review[]> {
    const c = await col<Review>('reviews');
    return cleanMany(await c.find({}).toArray());
  },
  async listReviewsForProduct(productId: string): Promise<Review[]> {
    const c = await col<Review>('reviews');
    return cleanMany(await c.find({ productId }).sort({ createdAt: -1 }).toArray());
  },
  async listReviewsForUser(userId: string): Promise<Review[]> {
    const c = await col<Review>('reviews');
    return cleanMany(await c.find({ userId }).sort({ createdAt: -1 }).toArray());
  },
  async upsertReview(r: Review): Promise<Review> {
    const c = await col<Review>('reviews');
    await c.updateOne({ id: r.id }, { $set: r }, { upsert: true });
    return r;
  },
  async deleteReview(id: string): Promise<void> {
    const c = await col<Review>('reviews');
    await c.deleteOne({ id });
  }
};
