'use client';

interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

/**
 * Branded loading spinner — a lightning bolt that pulses softly with a
 * brand-gradient ring orbiting it. Honours reduced-motion (renders a
 * static silhouette).
 */
export function Spinner({ size = 40, label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex flex-col items-center gap-2 ${className}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Orbiting brand ring */}
        <svg
          viewBox="0 0 60 60"
          width={size}
          height={size}
          className="absolute inset-0 animate-[spin_1.6s_linear_infinite] motion-reduce:hidden"
        >
          <defs>
            <linearGradient id="spinner-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(var(--brand))" />
              <stop offset="100%" stopColor="rgb(var(--brand2))" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="24" fill="none" stroke="rgb(var(--line))" strokeWidth="4" />
          <circle
            cx="30" cy="30" r="24"
            fill="none" stroke="url(#spinner-grad)" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="40 110"
          />
        </svg>
        {/* Bolt — pulses gently */}
        <svg
          viewBox="0 0 24 24"
          width={size * 0.5}
          height={size * 0.5}
          className="absolute inset-0 m-auto text-brand motion-safe:animate-pulse"
          fill="currentColor"
          aria-hidden
        >
          <path d="M13 2L4.5 13.5h6L11 22l8.5-11.5h-6L13 2z" />
        </svg>
      </div>
      {label && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
}

/** Full-screen variant used by Suspense fallbacks. */
export function PageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="min-h-[40vh] grid place-items-center">
      <Spinner size={56} label={label} />
    </div>
  );
}
