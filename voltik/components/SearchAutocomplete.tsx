'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon, type IconKey } from './Icons';
import { ProductIllustration } from './ProductIllustration';

type ProductHit = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  icon: string;
  price: number;
  stock: number;
};
type CategoryHit = { id: string; name: string; icon: string };

/**
 * Type-ahead search dropdown — debounced fetch against /api/search,
 * Enter submits to /shop?q=, Esc closes, arrow keys move the highlight,
 * tapping a result navigates straight to it.
 */
// Web Speech API surface — Chromium-only and unprefixed on a few. Typed
// loosely so we don't need to ship a SpeechRecognition lib.dom shim.
type SRConstructor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend:   (() => void) | null;
  start(): void;
  stop(): void;
}

export function SearchAutocomplete() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [categories, setCategories] = useState<CategoryHit[]>([]);
  const [hi, setHi] = useState(0);   // highlighted result index in flat list
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqIdRef = useRef(0);

  // Debounced fetch — 180ms.
  useEffect(() => {
    if (q.trim().length < 2) {
      setProducts([]); setCategories([]); return;
    }
    setLoading(true);
    const id = ++reqIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        if (id !== reqIdRef.current) return;   // a newer query landed first
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setHi(0);
      } finally {
        if (id === reqIdRef.current) setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  // Click-outside to close.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Web Speech: feature-detect on mount so the mic button only shows
  // when the browser can actually back it.
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    if (w.SpeechRecognition || w.webkitSpeechRecognition) setVoiceSupported(true);
  }, []);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      // Pull the latest transcript fragment — interim or final.
      const results = event.results;
      const last = results[results.length - 1];
      if (last) {
        const transcript = (last[0]?.transcript || '').trim();
        if (transcript) {
          setQ(transcript);
          setOpen(true);
        }
        // Submit on a final result that ends the utterance.
        if (last.isFinal && transcript) {
          setTimeout(() => {
            // If suggestions exist, navigate to the first one; otherwise
            // forward to /shop?q= so the user lands somewhere useful.
            inputRef.current?.focus();
          }, 100);
        }
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => { setListening(false); recognitionRef.current = null; };

    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const flat = [
    ...products.map(p   => ({ kind: 'product' as const, p })),
    ...categories.map(c => ({ kind: 'category' as const, c }))
  ];
  const empty = q.trim().length >= 2 && !loading && flat.length === 0;

  const go = (idx: number) => {
    const hit = flat[idx];
    if (!hit) return;
    if (hit.kind === 'product')  router.push(`/product/${hit.p.slug || hit.p.id}`);
    else                          router.push(`/shop?category=${encodeURIComponent(hit.c.id)}`);
    setOpen(false); setQ(''); inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHi(i => Math.max(0, i - 1)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flat.length > 0) go(hi);
      else if (q.trim())   { router.push(`/shop?q=${encodeURIComponent(q.trim())}`); setOpen(false); }
    }
  };

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 w-64 focus-within:border-brand/60 transition">
        <Icon.search width={16} height={16} className="text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search accessories…"
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted"
          aria-autocomplete="list"
          aria-controls="voltik-search-pop"
          aria-expanded={open}
          suppressHydrationWarning
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }} className="text-muted hover:text-ink" aria-label="Clear">
            <Icon.close width={12} height={12} />
          </button>
        )}
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={listening ? 'Stop voice search' : 'Start voice search'}
            aria-pressed={listening}
            title="Voice search"
            className={`grid place-items-center h-6 w-6 rounded-full transition ${
              listening
                ? 'bg-danger text-white animate-pulse'
                : 'text-muted hover:text-brand'
            }`}
          >
            <MicIcon active={listening} />
          </button>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div
          id="voltik-search-pop"
          role="listbox"
          className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 card p-1.5 max-h-[420px] overflow-y-auto animate-slidein"
        >
          {loading && <div className="px-3 py-4 text-xs text-muted">Searching…</div>}

          {!loading && products.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted font-semibold">Products</div>
              {products.map((p, i) => {
                const idx = i;
                const active = idx === hi;
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug || p.id}`}
                    onMouseEnter={() => setHi(idx)}
                    onClick={() => { setOpen(false); setQ(''); }}
                    role="option"
                    aria-selected={active}
                    className={`flex items-center gap-3 rounded-xl px-2 py-2 transition ${active ? 'bg-elev' : 'hover:bg-elev/60'}`}
                  >
                    <ProductIllustration category={p.category} icon={p.icon} className="h-10 w-10 rounded-lg shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink line-clamp-1">{p.name}</div>
                      <div className="text-[11px] text-muted">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div>
                    </div>
                    <span className="text-sm font-bold gradient-text">${p.price.toFixed(2)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && categories.length > 0 && (
            <div className="mt-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted font-semibold">Categories</div>
              {categories.map((c, i) => {
                const idx = products.length + i;
                const active = idx === hi;
                const Glyph = (Icon as Record<string, React.FC<{ width?: number; height?: number; className?: string }>>)[c.icon as IconKey] || Icon.tag;
                return (
                  <Link
                    key={c.id}
                    href={`/shop?category=${encodeURIComponent(c.id)}`}
                    onMouseEnter={() => setHi(idx)}
                    onClick={() => { setOpen(false); setQ(''); }}
                    role="option"
                    aria-selected={active}
                    className={`flex items-center gap-3 rounded-xl px-2 py-2 transition ${active ? 'bg-elev' : 'hover:bg-elev/60'}`}
                  >
                    <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand/10 text-brand">
                      <Glyph width={16} height={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink">{c.name}</div>
                      <div className="text-[11px] text-muted">Browse all in {c.name}</div>
                    </div>
                    <Icon.arrow width={12} height={12} className="text-muted" />
                  </Link>
                );
              })}
            </div>
          )}

          {empty && (
            <div className="px-3 py-6 text-center text-sm text-muted">
              No matches for <span className="font-mono text-ink">{q}</span>.
              <div className="mt-2">
                <Link href={`/shop?q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)} className="text-brand text-xs hover:underline">
                  Search the whole catalog →
                </Link>
              </div>
            </div>
          )}

          {!empty && !loading && flat.length > 0 && (
            <div className="border-t border-line/60 mt-1 pt-1.5 px-3 pb-1 text-[10px] text-muted flex items-center justify-between">
              <span>↑↓ navigate · ↵ open · esc close</span>
              <Link href={`/shop?q=${encodeURIComponent(q.trim())}`} onClick={() => setOpen(false)} className="text-brand hover:underline">
                See all results
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Tiny inline mic glyph — keeps the navbar bundle from importing more icons. */
function MicIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={active ? 'currentColor' : 'none'} />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8"  y1="22" x2="16" y2="22" />
    </svg>
  );
}
