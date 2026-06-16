import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import { enrichOne } from '@/lib/reviews';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Voltik product';

/**
 * Per-product Open Graph image. Next.js' opengraph-image.tsx convention
 * auto-wires the right <meta property="og:image"> tag for this route, and
 * serves the rendered PNG at /product/[id]/opengraph-image.
 *
 * We use the system font stack to avoid fetching custom fonts at edge time.
 */
export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await db.getProductByIdOrSlug(id);

  if (!raw) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 64, fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
          }}
        >
          Voltik
        </div>
      ),
      { ...size }
    );
  }

  const product = await enrichOne(raw);
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0e1a 0%, #131a2b 60%, #1d1240 100%)',
          color: 'white',
          padding: 60,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          position: 'relative'
        }}
      >
        {/* Glow accents */}
        <div
          style={{
            position: 'absolute', top: -160, right: -120, width: 520, height: 520,
            borderRadius: 520, background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 60%)'
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -160, left: -160, width: 520, height: 520,
            borderRadius: 520, background: 'radial-gradient(circle, rgba(14,165,233,0.35), transparent 60%)'
          }}
        />

        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>Voltik</div>
        </div>

        {/* Headline + meta */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60, flex: 1 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            {product.badge && (
              <div
                style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: 'rgba(168,85,247,0.2)', color: '#c4b5fd',
                  fontSize: 18, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2
                }}
              >
                {product.badge}
              </div>
            )}
            {discount > 0 && (
              <div
                style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: 'rgba(248,113,113,0.2)', color: '#fca5a5',
                  fontSize: 18, fontWeight: 700
                }}
              >
                −{discount}%
              </div>
            )}
            <div
              style={{
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)',
                fontSize: 16, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.2
              }}
            >
              {product.category}
            </div>
          </div>

          <div
            style={{
              fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2,
              maxWidth: 1000, display: 'flex'
            }}
          >
            {product.name}
          </div>

          <div
            style={{
              fontSize: 26, color: 'rgba(255,255,255,0.7)', marginTop: 20, lineHeight: 1.4,
              maxWidth: 920, display: 'flex'
            }}
          >
            {product.description.length > 140 ? `${product.description.slice(0, 137)}…` : product.description}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.6, textTransform: 'uppercase' }}>
              {product.brand} · {product.sku}
            </div>
            {product.reviewsCount > 0 && (
              <div style={{ fontSize: 22, color: '#fbbf24', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                ★ {product.rating.toFixed(1)}
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, marginLeft: 6 }}>
                  · {product.reviewsCount} reviews
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {product.oldPrice && (
              <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through' }}>
                ${product.oldPrice.toFixed(2)}
              </div>
            )}
            <div
              style={{
                fontSize: 92, fontWeight: 800, letterSpacing: -2,
                background: 'linear-gradient(135deg, #38bdf8, #a855f7, #f472b6)',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'flex'
              }}
            >
              ${product.price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
