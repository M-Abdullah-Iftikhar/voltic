import { MongoClient, ServerApiVersion, type Db } from 'mongodb';

/**
 * Shared MongoClient. We cache the connection promise on `globalThis` so that:
 *  - In dev, HMR doesn't open a new pool every reload.
 *  - In serverless (Vercel), each warm function reuses the same socket.
 */
declare global {
  // eslint-disable-next-line no-var
  var _voltikMongo: Promise<MongoClient> | undefined;
}

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (locally) or to your Vercel project Environment Variables.'
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
    maxPoolSize: 10,
    minPoolSize: 0
  });
  return client.connect();
}

/** Lazy, cached Mongo connection. Throws only on first use, never at import. */
export async function getMongoClient(): Promise<MongoClient> {
  if (!globalThis._voltikMongo) {
    globalThis._voltikMongo = connect();
  }
  return globalThis._voltikMongo;
}

export async function getDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(getDbName());
}
