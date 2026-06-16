/**
 * Brand pattern — subtle repeating-bolt SVG used as a section divider.
 * Pure CSS-defined background; renders as a thin horizontal stripe that
 * fades to transparent at both ends.
 */

const SVG = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='42' height='24' viewBox='0 0 42 24'>
  <g fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'>
    <path d='M9 4 L4 13 H8 L7 20 L13 11 H9 L10 4 Z'/>
    <path d='M30 4 L25 13 H29 L28 20 L34 11 H30 L31 4 Z'/>
  </g>
  <circle cx='21' cy='12' r='1.5' fill='currentColor' opacity='0.3'/>
</svg>
`).replace(/%0A/g, '').trim();

export function BrandPattern({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative h-12 my-2 text-muted ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${SVG}")`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '42px 24px',
        backgroundPosition: 'center',
        maskImage:        'linear-gradient(to right, transparent, black 25%, black 75%, transparent)',
        WebkitMaskImage:  'linear-gradient(to right, transparent, black 25%, black 75%, transparent)'
      }}
    />
  );
}
