'use client';

import { useEffect, useState } from 'react';

/**
 * Global error boundary for Next.js App Router. Renders whenever any
 * route in the tree throws on the server. We probe /api/health to find
 * out *why* the request failed and show actionable instructions instead
 * of just a digest.
 *
 * Must declare its own <html>/<body>. No external CSS imports allowed.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, error: { name: 'Network', message: 'Could not reach /api/health' } }))
      .finally(() => setLoading(false));
  }, []);

  const issue = !health ? null : !health.hasUri ? 'no-uri'
              : health.error?.hint?.includes('Network Access') ? 'network'
              : health.error?.hint?.includes('password') ? 'auth'
              : health.error?.hint?.includes('hostname') ? 'dns'
              : health.error ? 'other' : 'healthy';

  return (
    <html lang="en">
      <body style={s.body}>
        <div style={s.shell}>
          {/* Character — a friendly unplugged-cable mascot. SVG so it
              survives without any external assets, and it gently breathes
              via CSS to suggest the page isn't dead. */}
          <div style={s.mascotWrap} aria-hidden>
            <svg viewBox="0 0 200 140" width="160" height="112" className="voltik-mascot" style={s.mascot}>
              <defs>
                <linearGradient id="cable-bolt" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              {/* Wall socket */}
              <rect x="6" y="56" width="42" height="36" rx="8" fill="#1a2138" stroke="#242c46" strokeWidth="1.5" />
              <circle cx="20" cy="74" r="3.5" fill="#0a0e1a" />
              <circle cx="34" cy="74" r="3.5" fill="#0a0e1a" />
              {/* Cable arc — slumped, sparks at the broken end */}
              <path
                d="M48 74 C 78 58, 96 116, 122 92"
                fill="none" stroke="url(#cable-bolt)" strokeWidth="6" strokeLinecap="round"
              />
              {/* Plug head, eyes, frown */}
              <g transform="translate(118 84) rotate(18)">
                <rect x="0" y="0" width="48" height="32" rx="8" fill="#11162a" stroke="#242c46" strokeWidth="1.5" />
                <rect x="6" y="-7" width="6" height="9" rx="2" fill="#cbd5e1" />
                <rect x="22" y="-7" width="6" height="9" rx="2" fill="#cbd5e1" />
                <circle cx="14" cy="14" r="2.4" fill="#f0f4ff" />
                <circle cx="32" cy="14" r="2.4" fill="#f0f4ff" />
                <path d="M14 22 Q 24 17, 32 22" stroke="#f0f4ff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
              {/* Spark trio */}
              <g fill="#fbbf24" opacity="0.9">
                <path d="M156 70 L 159 64 L 162 70 L 168 70 L 162 74 L 165 80 L 159 76 L 153 80 L 156 74 L 150 70 Z" />
              </g>
            </svg>
          </div>

          <div style={s.badge}>SERVER ERROR</div>
          <h1 style={s.h1}>Something came unplugged.</h1>
          <p style={s.lead}>
            Voltik couldn't render this page. Most often the database isn't reachable —
            below is a live diagnostic from <code style={s.code}>/api/health</code> to
            point you at the fix.
          </p>

          <style>{`
            @keyframes mascotBreathe {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-4px); }
            }
            @media (prefers-reduced-motion: no-preference) {
              .voltik-mascot { animation: mascotBreathe 4s ease-in-out infinite; }
            }
          `}</style>

          <div style={s.card}>
            <div style={s.row}>
              <strong>Status</strong>
              <span style={loading ? s.pillIdle : health?.ok ? s.pillOk : s.pillBad}>
                {loading ? 'Checking…' : health?.ok ? 'Healthy' : 'Unhealthy'}
              </span>
            </div>
            <Kv k="MONGODB_URI"    v={loading ? '…' : health?.hasUri ? 'set' : 'NOT SET'} bad={!loading && !health?.hasUri} />
            <Kv k="MONGODB_DB"     v={loading ? '…' : health?.dbName || '(default)'} />
            <Kv k="Admin creds"    v={loading ? '…' : health?.hasAdmin ? 'set' : 'using defaults'} />
            {health?.pingMs != null && <Kv k="DB ping" v={`${health.pingMs} ms`} />}
            {health?.error && (
              <>
                <Kv k="Error"      v={health.error.message} bad />
                <Kv k="Suggestion" v={health.error.hint || '—'} hint />
              </>
            )}
          </div>

          {issue && issue !== 'healthy' && (
            <div style={s.card}>
              <h3 style={s.h3}>Fix checklist</h3>
              <Checklist issue={issue} />
            </div>
          )}

          <div style={s.actions}>
            <button onClick={reset} style={s.btnPrimary}>Try again</button>
            <a href="/api/health" target="_blank" rel="noreferrer" style={s.btnGhost}>Open health JSON</a>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={s.btnGhost}>Vercel dashboard ↗</a>
            <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" style={s.btnGhost}>MongoDB Atlas ↗</a>
          </div>

          {error?.digest && (
            <p style={s.digest}>Error digest: <code style={s.code}>{error.digest}</code></p>
          )}
        </div>
      </body>
    </html>
  );
}

/* ─── pieces ─────────────────────────────────────────────────── */

function Kv({ k, v, bad, hint }: { k: string; v: string; bad?: boolean; hint?: boolean }) {
  return (
    <div style={s.kv}>
      <span style={s.kvKey}>{k}</span>
      <span style={{ ...(bad ? s.kvBad : s.kvVal), ...(hint ? { fontStyle: 'italic' } : null) }}>{v}</span>
    </div>
  );
}

function Checklist({ issue }: { issue: string }) {
  const steps: Record<string, string[]> = {
    'no-uri': [
      'Go to Vercel → your project → Settings → Environment Variables.',
      'Add MONGODB_URI with your Atlas connection string. Apply to Production, Preview, and Development.',
      'Optionally add MONGODB_DB (defaults to "voltik"), ADMIN_USER and ADMIN_PASS.',
      'Click "Save", then Vercel → Deployments → "Redeploy" the latest deployment.'
    ],
    'network': [
      'Open MongoDB Atlas → Network Access.',
      'Click "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0).',
      'Vercel serverless functions don\'t have a fixed IP, so an IP allow-list won\'t work otherwise.',
      'Wait ~1 minute for the rule to propagate, then refresh.'
    ],
    'auth': [
      'Open MongoDB Atlas → Database Access.',
      'Confirm the username + password in MONGODB_URI exactly match a database user.',
      'If your password contains @ : / # ? &, URL-encode them in the URI (e.g. # → %23).',
      'The user must have "Read and write to any database" privileges.'
    ],
    'dns': [
      'The cluster hostname in MONGODB_URI is wrong, or the Atlas cluster is paused.',
      'Atlas → Clusters → Connect → Drivers → copy the latest connection string.',
      'Paste it into Vercel → Environment Variables and redeploy.'
    ],
    'other': [
      'Open the full error stack in your Vercel project → Deployments → latest deployment → Functions tab.',
      'Match the error name + message to the MongoDB driver docs.'
    ]
  };
  const list = steps[issue] || steps['other'];
  return (
    <ol style={s.ol}>
      {list.map((step, i) => <li key={i} style={s.li}>{step}</li>)}
    </ol>
  );
}

/* ─── styles (inline because global-error must be self-contained) ─── */

const s = {
  body:    { margin: 0, padding: 0, background: '#0a0e1a', color: '#f0f4ff', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh' },
  shell:   { maxWidth: 760, margin: '0 auto', padding: '48px 24px' },
  mascotWrap: { marginBottom: 16 },
  mascot:  { display: 'block', filter: 'drop-shadow(0 12px 30px rgba(56,189,248,0.25))' },
  badge:   { display: 'inline-block', fontSize: 11, letterSpacing: 2, padding: '4px 10px', borderRadius: 999, background: 'rgba(248,113,113,0.15)', color: '#f87171', fontWeight: 700 },
  h1:      { fontSize: 34, fontWeight: 700, margin: '16px 0 8px', lineHeight: 1.1 },
  lead:    { color: '#94a3b8', fontSize: 15, lineHeight: 1.55, marginBottom: 24, maxWidth: 600 },
  card:    { background: '#11162a', border: '1px solid #242c46', borderRadius: 18, padding: 20, marginBottom: 16 },
  row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pillIdle:{ background: '#242c46', color: '#94a3b8', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700 },
  pillOk:  { background: 'rgba(34,197,94,0.18)', color: '#22c55e', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700 },
  pillBad: { background: 'rgba(248,113,113,0.18)', color: '#f87171', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700 },
  kv:      { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid #1a2138', fontSize: 13 },
  kvKey:   { color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1, fontSize: 11, fontWeight: 600 },
  kvVal:   { color: '#f0f4ff', textAlign: 'right' as const, maxWidth: '70%', wordBreak: 'break-word' as const },
  kvBad:   { color: '#f87171', textAlign: 'right' as const, maxWidth: '70%', wordBreak: 'break-word' as const, fontWeight: 700 },
  h3:      { margin: '0 0 12px', fontSize: 15, fontWeight: 700 },
  ol:      { margin: 0, paddingLeft: 20, color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.6 },
  li:      { marginBottom: 6 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 8 },
  btnPrimary: { background: 'linear-gradient(135deg,#38bdf8,#a855f7)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnGhost:   { background: 'transparent', color: '#f0f4ff', border: '1px solid #242c46', padding: '10px 16px', borderRadius: 999, fontWeight: 600, fontSize: 13, textDecoration: 'none' },
  digest:  { marginTop: 24, color: '#64748b', fontSize: 11 },
  code:    { fontFamily: 'ui-monospace, SFMono-Regular, monospace', background: '#1a2138', padding: '2px 6px', borderRadius: 6, fontSize: 12 }
} as const;
