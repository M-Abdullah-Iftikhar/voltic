import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:        'rgb(var(--bg) / <alpha-value>)',
        surface:   'rgb(var(--surface) / <alpha-value>)',
        elev:      'rgb(var(--elev) / <alpha-value>)',
        ink:       'rgb(var(--ink) / <alpha-value>)',
        muted:     'rgb(var(--muted) / <alpha-value>)',
        line:      'rgb(var(--line) / <alpha-value>)',
        brand:     'rgb(var(--brand) / <alpha-value>)',
        brand2:    'rgb(var(--brand2) / <alpha-value>)',
        accent:    'rgb(var(--accent) / <alpha-value>)',
        accent2:   'rgb(var(--accent2) / <alpha-value>)',
        success:   'rgb(var(--success) / <alpha-value>)',
        danger:    'rgb(var(--danger) / <alpha-value>)',
        warn:      'rgb(var(--warn) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', '"Geist"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        glow: '0 0 40px -10px rgb(var(--brand) / 0.6)',
        soft: '0 6px 30px -10px rgb(0 0 0 / 0.25)',
        card: '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 10px 40px -20px rgb(0 0 0 / 0.45)'
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 20% 10%, rgb(var(--brand) / .25), transparent 40%), radial-gradient(at 80% 20%, rgb(var(--brand2) / .25), transparent 40%), radial-gradient(at 50% 80%, rgb(var(--accent) / .18), transparent 50%)',
        'grid': 'linear-gradient(rgb(var(--line) / 0.4) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line) / 0.4) 1px, transparent 1px)'
      },
      keyframes: {
        floaty: { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' } },
        shine:  { '0%':{ backgroundPosition:'-200% 0' }, '100%':{ backgroundPosition:'200% 0' } },
        slidein:{ '0%':{ opacity:'0', transform:'translateY(12px)' }, '100%':{ opacity:'1', transform:'translateY(0)' } },
        fadein: { '0%':{ opacity:'0' }, '100%':{ opacity:'1' } },
        pulseRing: { '0%':{ transform:'scale(.85)', opacity:'.6' }, '100%':{ transform:'scale(1.6)', opacity:'0' } },
        marqueeLeft: { '0%':{ transform:'translateX(0)' }, '100%':{ transform:'translateX(-50%)' } }
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shine:  'shine 3s linear infinite',
        slidein:'slidein .5s ease-out both',
        fadein: 'fadein .6s ease-out both',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
        marqueeLeft: 'marqueeLeft 40s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
