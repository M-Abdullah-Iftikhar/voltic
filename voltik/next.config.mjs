/**
 * Security-header rules. Mostly static, so we declare them here instead
 * of recomputing them in middleware on every request. CSP intentionally
 * permits Google Fonts (the Geist + Inter loaders need it) and the
 * Vercel preview tooling.
 */
const baseSecurityHeaders = [
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // Lock down the high-risk Permissions-Policy surfaces we never use.
  // `unload=()` keeps us in the no-unload-handler era so Chrome can use
  // back/forward cache.
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), unload=()' },
  // HSTS — only meaningful when served over HTTPS; harmless on http.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
];

// CSP — kept as a separate string so it's grep-able. We allow inline
// scripts because Next 15 injects a small bootstrap script at runtime,
// and styles because Tailwind's JIT writes inline styles for animations
// driven by component props.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Keep the mongodb driver out of the webpack bundle — it needs Node runtime.
  serverExternalPackages: ['mongodb'],

  async headers() {
    return [
      {
        // Apply baseline hardening to every response. Per-route overrides
        // (e.g. dropping frame-ancestors for an embed) can extend this.
        source: '/:path*',
        headers: [
          ...baseSecurityHeaders,
          { key: 'Content-Security-Policy', value: CSP }
        ]
      }
    ];
  }
};

export default nextConfig;
