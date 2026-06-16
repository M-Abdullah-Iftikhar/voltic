import type { Collection, Document } from 'mongodb';
import { getDb, getMongoClient } from './mongo';
import {
  SEED_ADMINS, SEED_CATEGORIES, SEED_CUSTOMERS, SEED_ORDERS, SEED_PRODUCTS,
  SEED_PROMOS, SEED_REVIEWS, SEED_SUBSCRIBERS, SEED_USERS, type SeedAdmin, type SeedUser,
  withSeededSlugs
} from './seed';
import { hashPassword } from './passwords';
import { slugify, uniqueSlug } from './slug';
import type {
  Ad, Admin, AuditEvent, BackInStock, CartLine, Category, Customer, Order, Product, PromoCode, Review, Subscriber, User
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

type CollName = 'products' | 'orders' | 'customers' | 'categories' | 'users' | 'reviews' | 'admins' | 'promos' | 'subscribers' | 'backInStock' | 'ads' | 'auditLog';

/** Track which collections we've already prepared this process. */
const prepared: Partial<Record<CollName, Promise<void>>> = {};

async function prepare(name: CollName): Promise<void> {
  if (prepared[name]) return prepared[name];
  prepared[name] = (async () => {
    const db = await getDb();
    const col = db.collection(name);

    // Lazy indexes — unique on business id, plus query indexes for common
    // filters. createIndex is idempotent.
    switch (name) {
      case 'users':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ email: 1 }, { unique: true })
        ]);
        break;
      case 'admins':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ email: 1 }, { unique: true })
        ]);
        break;
      case 'promos':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ code: 1 }, { unique: true })
        ]);
        break;
      case 'subscribers':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ email: 1 }, { unique: true })
        ]);
        break;
      case 'backInStock':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ productId: 1 }),
          // Dedupe per (product, email).
          col.createIndex({ productId: 1, email: 1 }, { unique: true })
        ]);
        break;
      case 'products':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ slug: 1 }, { unique: true, sparse: true }),
          col.createIndex({ category: 1 })
        ]);
        break;
      case 'orders':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ userId: 1 }),
          col.createIndex({ email: 1 }),
          col.createIndex({ status: 1 }),
          col.createIndex({ date: -1 })
        ]);
        break;
      case 'reviews':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ productId: 1, createdAt: -1 }),
          col.createIndex({ userId: 1 })
        ]);
        // One review per (product, user). Closes the race where two
        // concurrent submissions for the same SKU both insert.
        //
        // Built separately + swallowed on duplicate-key failure so an
        // existing prod database that already holds duplicates doesn't
        // crash every page render. The team can de-duplicate manually,
        // then the next prep cycle will succeed and enforce going forward.
        await col.createIndex(
          { productId: 1, userId: 1 },
          { unique: true }
        ).catch((e: { code?: number; codeName?: string; message?: string }) => {
          if (e?.code === 11000 || e?.codeName === 'DuplicateKey') {
            // eslint-disable-next-line no-console
            console.warn('[voltik] reviews unique (productId,userId) index skipped: pre-existing duplicates. De-dupe rows then redeploy.');
            return;
          }
          throw e;
        });
        break;
      case 'categories':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ parent: 1 })
        ]);
        break;
      case 'auditLog':
        await Promise.all([
          col.createIndex({ id: 1 }, { unique: true }),
          col.createIndex({ createdAt: -1 }),
          col.createIndex({ actor: 1, createdAt: -1 }),
          col.createIndex({ targetType: 1, targetId: 1, createdAt: -1 })
        ]);
        break;
      default:
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
    case 'products':    return withSeededSlugs(SEED_PRODUCTS) as unknown as Document[];
    case 'orders':      return SEED_ORDERS as unknown as Document[];
    case 'customers':   return SEED_CUSTOMERS as unknown as Document[];
    case 'categories':  return SEED_CATEGORIES as unknown as Document[];
    case 'reviews':     return SEED_REVIEWS as unknown as Document[];
    case 'promos':      return SEED_PROMOS as unknown as Document[];
    case 'subscribers': return SEED_SUBSCRIBERS as unknown as Document[];
    case 'users': {
      return SEED_USERS.map((u: SeedUser) => {
        const { plainPassword, ...rest } = u;
        return { ...rest, passwordHash: hashPassword(plainPassword) } as unknown as Document;
      });
    }
    case 'admins': {
      // Hashed at seed time so the JSON in Mongo never holds plaintext.
      return SEED_ADMINS.map((a: SeedAdmin) => {
        const { plainPassword, ...rest } = a;
        return { ...rest, passwordHash: hashPassword(plainPassword) } as unknown as Document;
      });
    }
    case 'backInStock': return [];
    case 'ads':         return [];
    case 'auditLog':    return [];
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
  /** Look up by URL slug (preferred) OR by raw business id (back-compat). */
  async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    const c = await col<Product>('products');
    return clean(await c.findOne({ $or: [{ slug: idOrSlug }, { id: idOrSlug }] }));
  },
  async upsertProduct(p: Product): Promise<Product> {
    const c = await col<Product>('products');
    // Auto-generate a unique slug if missing.
    if (!p.slug) {
      const all = await c.find({}, { projection: { slug: 1, _id: 0 } }).toArray();
      const taken = new Set(all.map(x => (x as any).slug).filter(Boolean));
      p.slug = uniqueSlug(p.name, taken);
    }
    await c.updateOne({ id: p.id }, { $set: p }, { upsert: true });
    return p;
  },
  async deleteProduct(id: string): Promise<void> {
    const c = await col<Product>('products');
    await c.deleteOne({ id });
  },

  /** Atomic stock decrement. Only succeeds if `stock >= qty`. */
  async decrementStockIfAvailable(productId: string, qty: number): Promise<boolean> {
    if (qty <= 0) return true;
    const c = await col<Product>('products');
    const res = await c.updateOne(
      { id: productId, stock: { $gte: qty } },
      { $inc: { stock: -qty } }
    );
    return res.modifiedCount > 0;
  },

  /** Restore stock — used to roll back failed order placements. */
  async incrementStock(productId: string, qty: number): Promise<void> {
    if (qty <= 0) return;
    const c = await col<Product>('products');
    await c.updateOne({ id: productId }, { $inc: { stock: qty } });
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
  /**
   * True if `userId` (or the matching `email`) has an order containing `productId`
   * that isn't cancelled. Drives the "verified purchase" gate on reviews.
   */
  async hasPurchased(userId: string, email: string, productId: string): Promise<boolean> {
    const c = await col<Order>('orders');
    const hit = await c.findOne({
      status: { $ne: 'cancelled' },
      'lines.id': productId,
      $or: [{ userId }, { email: email.toLowerCase() }, { email }]
    }, { projection: { _id: 1 } });
    return !!hit;
  },

  /**
   * Admin dashboard rollup — a single Mongo aggregation that fans the
   * orders collection across four facets (revenue + status breakdown +
   * recent + daily trend) and returns the result. Replaces the previous
   * "load every order then loop in JS" path which was O(orders) per
   * page render. Products + customers are still loaded as light count
   * queries.
   */
  async computeAdminStats(): Promise<{
    revenue: number;
    orderCount: number;
    productCount: number;
    customerCount: number;
    lowStock: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    trend: Array<{ date: string; revenue: number }>;
    recentOrders: Order[];
  }> {
    const ordersCol    = await col<Order>('orders');
    const productsCol  = await col<Product>('products');
    const customersCol = await col<Customer>('customers');

    const [orderFacet, productFacet, customerCount] = await Promise.all([
      ordersCol.aggregate([{
        $facet: {
          revenue: [
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
          ],
          orderCount: [{ $count: 'n' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          // Build a per-day trend for the last 7 distinct dates we have
          // orders for. Cancelled orders are excluded from the revenue
          // sum but kept out of the trend entirely.
          trendRaw: [
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: '$date', revenue: { $sum: '$total' } } },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ],
          recentOrders: [
            { $sort: { date: -1 } },
            { $limit: 6 }
          ]
        }
      }]).toArray(),
      productsCol.aggregate([{
        $facet: {
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          lowStock: [
            { $match: { stock: { $lt: 100 } } },
            { $count: 'n' }
          ],
          total: [{ $count: 'n' }]
        }
      }]).toArray(),
      customersCol.countDocuments({})
    ]);

    const od = orderFacet[0] as any;
    const pd = productFacet[0] as any;

    const byStatus: Record<string, number> = {};
    for (const row of od.byStatus ?? []) byStatus[row._id] = row.count;
    const byCategory: Record<string, number> = {};
    for (const row of pd.byCategory ?? []) byCategory[row._id] = row.count;

    const trend = (od.trendRaw ?? [])
      .map((r: { _id: string; revenue: number }) => ({ date: r._id, revenue: Math.round(r.revenue * 100) / 100 }))
      .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

    return {
      revenue: Math.round(((od.revenue?.[0]?.total) || 0) * 100) / 100,
      orderCount: od.orderCount?.[0]?.n ?? 0,
      productCount: pd.total?.[0]?.n ?? 0,
      customerCount,
      lowStock: pd.lowStock?.[0]?.n ?? 0,
      byStatus,
      byCategory,
      trend,
      recentOrders: (od.recentOrders ?? []).map((o: any) => {
        const { _id, ...rest } = o;
        return rest as Order;
      })
    };
  },
  /**
   * Atomic order placement: decrements stock for every line, writes the
   * order row, and clears the user's cart inside a single Mongo
   * transaction. Returns `{ ok: true, order }` on success, or
   * `{ ok: false, reason }` describing the offending line if a stock
   * decrement fails.
   *
   * Falls back to the existing manual rollback when transactions
   * aren't supported (standalone Mongo, dev container) — the caller
   * doesn't need to care which path ran.
   */
  async placeOrder(input: {
    order: Order;
    userId?: string;
  }): Promise<
    | { ok: true; order: Order }
    | { ok: false; reason: { productId: string; productName?: string; available: number; requested: number } }
  > {
    const { order, userId } = input;
    const lines = order.lines || [];
    const client = await getMongoClient();
    let session: Awaited<ReturnType<typeof client.startSession>> | null = null;
    try {
      session = client.startSession();
    } catch {
      // Driver doesn't expose sessions in this deployment — fall through
      // to the non-transactional path below.
    }

    if (session) {
      try {
        let conflict: { productId: string; productName?: string; available: number; requested: number } | null = null;
        let savedOrder: Order | null = null;
        await session.withTransaction(async () => {
          const productsCol = (await getDb()).collection<Product>('products');
          const ordersCol   = (await getDb()).collection<Order>('orders');
          const usersCol    = (await getDb()).collection<User>('users');

          for (const line of lines) {
            const res = await productsCol.updateOne(
              { id: line.id, stock: { $gte: line.qty } },
              { $inc: { stock: -line.qty } as any },
              { session }
            );
            if (res.modifiedCount === 0) {
              const found = await productsCol.findOne({ id: line.id }, { session });
              conflict = {
                productId: line.id,
                productName: (found as Product | null)?.name,
                available: (found as Product | null)?.stock ?? 0,
                requested: line.qty
              };
              // Aborting inside withTransaction by throwing keeps the
              // session machinery from committing any earlier writes.
              throw new Error('STOCK_CONFLICT');
            }
          }

          // Email normalisation + items count derivation mirror the
          // non-transactional upsertOrder path.
          const itemsFromLines = lines.reduce((s, l) => s + (l.qty || 0), 0);
          const normalized: Order = {
            ...order,
            email: (order.email || '').trim().toLowerCase(),
            items: itemsFromLines > 0 ? itemsFromLines : (order.items || 0)
          };
          await ordersCol.updateOne(
            { id: normalized.id },
            { $set: normalized },
            { upsert: true, session }
          );
          savedOrder = normalized;

          if (userId) {
            await usersCol.updateOne({ id: userId }, { $set: { cart: [] } }, { session });
          }
        });
        if (conflict) return { ok: false, reason: conflict };
        return { ok: true, order: savedOrder! };
      } catch (e: any) {
        // STOCK_CONFLICT was thrown inside the txn so we could roll back.
        if (e?.message === 'STOCK_CONFLICT') {
          // The transaction aborted automatically, so no manual rollback.
          // Re-derive the conflict info for the caller.
          const products = await col<Product>('products');
          for (const line of lines) {
            const p = await products.findOne({ id: line.id });
            if (!p || (p.stock ?? 0) < line.qty) {
              return {
                ok: false,
                reason: {
                  productId: line.id,
                  productName: p?.name,
                  available: p?.stock ?? 0,
                  requested: line.qty
                }
              };
            }
          }
        }
        throw e;
      } finally {
        await session.endSession();
      }
    }

    // ── Fallback for non-transactional Mongo (standalone dev). Mirrors
    //    the manual-rollback shape the route used before, but lives in
    //    one place so the caller stays simple.
    const decremented: CartLine[] = [];
    for (const line of lines) {
      const ok = await this.decrementStockIfAvailable(line.id, line.qty);
      if (!ok) {
        for (const d of decremented) await this.incrementStock(d.id, d.qty).catch(() => {});
        const p = await this.getProduct(line.id);
        return { ok: false, reason: {
          productId: line.id, productName: p?.name, available: p?.stock ?? 0, requested: line.qty
        } };
      }
      decremented.push(line);
    }
    try {
      const saved = await this.upsertOrder(order);
      if (userId) await this.setUserCart(userId, []).catch(() => {});
      return { ok: true, order: saved };
    } catch (e) {
      for (const d of decremented) await this.incrementStock(d.id, d.qty).catch(() => {});
      throw e;
    }
  },

  async upsertOrder(o: Order): Promise<Order> {
    const c = await col<Order>('orders');
    // Normalise at the storage boundary:
    //   • lowercase email so lookups by address don't depend on case
    //   • derive items count from lines so the two fields can't drift
    //     (older code paths sometimes only set one of them)
    const itemsFromLines = (o.lines ?? []).reduce((s, l) => s + (l.qty || 0), 0);
    const normalized: Order = {
      ...o,
      email: (o.email || '').trim().toLowerCase(),
      items: itemsFromLines > 0 ? itemsFromLines : (o.items || 0)
    };
    await c.updateOne({ id: normalized.id }, { $set: normalized }, { upsert: true });
    return normalized;
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
  /** Find by hashed reset/verify token. Used by password-reset + email-verify routes. */
  async getUserByResetTokenHash(tokenHash: string): Promise<User | null> {
    const c = await col<User>('users');
    return clean(await c.findOne({ passwordResetToken: tokenHash }));
  },
  async getUserByVerifyTokenHash(tokenHash: string): Promise<User | null> {
    const c = await col<User>('users');
    return clean(await c.findOne({ emailVerifyToken: tokenHash }));
  },
  async upsertUser(u: User): Promise<User> {
    const c = await col<User>('users');
    // Normalise at the storage boundary so every call site — signup,
    // profile edit, admin tools — lands on the same lookup key + a
    // bounded display name.
    const cappedName = (u.name || '').trim().slice(0, 60);
    const normalized: User = {
      ...u,
      email: (u.email || '').trim().toLowerCase(),
      name: cappedName
    };
    await c.updateOne({ id: normalized.id }, { $set: normalized }, { upsert: true });
    return normalized;
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
  /**
   * Record a failed login against `userId` and return the updated
   * counter + lockout expiry. The lockout is exponential-ish — 5
   * attempts in a row earns 15 min, 10 earns 60 min — so casual
   * fat-finger typing isn't punished as hard as a brute-force loop.
   *
   * Uses `findOneAndUpdate` with `$inc` so concurrent failed-login
   * requests can't lose count.
   */
  async recordFailedLogin(userId: string): Promise<{ failedLogins: number; lockedUntil?: string }> {
    const c = await col<User>('users');
    const after = await c.findOneAndUpdate(
      { id: userId },
      { $inc: { failedLogins: 1 } as any },
      { returnDocument: 'after' }
    );
    if (!after) return { failedLogins: 0 };
    const failed = (after as { failedLogins?: number }).failedLogins || 0;
    let lockMinutes = 0;
    if      (failed >= 10) lockMinutes = 60;
    else if (failed >= 7)  lockMinutes = 30;
    else if (failed >= 5)  lockMinutes = 15;
    if (lockMinutes > 0) {
      const lockedUntil = new Date(Date.now() + lockMinutes * 60_000).toISOString();
      await c.updateOne({ id: userId }, { $set: { lockedUntil } });
      return { failedLogins: failed, lockedUntil };
    }
    return { failedLogins: failed };
  },
  /** Wipe the lockout state on a successful login. */
  async clearFailedLogins(userId: string): Promise<void> {
    const c = await col<User>('users');
    await c.updateOne(
      { id: userId },
      { $set: { failedLogins: 0 }, $unset: { lockedUntil: '' } as any }
    );
  },
  /**
   * Atomic favorite add — uses `$addToSet` so concurrent toggles from
   * two tabs can't clobber each other. Returns the updated user.
   */
  async addFavorite(id: string, productId: string): Promise<User | null> {
    const c = await col<User>('users');
    const res = await c.findOneAndUpdate(
      { id },
      { $addToSet: { favorites: productId } as any },
      { returnDocument: 'after' }
    );
    return clean(res);
  },
  /**
   * Atomic favorite remove — paired with `addFavorite` so a toggle
   * round-trip is two race-safe DB ops instead of one read-modify-write.
   */
  async removeFavorite(id: string, productId: string): Promise<User | null> {
    const c = await col<User>('users');
    const res = await c.findOneAndUpdate(
      { id },
      { $pull: { favorites: productId } as any },
      { returnDocument: 'after' }
    );
    return clean(res);
  },
  /**
   * Returns the subset of `ids` that refer to a real product in the
   * catalogue. Used by cart / favourite / review endpoints so the
   * downstream storage doesn't accumulate phantom references when a
   * product is deleted under a stale client.
   */
  async filterKnownProductIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const c = await col<Product>('products');
    const unique = Array.from(new Set(ids));
    const rows = await c.find({ id: { $in: unique } }, { projection: { id: 1, _id: 0 } }).toArray();
    const known = new Set(rows.map(r => (r as { id: string }).id));
    return ids.filter(id => known.has(id));
  },
  /**
   * GDPR delete: removes the user record entirely AND scrubs PII from any
   * historical orders (we keep the order rows for accounting, but strip the
   * personal data — name/email/phone/address — so nothing identifying remains).
   * Reviews are deleted outright since they're explicitly user-attributed.
   */
  async hardDeleteUser(id: string, email: string): Promise<{ orders: number; reviews: number }> {
    const usersCol   = await col<User>('users');
    const ordersCol  = await col<Order>('orders');
    const reviewsCol = await col<Review>('reviews');
    const bisCol     = await col<BackInStock>('backInStock');
    const subsCol    = await col<Subscriber>('subscribers');

    const emailLc = email.toLowerCase();

    const orderRes = await ordersCol.updateMany(
      { $or: [{ userId: id }, { email: emailLc }, { email }] },
      {
        $set: {
          customer: 'Deleted user',
          email: `deleted+${id}@voltik.invalid`,
          userId: undefined as unknown as string,
          shipping: undefined as unknown as Order['shipping']
        }
      }
    );

    const reviewRes = await reviewsCol.deleteMany({ userId: id });
    await bisCol.deleteMany({ email: emailLc });
    await subsCol.deleteMany({ email: emailLc });
    await usersCol.deleteOne({ id });

    return {
      orders: orderRes.modifiedCount || 0,
      reviews: reviewRes.deletedCount || 0
    };
  },

  /**
   * Lazy-prune cart lines + favorites whose underlying product no longer
   * exists. Returns the (possibly cleaned) user. Cheap when nothing's stale:
   * one indexed find of product ids + an early exit.
   */
  async pruneUserRefs(id: string): Promise<User | null> {
    const usersCol    = await col<User>('users');
    const productsCol = await col<Product>('products');
    const user = clean(await usersCol.findOne({ id }));
    if (!user) return null;

    const allIds = new Set<string>();
    const cursor = productsCol.find({}, { projection: { id: 1, _id: 0 } });
    for await (const doc of cursor) {
      if ((doc as { id?: string }).id) allIds.add((doc as { id: string }).id);
    }

    const cleanCart = (user.cart || []).filter(l => allIds.has(l.id));
    const cleanFavs = (user.favorites || []).filter(pid => allIds.has(pid));

    const cartChanged = cleanCart.length !== (user.cart?.length || 0);
    const favsChanged = cleanFavs.length !== (user.favorites?.length || 0);
    if (cartChanged || favsChanged) {
      await usersCol.updateOne({ id }, { $set: { cart: cleanCart, favorites: cleanFavs } });
      user.cart = cleanCart;
      user.favorites = cleanFavs;
    }
    return user;
  },

  /* ─── admins ────────────────────────────────────────────── */
  async listAdmins(): Promise<Admin[]> {
    const c = await col<Admin>('admins');
    return cleanMany(await c.find({}).toArray());
  },
  async getAdminByEmail(email: string): Promise<Admin | null> {
    const c = await col<Admin>('admins');
    return clean(await c.findOne({ email: email.toLowerCase() }));
  },
  async upsertAdmin(a: Admin): Promise<Admin> {
    const c = await col<Admin>('admins');
    await c.updateOne({ id: a.id }, { $set: a }, { upsert: true });
    return a;
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
  /**
   * Recompute and persist the cached rating + review count on the
   * product row. Cheap (one find + one update) and idempotent — call
   * after every review write/delete/vote/hide so the storefront never
   * has to walk the review table on a hot path.
   */
  async recomputeProductAggregate(productId: string): Promise<void> {
    const reviewsCol = await col<Review>('reviews');
    const productsCol = await col<Product>('products');
    const visible = await reviewsCol.find({ productId, hidden: { $ne: true } }).toArray();
    let rating = 0;
    if (visible.length > 0) {
      const sum = visible.reduce((s, r) => s + (r.rating || 0), 0);
      rating = Math.round((sum / visible.length) * 10) / 10;
    }
    await productsCol.updateOne(
      { id: productId },
      { $set: { cachedRating: rating, cachedReviewsCount: visible.length } }
    );
  },
  async upsertReview(r: Review): Promise<Review> {
    const c = await col<Review>('reviews');
    // We match on `(productId, userId)` first so a duplicate review
    // submission for the same product+user updates the existing row
    // even if the caller invented a fresh `id` for it. The unique
    // index closes the race where two concurrent writers each think
    // they're inserting for the first time — the loser hits a
    // duplicate-key error which we swallow + retry as an update.
    try {
      await c.updateOne(
        { productId: r.productId, userId: r.userId },
        { $set: r, $setOnInsert: { id: r.id } },
        { upsert: true }
      );
    } catch (e: any) {
      // 11000 = duplicate key. Could only fire if a parallel writer
      // landed between our findOne and our upsert — retry as an
      // update against the row that won.
      if (e?.code === 11000) {
        await c.updateOne({ productId: r.productId, userId: r.userId }, { $set: r });
      } else {
        throw e;
      }
    }
    // Refresh the cached aggregate so /shop + product listings see the
    // new rating without paying for a per-request review walk.
    await this.recomputeProductAggregate(r.productId).catch(() => {});
    return r;
  },
  async getReview(id: string): Promise<Review | null> {
    const c = await col<Review>('reviews');
    return clean(await c.findOne({ id }));
  },
  async deleteReview(id: string): Promise<void> {
    const c = await col<Review>('reviews');
    const target = clean(await c.findOne({ id }));
    await c.deleteOne({ id });
    if (target) await this.recomputeProductAggregate(target.productId).catch(() => {});
  },
  /**
   * Record a helpfulness vote — idempotent per (reviewId, userId, kind).
   * If a user changes their mind, we move them between the helpful and
   * not-helpful buckets atomically.
   */
  async voteOnReview(reviewId: string, userId: string, kind: 'helpful' | 'notHelpful'): Promise<Review | null> {
    const c = await col<Review>('reviews');
    const r = clean(await c.findOne({ id: reviewId }));
    if (!r) return null;

    const helpful    = new Set(r.helpfulVoters    || []);
    const notHelpful = new Set(r.notHelpfulVoters || []);

    // Toggle: if they're already in the same bucket, remove the vote.
    if (kind === 'helpful' && helpful.has(userId)) {
      helpful.delete(userId);
    } else if (kind === 'notHelpful' && notHelpful.has(userId)) {
      notHelpful.delete(userId);
    } else {
      // Switch: remove from the other bucket, add to the new one.
      helpful.delete(userId);
      notHelpful.delete(userId);
      (kind === 'helpful' ? helpful : notHelpful).add(userId);
    }

    const updated: Review = {
      ...r,
      helpfulVoters: Array.from(helpful),
      notHelpfulVoters: Array.from(notHelpful),
      helpfulCount: helpful.size,
      notHelpfulCount: notHelpful.size
    };
    await c.updateOne({ id: reviewId }, { $set: updated });
    return updated;
  },

  /* ─── promo codes ───────────────────────────────────────── */
  async listPromos(): Promise<PromoCode[]> {
    const c = await col<PromoCode>('promos');
    return cleanMany(await c.find({}).sort({ createdAt: -1 }).toArray());
  },
  /** Look up an active, non-expired, non-exhausted code by its string. */
  async getActivePromo(code: string): Promise<PromoCode | null> {
    const c = await col<PromoCode>('promos');
    const row = clean(await c.findOne({ code: code.toUpperCase() }));
    if (!row || !row.active) return null;
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return null;
    if (row.usageLimit != null && row.usedCount >= row.usageLimit) return null;
    return row;
  },
  async upsertPromo(p: PromoCode): Promise<PromoCode> {
    const c = await col<PromoCode>('promos');
    const normalized = { ...p, id: p.code.toUpperCase(), code: p.code.toUpperCase() };
    await c.updateOne({ id: normalized.id }, { $set: normalized }, { upsert: true });
    return normalized;
  },
  async deletePromo(code: string): Promise<void> {
    const c = await col<PromoCode>('promos');
    await c.deleteOne({ id: code.toUpperCase() });
  },
  async incPromoUsage(code: string): Promise<void> {
    const c = await col<PromoCode>('promos');
    await c.updateOne({ id: code.toUpperCase() }, { $inc: { usedCount: 1 } });
  },

  /* ─── back-in-stock notifications ───────────────────────── */
  async listBackInStock(): Promise<BackInStock[]> {
    const c = await col<BackInStock>('backInStock');
    return cleanMany(await c.find({}).sort({ createdAt: -1 }).toArray());
  },
  async listBackInStockFor(productId: string): Promise<BackInStock[]> {
    const c = await col<BackInStock>('backInStock');
    return cleanMany(await c.find({ productId }).toArray());
  },
  /** Idempotent — re-subscribing the same email returns the existing row. */
  async addBackInStock(productId: string, email: string): Promise<BackInStock> {
    const c = await col<BackInStock>('backInStock');
    const normalized = email.trim().toLowerCase();
    const existing = clean(await c.findOne({ productId, email: normalized }));
    if (existing) return existing;
    const row: BackInStock = {
      id: `bis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      productId,
      email: normalized,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await c.insertOne(row as any);
    return row;
  },
  /** Drain the queue once stock arrives — caller is expected to send the emails. */
  async drainBackInStock(productId: string): Promise<BackInStock[]> {
    const c = await col<BackInStock>('backInStock');
    const drained = cleanMany(await c.find({ productId }).toArray());
    if (drained.length) await c.deleteMany({ productId });
    return drained;
  },

  /* ─── newsletter subscribers ────────────────────────────── */
  async listSubscribers(): Promise<Subscriber[]> {
    const c = await col<Subscriber>('subscribers');
    return cleanMany(await c.find({}).sort({ createdAt: -1 }).toArray());
  },
  async addSubscriber(email: string, source?: string): Promise<Subscriber> {
    const c = await col<Subscriber>('subscribers');
    const normalized = email.trim().toLowerCase();
    const existing = clean(await c.findOne({ email: normalized }));
    if (existing) return existing;
    const sub: Subscriber = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      email: normalized,
      createdAt: new Date().toISOString().slice(0, 10),
      source
    };
    await c.insertOne(sub as any);
    return sub;
  },

  /* ─── audit log ─────────────────────────────────────────── */
  /**
   * Append-only record of an admin mutation. Fire-and-forget — the
   * caller awaits but failures are caught upstream so a Mongo blip on
   * the audit collection never blocks the actual mutation.
   */
  async appendAuditEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<void> {
    const c = await col<AuditEvent>('auditLog');
    const row: AuditEvent = {
      ...event,
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    await c.insertOne(row as any);
  },
  /** Most recent audit events, newest first. Caller can filter by actor or target. */
  async listAuditEvents(opts: { actor?: string; targetType?: string; targetId?: string; limit?: number } = {}): Promise<AuditEvent[]> {
    const c = await col<AuditEvent>('auditLog');
    const filter: Record<string, unknown> = {};
    if (opts.actor)      filter.actor = opts.actor;
    if (opts.targetType) filter.targetType = opts.targetType;
    if (opts.targetId)   filter.targetId = opts.targetId;
    const limit = Math.min(500, Math.max(1, opts.limit ?? 100));
    return cleanMany(await c.find(filter).sort({ createdAt: -1 }).limit(limit).toArray());
  },

  /* ─── promotional ads ───────────────────────────────────── */
  async listAds(): Promise<Ad[]> {
    const c = await col<Ad>('ads');
    return cleanMany(await c.find({}).sort({ priority: -1, createdAt: -1 }).toArray());
  },
  /** Active ads in a specific placement, filtered by date window + sorted
   *  by priority. Used by the storefront to pick what to show. */
  async listActiveAds(placement?: Ad['placement']): Promise<Ad[]> {
    const c = await col<Ad>('ads');
    const all = cleanMany(await c.find({ active: true }).sort({ priority: -1 }).toArray());
    const now = Date.now();
    return all.filter(a => {
      if (placement && a.placement !== placement) return false;
      if (a.startsAt && new Date(a.startsAt).getTime() > now) return false;
      if (a.endsAt   && new Date(a.endsAt).getTime()   < now) return false;
      return true;
    });
  },
  async getAd(id: string): Promise<Ad | null> {
    const c = await col<Ad>('ads');
    return clean(await c.findOne({ id }));
  },
  async upsertAd(a: Ad): Promise<Ad> {
    const c = await col<Ad>('ads');
    await c.updateOne({ id: a.id }, { $set: a }, { upsert: true });
    return a;
  },
  async deleteAd(id: string): Promise<void> {
    const c = await col<Ad>('ads');
    await c.deleteOne({ id });
  }
};
