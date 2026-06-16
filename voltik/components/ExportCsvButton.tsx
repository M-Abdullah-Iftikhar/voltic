'use client';
import { Icon } from './Icons';

interface Column<T> {
  /** Column header — appears verbatim in the CSV header row. */
  label: string;
  /** Pull a cell value out of a row. Return `null`/`undefined` for blank cells. */
  get: (row: T) => string | number | boolean | null | undefined;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  /** Filename (sans extension). A date suffix is appended automatically. */
  filename: string;
  /** Button label override — defaults to "Export CSV". */
  label?: string;
  className?: string;
}

/**
 * Tiny client-side CSV export. We build the file in the browser instead
 * of a server route because the admin tables already have the row data
 * loaded — round-tripping through Mongo just to download what we're
 * already rendering is wasted work.
 *
 * Excel's CSV parser is unforgiving about quotes/newlines, so each cell
 * is double-quoted and embedded `"` are doubled per RFC 4180.
 */
export function ExportCsvButton<T>({ rows, columns, filename, label = 'Export CSV', className }: Props<T>) {
  const onClick = () => {
    if (rows.length === 0) return;
    const header = columns.map(c => csvCell(c.label)).join(',');
    const body = rows.map(r => columns.map(c => csvCell(c.get(r))).join(',')).join('\r\n');
    // BOM so Excel opens UTF-8 correctly without prompting for encoding.
    const blob = new Blob(['﻿', header, '\r\n', body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${filename}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={rows.length === 0}
      className={`btn-ghost text-xs disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      title={rows.length === 0 ? 'Nothing to export' : `Export ${rows.length} rows`}
    >
      <Icon.arrow width={12} height={12} className="rotate-90" />
      {label}
      <span className="text-muted text-[10px] font-mono">{rows.length}</span>
    </button>
  );
}

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}
