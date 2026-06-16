import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Icon } from '@/components/Icons';
import { ProductIllustration } from '@/components/ProductIllustration';
import { OrderTracker } from '@/components/OrderTracker';
import { CancelOrderButton } from './CancelOrderButton';
import { ReorderButton } from './ReorderButton';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-warn/15 text-warn',
  processing: 'bg-brand/15 text-brand',
  shipped:    'bg-brand2/15 text-brand2',
  delivered:  'bg-success/15 text-success',
  cancelled:  'bg-danger/15 text-danger'
};

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: encId } = await params;
  const id = decodeURIComponent(encId);

  const user = await currentUser();
  if (!user) redirect(`/login?next=/account/orders/${encId}`);

  const [order, products] = await Promise.all([db.getOrder(id), db.listProducts()]);
  if (!order) notFound();

  // Ownership guard. Prefer matching by `userId` since it's the strong
  // identity link; only fall back to email when the order has no
  // userId attached (guest checkouts placed before account creation).
  // This stops the "another account with my email happened to log in"
  // scenario from ever leaking an order detail.
  const isOwner = order.userId
    ? order.userId === user.id
    : order.email?.toLowerCase() === user.email.toLowerCase();
  if (!isOwner) notFound();

  const lines = order.lines || [];
  const lineRows = lines.map(l => {
    const p = products.find(x => x.id === l.id);
    return { line: l, product: p };
  });
  const subtotal = lineRows.reduce((s, r) => s + (r.product ? r.product.price * r.line.qty : 0), 0);
  // For the reorder button — only re-add lines whose product still exists and has stock.
  const availableIds = lineRows
    .filter(r => r.product && r.product.stock > 0)
    .map(r => r.line.id);

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">
        <Icon.arrow width={12} height={12} className="rotate-180" /> Back to orders
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <div>
          <div className="font-mono text-xs text-muted">{order.id}</div>
          <h2 className="font-display font-bold text-2xl mt-1">Order detail</h2>
          <div className="text-xs text-muted">Placed on {order.date}</div>
        </div>
        <span className={`chip ${STATUS_STYLES[order.status]} capitalize ml-auto`}>{order.status}</span>
      </header>

      {/* Animated tracker — truck rolls along the route */}
      <OrderTracker status={order.status} />

      {/* Tracking number once admin enters it. */}
      {order.tracking?.number && (
        <div className="card p-5 flex items-start gap-3">
          <span
            className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,rgb(var(--brand)),rgb(var(--brand2)))' }}
          >
            <Icon.truck width={18} height={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted font-semibold">{order.tracking.carrier}</div>
            <div className="font-mono text-sm mt-0.5 break-all">{order.tracking.number}</div>
          </div>
          {order.tracking.url && (
            <a href={order.tracking.url} target="_blank" rel="noreferrer" className="btn-ghost text-xs shrink-0">
              Track <Icon.arrow width={12} height={12} />
            </a>
          )}
        </div>
      )}

      {/* Admin's customer-facing note. */}
      {order.customerNote && (
        <div className="card p-5 border-brand/30 bg-brand/5 flex items-start gap-3">
          <Icon.spark width={16} height={16} className="text-brand shrink-0 mt-1" />
          <div className="text-sm leading-relaxed text-ink whitespace-pre-line">{order.customerNote}</div>
        </div>
      )}

      {/* Per-status actions — cancel while pending, reorder once the order is settled. */}
      <div className="flex flex-wrap gap-3 justify-end">
        {(order.status === 'delivered' || order.status === 'cancelled') && lines.length > 0 && (
          <ReorderButton lines={lines} availableIds={availableIds} />
        )}
        {order.status === 'pending' && <CancelOrderButton orderId={order.id} />}
      </div>

      {/* Items */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-lg mb-4">Items ({order.items})</h3>
        {lineRows.length === 0 ? (
          <p className="text-sm text-muted italic">No per-product breakdown available for this order.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lineRows.map(({ line, product }) => (
              <li key={line.id} className="py-4 flex items-center gap-4">
                {product ? (
                  <ProductIllustration category={product.category} icon={product.icon} className="h-14 w-14 rounded-xl shrink-0" size={28} />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-elev grid place-items-center text-muted shrink-0"><Icon.box width={20} height={20} /></div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={product ? `/product/${product.slug || product.id}` : '/shop'} className="font-semibold hover:text-brand line-clamp-1">
                    {product?.name || 'Discontinued product'}
                  </Link>
                  <div className="text-xs text-muted">Qty {line.qty}{product ? ` · $${product.price.toFixed(2)} each` : ''}</div>
                </div>
                {product && (
                  <div className="text-right">
                    <div className="font-bold">${(product.price * line.qty).toFixed(2)}</div>
                    {order.status === 'delivered' && (
                      <Link href={`/product/${product.slug || product.id}#reviews`} className="text-[11px] text-brand hover:underline">Write review</Link>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Shipping + summary */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-3">Shipping address</h3>
          {order.shipping ? (
            <div className="text-sm text-muted leading-relaxed">
              <div className="text-ink font-semibold">{order.customer}</div>
              {order.shipping.address}<br/>
              {order.shipping.city}, {order.shipping.country}<br/>
              <span className="font-mono text-xs">{order.shipping.phone}</span>
            </div>
          ) : (
            <p className="text-sm text-muted italic">No shipping address on record.</p>
          )}
        </div>
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-3">Payment summary</h3>
          <dl className="text-sm space-y-2">
            <Row label="Payment method" value={order.payment} />
            {subtotal > 0 && <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />}
            <div className="flex justify-between font-bold pt-2 border-t border-line">
              <span>Total paid</span>
              <span className="gradient-text">${order.total.toFixed(2)}</span>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt className="text-muted">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}
