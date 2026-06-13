import { db } from '@/lib/db';
import { Icon } from '@/components/Icons';

export const dynamic = 'force-dynamic';

const TIER_STYLE: Record<string, string> = {
  Bronze:   'bg-warn/15 text-warn',
  Silver:   'bg-muted/15 text-muted',
  Gold:     'bg-brand/15 text-brand',
  Platinum: 'bg-brand2/15 text-brand2'
};

export default async function AdminCustomersPage() {
  const customers = await db.listCustomers();
  const totalSpent = customers.reduce((s, c) => s + c.spent, 0);
  const avgSpend = customers.length ? totalSpent / customers.length : 0;
  const topTier = customers.filter(c => c.tier === 'Platinum' || c.tier === 'Gold').length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-3xl sm:text-4xl">Customers</h1>
        <p className="text-muted text-sm mt-1">Your community of {customers.length} Voltik customers.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="users"     label="Total customers" value={String(customers.length)} />
        <Stat icon="bolt"      label="Total revenue"   value={`$${totalSpent.toFixed(0)}`} />
        <Stat icon="trending"  label="Avg. lifetime"   value={`$${avgSpend.toFixed(0)}`} />
        <Stat icon="spark"     label="Gold + Platinum" value={String(topTier)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted bg-elev/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-2 py-3 font-semibold">Email</th>
                <th className="text-left px-2 py-3 font-semibold">Phone</th>
                <th className="text-right px-2 py-3 font-semibold">Orders</th>
                <th className="text-right px-2 py-3 font-semibold">Spent</th>
                <th className="text-left px-2 py-3 font-semibold">Since</th>
                <th className="text-left px-5 py-3 font-semibold">Tier</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-t border-line/60 hover:bg-elev/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full grid place-items-center text-white font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}>
                        {c.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted font-mono">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-muted">{c.email}</td>
                  <td className="px-2 py-3 text-muted font-mono text-xs">{c.phone}</td>
                  <td className="px-2 py-3 text-right font-semibold">{c.orders}</td>
                  <td className="px-2 py-3 text-right font-semibold">${c.spent.toFixed(2)}</td>
                  <td className="px-2 py-3 text-muted">{c.since}</td>
                  <td className="px-5 py-3"><span className={`chip ${TIER_STYLE[c.tier]}`}>{c.tier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Icon; label: string; value: string }) {
  const Glyph = Icon[icon];
  return (
    <div className="card p-5">
      <div className="grid place-items-center h-10 w-10 rounded-xl bg-brand/10 text-brand">
        <Glyph width={18} height={18} />
      </div>
      <div className="mt-4 font-display font-bold text-2xl">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
