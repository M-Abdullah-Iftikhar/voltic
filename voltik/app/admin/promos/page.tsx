import { db } from '@/lib/db';
import { PromosAdminClient } from './PromosAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPromosPage() {
  const promos = await db.listPromos();
  return <PromosAdminClient initialPromos={promos} />;
}
