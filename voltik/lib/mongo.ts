import { MongoClient, ServerApiVersion, type Db } from 'mongodb';

/**
 * Shared MongoClient. We cache the connection promise on `globalThis` so that:
 *  - In dev, HMR doesn't open a new pool every reload.
 *  - In serverless (Vercel), each warm function reuses the same socket.
 *
 * On failure the cached promise is invalidated so that fixing env vars and
 * re-deploying (or even the next request) recovers without a forced restart.
 */
declare global {
  // eslint-disable-next-line no-var
  var _voltikMongo: Promise<MongoClient> | undefined;
}

export class MongoConfigError extends Error {
  hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.name = 'MongoConfigError';
    this.hint = hint;
  }
}

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new MongoConfigError(
      'MONGODB_URI is not set.',
      'On Vercel: Project → Settings → Environment Variables → add MONGODB_URI, then redeploy.'
    );
  }
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new MongoConfigError(
      'MONGODB_URI does not look like a valid connection string.',
      'It must start with "mongodb+srv://" (Atlas) or "mongodb://" (self-hosted).'
    );
  }
  return uri;
}

function getDbName(): string {
  return process.env.MONGODB_DB || 'voltik';
}

async function connect(): Promise<MongoClient> {
  const client = new MongoClient(getUri(), {
    serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
    // Fail fast when env / network is misconfigured instead of hanging 30s.
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 8_000,
    socketTimeoutMS: 15_000,
    maxPoolSize: 10,
    minPoolSize: 0
  });
  return client.connect();
}

/** Lazy, cached Mongo connection. Throws only on first use, never at import. */
export async function getMongoClient(): Promise<MongoClient> {
  if (!globalThis._voltikMongo) {
    globalThis._voltikMongo = connect().catch(err => {
      // Drop the cached failed promise so the next request re-tries.
      globalThis._voltikMongo = undefined;
      throw err;
    });
  }
  return globalThis._voltikMongo;
}

export async function getDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(getDbName());
}

/* ─── Diagnostics ───────────────────────────────────────────────────
   Used by /api/health and the global error boundary to surface
   actionable info instead of a generic 500 page.
   ──────────────────────────────────────────────────────────────── */

export type HealthReport = {
  ok: boolean;
  configured: boolean;
  hasUri: boolean;
  hasAdmin: boolean;
  dbName: string;
  pingMs?: number;
  error?: { name: string; message: string; hint?: string };
};

export async function checkHealth(): Promise<HealthReport> {
  const hasUri = !!process.env.MONGODB_URI;
  const hasAdmin = !!process.env.ADMIN_USER && !!process.env.ADMIN_PASS;
  const dbName = getDbName();

  if (!hasUri) {
    return {
      ok: false,
      configured: false,
      hasUri: false,
      hasAdmin,
      dbName,
      error: {
        name: 'MongoConfigError',
        message: 'MONGODB_URI is not set.',
        hint: 'Add MONGODB_URI in Vercel → Project → Settings → Environment Variables, then redeploy.'
      }
    };
  }

  try {
    const t0 = Date.now();
    const db = await getDb();
    await db.command({ ping: 1 });
    return {
      ok: true,
      configured: true,
      hasUri: true,
      hasAdmin,
      dbName,
      pingMs: Date.now() - t0
    };
  } catch (e: any) {
    const isTimeout = /timed out|timeout|ServerSelectionError/i.test(e?.message || '');
    const isAuth    = /Authentication failed|bad auth|not authorized/i.test(e?.message || '');
    const isDns     = /querySrv|ENOTFOUND|getaddrinfo/i.test(e?.message || '');

    let hint = e?.hint ?? 'Open the Vercel function logs for the full stack trace.';
    if (isTimeout) hint = 'Atlas → Network Access → Add IP Address → allow 0.0.0.0/0 (or PrivateLink). Vercel functions do not have fixed IPs.';
    else if (isAuth) hint = 'The Atlas database user / password in MONGODB_URI is wrong. Special chars in the password must be URL-encoded.';
    else if (isDns)  hint = 'Cluster hostname in MONGODB_URI is wrong or the cluster is paused. Copy the URI again from Atlas → Connect → Drivers.';

    return {
      ok: false,
      configured: true,
      hasUri: true,
      hasAdmin,
      dbName,
      error: { name: e?.name || 'Error', message: e?.message || String(e), hint }
    };
  }
}
