# Voltik — Mobile Accessories E-commerce Platform

A production-grade mobile accessories storefront built on **Next.js 15** (App Router) with a **MongoDB Atlas** backend, full admin console, per-user dashboards, real reviews, and ready-to-deploy on **Vercel**.

---

## What's inside

### Customer storefront
- Animated landing with mesh hero, 8 categories, deals, trending, testimonials, newsletter
- Shop with sticky filters: search, **hierarchical category tree** (cascades across descendants), price range, rating, 5 sort modes
- Product detail page with real customer reviews (rating distribution, write/edit/delete your own)
- Cart + 3-method checkout (Card · UPI · COD)
- Dark / light theme toggle, fully mobile-responsive

### User accounts (`/login`, `/signup`, `/account`)
- Email + password registration with scrypt-hashed credentials
- Cart syncs to MongoDB while signed in, localStorage when anonymous (merged on login)
- Favorites with cross-device persistence
- **User dashboard** at `/account`:
  - Overview with KPIs, recent orders, recently delivered products
  - My Orders with status tabs + a 4-step delivery tracker per order
  - My Reviews with inline edit/delete
  - Favorites
  - Profile (edit name/email, change password)

### Admin console (`/admin`)
- Email-based login (default: `arizz@gmail.com` / `arizz123#` — override via env)
- Dashboard with KPIs, custom SVG revenue chart, orders-by-status, top products, low-stock alerts
- **Products** full CRUD with modal editor and live preview
- **Orders** with pipeline cards + one-click status updates
- **Customers**, **Categories** (full hierarchical tree CRUD)

### Backend (Node.js runtime · MongoDB)
- Connection-pooled Mongo client cached on `globalThis`
- Lazy unique indexes on `id` (and `email` for users)
- Idempotent first-run seeding (race-safe via `bulkWrite` upserts)
- 16 route handlers under `app/api/*` covering products, orders, customers, categories, users, sessions, cart, favorites, reviews, stats, auth

---

## Tech stack

| Layer       | Choice |
|-------------|--------|
| Framework   | Next.js 15 (App Router) |
| Runtime     | Node.js (route handlers) |
| Language    | TypeScript (strict) |
| Styling     | Tailwind CSS 3 with CSS custom-properties for theming |
| Database    | **MongoDB Atlas** via the official `mongodb` driver |
| State       | React Context + httpOnly cookie sessions |
| Auth        | scrypt password hashing (Node built-in), separate user + admin cookies |
| Icons       | Custom inline-SVG library — zero external image deps |

---

## Local setup

### 1. Install
```bash
cd voltik
npm install
```

### 2. Create your MongoDB Atlas cluster
A free **M0** cluster is plenty for this app.

1. Sign up at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Build a Cluster** → choose the free `M0` tier and any region close to you
3. **Database Access** → **Add New Database User**
   - Authentication method: *Password*
   - Privileges: *Read and write to any database*
   - Save the username + password
4. **Network Access** → **Add IP Address**
   - For local dev: click **Add Current IP Address**
   - For Vercel: add `0.0.0.0/0` *(Allow access from anywhere — see "Tightening Network Access" below for production)*
5. **Connect** → **Drivers** → **Node.js** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@<cluster-id>.mongodb.net/?retryWrites=true&w=majority&appName=voltik
   ```

### 3. Configure environment
Copy the example file and fill in your values:
```bash
cp .env.example .env.local
```
Then edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority&appName=voltik
MONGODB_DB=voltik
ADMIN_USER=arizz@gmail.com
ADMIN_PASS=arizz123#
```

### 4. Run
```bash
npm run dev
```

- Storefront → [http://localhost:3000](http://localhost:3000)
- Admin → [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  - Email: `arizz@gmail.com`
  - Password: `arizz123#`
- User accounts pre-seeded:
  - `demo@voltik.com` / `demo123` (has order history + favorites)
  - `alex@voltik.com` / `alex1234`

On first request, Voltik will create the `voltik` database, six collections (`products`, `orders`, `customers`, `categories`, `users`, `reviews`), and populate them from the seed data in [lib/seed.ts](lib/seed.ts).

---

## Deploying to Vercel from GitHub

### What you need
- A GitHub repo containing this project (just `voltik/` is fine, or the whole thing)
- A free Vercel account ([vercel.com](https://vercel.com))
- The MongoDB Atlas cluster from the section above
- Your `MONGODB_URI` and admin credentials ready

### Step-by-step

1. **Push to GitHub** — make sure `.env.local` is *not* committed (the included `.gitignore` already excludes it).
2. **Atlas Network Access** — Vercel's serverless functions don't run from a fixed IP. Either:
   - Allow all IPs: add `0.0.0.0/0` to **Network Access** in Atlas (simplest, fine for getting started)
   - Or use **Atlas Network Peering / PrivateLink** for production hardening
3. **Import the repo into Vercel**:
   - From the Vercel dashboard → **Add New… → Project**
   - Pick your GitHub repo
   - When asked for the **Root Directory**, set it to `voltik` (if the project sits inside a sub-folder of your repo)
   - Framework is auto-detected as **Next.js**
4. **Environment Variables** (in the same "Configure Project" screen, or under **Project → Settings → Environment Variables** later):

   | Key            | Value                                                          | Environments |
   |----------------|----------------------------------------------------------------|--------------|
   | `MONGODB_URI`  | Your Atlas connection string                                   | Production, Preview, Development |
   | `MONGODB_DB`   | `voltik`                                                       | All |
   | `ADMIN_USER`   | `arizz@gmail.com` *(or your own)*                              | All |
   | `ADMIN_PASS`   | `arizz123#` *(or your own — please change for production!)*    | All |

5. Click **Deploy**. Vercel will install dependencies, run `next build`, and roll out to a `*.vercel.app` URL.
6. First request to the live site will auto-seed the collections.

### After deploy
- Visit `/admin/login` on your `*.vercel.app` URL and sign in with `ADMIN_USER` / `ADMIN_PASS`.
- Storefront should work end-to-end: sign up a user, place an order, write a review.
- Check Atlas → **Browse Collections** to see the data land in the `voltik` DB.

### Tightening network access for production
The `0.0.0.0/0` rule is fine for a demo. Before you put this in front of real customers:
- Use **MongoDB Atlas → Network Peering** or **Private Endpoint** to talk to MongoDB without ever traversing the public internet
- Rotate the demo admin password (`ADMIN_PASS` env var)
- Remove the two demo users from `lib/seed.ts` so they don't get re-seeded after a wipe

---

## Environment variables reference

| Variable      | Required | Purpose |
|---------------|----------|---------|
| `MONGODB_URI` | **Yes**  | Full SRV connection string from Atlas |
| `MONGODB_DB`  | No       | Database name. Default: `voltik` |
| `ADMIN_USER`  | No       | Admin login email. Default: `arizz@gmail.com` |
| `ADMIN_PASS`  | No       | Admin login password. Default: `arizz123#` |

---

## Project layout

```
voltik/
├── app/
│   ├── layout.tsx · page.tsx           # root + landing
│   ├── shop/                           # catalog with filters
│   ├── product/[id]/                   # product detail + reviews
│   ├── cart/ · checkout/               # checkout flow
│   ├── login/ · signup/                # user auth
│   ├── account/                        # user dashboard (gated)
│   │   ├── page.tsx                    # overview
│   │   ├── orders/ · orders/[id]/      # order history + tracker
│   │   ├── reviews/ · favorites/ · profile/
│   ├── admin/                          # admin console (gated)
│   │   ├── login/ · page.tsx           # dashboard
│   │   ├── products/ · orders/ · customers/ · categories/
│   └── api/                            # Node.js route handlers
├── components/                         # Navbar, Footer, ProductCard, etc.
├── lib/
│   ├── mongo.ts                        # cached MongoClient
│   ├── db.ts                           # public data API (Mongo-backed)
│   ├── seed.ts                         # initial data (products, users, reviews, …)
│   ├── auth.ts · passwords.ts          # scrypt + session helpers
│   ├── reviews.ts                      # rating aggregation
│   ├── categoryTree.ts · types.ts
├── middleware.ts                       # gates /admin/* and /account/*
├── next.config.mjs
├── .env.example
└── tailwind.config.ts
```

---

## Resetting the data

Drop the collections in Atlas (or use the Mongo shell):
```js
use voltik
db.products.drop(); db.orders.drop(); db.customers.drop();
db.categories.drop(); db.users.drop(); db.reviews.drop();
```
Next request re-seeds everything from `lib/seed.ts`.

---

Built as a polished, end-to-end demo. Have fun ⚡
