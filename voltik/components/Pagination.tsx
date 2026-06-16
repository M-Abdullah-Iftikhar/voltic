'use client';
import { Icon } from './Icons';

interface PaginationProps {
  total: number;
  pageSize: number;
  page: number;        // 1-indexed
  onPage: (next: number) => void;
  onPageSize?: (next: number) => void;
  pageSizes?: number[];
}

/**
 * Footer pagination: showing 1-10 of 247  ·  ‹ 1 2 … 9 ›  ·  per-page selector.
 * Hides itself when there's nothing to paginate.
 */
export function Pagination({
  total, pageSize, page, onPage, onPageSize, pageSizes = [10, 25, 50]
}: PaginationProps) {
  if (total <= pageSize && pageSizes.length === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(total, page * pageSize);
  const nums = compactPages(page, pages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-line text-xs text-muted">
      <span>
        Showing <span className="font-semibold text-ink">{from}-{to}</span> of <span className="font-semibold text-ink">{total}</span>
      </span>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="grid place-items-center h-8 w-8 rounded-lg border border-line hover:bg-elev disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon.arrow width={12} height={12} className="rotate-180" />
          </button>
          {nums.map((n, i) =>
            n === '…' ? (
              <span key={`g${i}`} className="px-1 text-muted">…</span>
            ) : (
              <button
                key={n}
                onClick={() => onPage(n)}
                aria-current={n === page ? 'page' : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition ${n === page ? 'bg-brand text-white' : 'border border-line text-muted hover:text-ink hover:bg-elev'}`}
              >
                {n}
              </button>
            )
          )}
          <button
            onClick={() => onPage(Math.min(pages, page + 1))}
            disabled={page === pages}
            aria-label="Next page"
            className="grid place-items-center h-8 w-8 rounded-lg border border-line hover:bg-elev disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon.arrow width={12} height={12} />
          </button>
        </nav>
      )}

      {onPageSize && (
        <label className="flex items-center gap-2">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={e => onPageSize(Number(e.target.value))}
            className="rounded-full border border-line bg-bg px-2 py-1 text-xs"
          >
            {pageSizes.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

/** Compress a list of pages to "1 2 3 … 9" style for any size. */
function compactPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push('…');
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push('…');
  out.push(total);
  return out;
}
