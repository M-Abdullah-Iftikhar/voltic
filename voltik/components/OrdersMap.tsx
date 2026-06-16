'use client';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icons';
import type { Order } from '@/lib/types';

interface Props {
  orders: Order[];
  /** How many recent orders to ping. Older orders fall off so the map breathes. */
  maxPings?: number;
}

/**
 * Stylised world map with animated "incoming order" pings. We don't ship
 * a real geocoder — instead, each order's shipping country (or a
 * deterministic hash of its id, as a fallback) maps to one of a handful
 * of well-known city coordinates. The result is decorative, not
 * geographically precise; the goal is "the world is shopping" energy.
 *
 * Pings cycle through orders on a loop so the map stays alive long after
 * the page loads. Reduced-motion users see static dots, no animation.
 */
export function OrdersMap({ orders, maxPings = 12 }: Props) {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Pick the most recent non-cancelled orders and pin each to a city.
  const pings = useMemo(() => {
    return orders
      .filter(o => o.status !== 'cancelled')
      .slice(0, maxPings)
      .map(o => {
        const city = pickCity(o);
        const xy = projectMercator(city.lat, city.lon);
        return {
          id: o.id,
          name: o.customer.split(/\s+/)[0] || 'Someone',
          country: o.shipping?.country || city.country,
          total: o.total,
          x: xy.x,
          y: xy.y,
          city: city.name
        };
      });
  }, [orders, maxPings]);

  // Cycle the "currently active" ping every 2.4s so attention rotates
  // around the map naturally.
  useEffect(() => {
    if (reduced || pings.length === 0) return;
    const t = setInterval(() => setActive(i => (i + 1) % pings.length), 2400);
    return () => clearInterval(t);
  }, [reduced, pings.length]);

  if (pings.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-display font-bold text-lg">Where orders come from</h3>
        <p className="text-sm text-muted mt-3">No live orders yet — the map will fill in as buyers come online.</p>
      </div>
    );
  }

  const current = pings[active];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h3 className="font-display font-bold text-lg">Where orders come from</h3>
          <p className="text-xs text-muted mt-0.5">Live ping from the last {pings.length} non-cancelled orders.</p>
        </div>
        <span className="chip bg-success/15 text-success">
          <span className="relative grid place-items-center h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulseRing" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>

      <div className="relative mt-4 aspect-[2/1] rounded-2xl overflow-hidden bg-elev/40">
        {/* Stylised world map — abstract dot grid; no external SVG asset.
            We render dots at the projected positions of a continent
            sample so the shapes read as a map without the file weight. */}
        <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full" aria-hidden>
          {CONTINENT_DOTS.map((d, i) => (
            <circle key={i} cx={d[0]} cy={d[1]} r="0.3" fill="rgb(var(--line))" opacity="0.7" />
          ))}
        </svg>

        {/* Pings */}
        {pings.map((p, i) => {
          const isActive = !reduced && i === active;
          return (
            <span
              key={p.id}
              aria-label={`${p.name} from ${p.city}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -inset-3 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgb(var(--brand) / 0.45), transparent 65%)', animation: 'pulseRing 1.6s ease-out infinite' }}
                />
              )}
              <span
                className={`relative block h-2 w-2 rounded-full transition-all ${isActive ? 'bg-brand ring-2 ring-brand/40' : 'bg-brand/60'}`}
              />
            </span>
          );
        })}
      </div>

      {/* Active ping detail */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <Icon.bolt width={14} height={14} className="text-brand shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-ink">{current.name}</span>{' '}
          <span className="text-muted">just ordered from {current.city}</span>{' '}
          <span className="text-muted">·</span>{' '}
          <span className="font-mono font-bold gradient-text">${current.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

interface City { name: string; country: string; lat: number; lon: number }

const CITIES: City[] = [
  { name: 'Karachi',    country: 'Pakistan',  lat:  24.86, lon:  67.00 },
  { name: 'Singapore',  country: 'Singapore', lat:   1.35, lon: 103.81 },
  { name: 'Berlin',     country: 'Germany',   lat:  52.52, lon:  13.40 },
  { name: 'São Paulo',  country: 'Brazil',    lat: -23.55, lon: -46.63 },
  { name: 'Toronto',    country: 'Canada',    lat:  43.65, lon: -79.38 },
  { name: 'Dubai',      country: 'UAE',       lat:  25.20, lon:  55.27 },
  { name: 'Tokyo',      country: 'Japan',     lat:  35.68, lon: 139.69 },
  { name: 'Bangalore',  country: 'India',     lat:  12.97, lon:  77.59 },
  { name: 'Melbourne',  country: 'Australia', lat: -37.81, lon: 144.96 },
  { name: 'Lagos',      country: 'Nigeria',   lat:   6.45, lon:   3.40 },
  { name: 'Mexico City',country: 'Mexico',    lat:  19.43, lon: -99.13 },
  { name: 'New York',   country: 'USA',       lat:  40.71, lon: -74.00 },
  { name: 'Seoul',      country: 'Korea',     lat:  37.57, lon: 126.98 },
  { name: 'Cairo',      country: 'Egypt',     lat:  30.04, lon:  31.24 },
  { name: 'Madrid',     country: 'Spain',     lat:  40.42, lon:  -3.70 }
];

/** Deterministic city pick — by order id hash so each order keeps its spot. */
function pickCity(o: Order): City {
  if (o.shipping?.country) {
    const match = CITIES.find(c => c.country.toLowerCase() === o.shipping!.country.toLowerCase());
    if (match) return match;
  }
  let h = 0;
  for (let i = 0; i < o.id.length; i++) h = (h * 31 + o.id.charCodeAt(i)) >>> 0;
  return CITIES[h % CITIES.length];
}

/** Simple equirectangular projection — fine for a decorative map. */
function projectMercator(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 50
  };
}

/** Hand-picked dots sampling continental outlines. Lat/lon mapped via
 *  the same projection so dots and pings land on the same canvas. */
const CONTINENT_DOTS: [number, number][] = (() => {
  const raw: [number, number][] = [
    // North America
    [60, -150], [55, -130], [50, -115], [45, -100], [40, -90], [38, -76], [32, -98], [25, -80],
    [20, -100], [55, -100], [48, -68],
    // South America
    [-5, -75], [-15, -65], [-25, -55], [-35, -65], [-45, -70], [0, -50], [-10, -45], [-20, -45],
    // Europe
    [50, 0], [55, 10], [60, 20], [50, 30], [45, 15], [42, 0], [48, -4], [52, 4], [50, 25], [40, 12],
    // Africa
    [30, 0], [25, 15], [15, 30], [5, 20], [-5, 25], [-20, 20], [-30, 25], [10, -10], [0, 35], [-25, 30],
    // Asia
    [50, 60], [55, 80], [55, 100], [50, 110], [45, 85], [35, 110], [30, 80], [25, 95], [22, 113], [25, 55],
    [40, 50], [35, 130], [22, 78], [15, 105], [5, 115], [10, 125],
    // Australia
    [-22, 135], [-30, 130], [-30, 150], [-35, 145], [-18, 145]
  ];
  return raw.map(([lat, lon]) => {
    const p = projectMercator(lat, lon);
    return [p.x, p.y] as [number, number];
  });
})();
