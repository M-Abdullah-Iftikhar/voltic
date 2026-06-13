import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const stroke = (p: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p
});

const Bolt      = (p: IconProps) => (<svg {...stroke(p)}><path d="M13 2L4.5 13.5h6L11 22l8.5-11.5h-6L13 2z" /></svg>);
const Cable     = (p: IconProps) => (<svg {...stroke(p)}><path d="M4 7h4v3H4zM4 14h4v3H4zM8 8.5h4M8 15.5h4M12 5v15M16 7h4v10h-4zM18 17v3"/></svg>);
const Battery   = (p: IconProps) => (<svg {...stroke(p)}><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2M6 11l3-2-1 3h2l-3 4 1-3H6z"/></svg>);
const Wireless  = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="14" r="6"/><path d="M5 9a10 10 0 0114 0M8 12a6 6 0 018 0"/></svg>);
const Plug      = (p: IconProps) => (<svg {...stroke(p)}><path d="M9 2v4M15 2v4M7 8h10v4a5 5 0 01-5 5 5 5 0 01-5-5V8zM12 17v5"/></svg>);
const Car       = (p: IconProps) => (<svg {...stroke(p)}><path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v3h3v-3M19 16v3h-3v-3"/><circle cx="8" cy="16" r="1.2"/><circle cx="16" cy="16" r="1.2"/></svg>);
const Earbud    = (p: IconProps) => (<svg {...stroke(p)}><path d="M8 4a3 3 0 013 3v3a3 3 0 11-6 0V8M8 13v7M16 4a3 3 0 00-3 3v3a3 3 0 106 0V8M16 13v7"/></svg>);
const Headset   = (p: IconProps) => (<svg {...stroke(p)}><path d="M4 14v-2a8 8 0 1116 0v2M4 14h3v6H4zM17 14h3v6h-3z"/></svg>);
const Speaker   = (p: IconProps) => (<svg {...stroke(p)}><rect x="6" y="2" width="12" height="20" rx="3"/><circle cx="12" cy="9" r="2"/><circle cx="12" cy="15" r="3"/></svg>);
const Shield    = (p: IconProps) => (<svg {...stroke(p)}><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const Case      = (p: IconProps) => (<svg {...stroke(p)}><rect x="6" y="2" width="12" height="20" rx="3"/><circle cx="9" cy="6" r="1.2"/><rect x="11" y="5" width="4" height="3" rx="0.5"/></svg>);
const Camlens   = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/></svg>);
const RingLight = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="10" r="6"/><circle cx="12" cy="10" r="3"/><path d="M12 16v6M8 22h8"/></svg>);
const Tripod    = (p: IconProps) => (<svg {...stroke(p)}><rect x="8" y="3" width="8" height="6" rx="1"/><path d="M12 9v6M12 15l-5 6M12 15l5 6"/></svg>);
const Gimbal    = (p: IconProps) => (<svg {...stroke(p)}><rect x="9" y="3" width="6" height="9" rx="1"/><path d="M12 12v3M8 15h8M10 15v6M14 15v6"/></svg>);
const Chip      = (p: IconProps) => (<svg {...stroke(p)}><rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/><rect x="10" y="10" width="4" height="4"/></svg>);
const Stand     = (p: IconProps) => (<svg {...stroke(p)}><rect x="6" y="3" width="12" height="14" rx="2"/><path d="M5 17l4 4M19 17l-4 4M9 21h6"/></svg>);

const Cart      = (p: IconProps) => (<svg {...stroke(p)}><path d="M3 4h2l2.5 12h11L21 7H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>);
const Search    = (p: IconProps) => (<svg {...stroke(p)}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>);
const User      = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>);
const Menu      = (p: IconProps) => (<svg {...stroke(p)} strokeWidth={1.8}><path d="M4 7h16M4 12h16M4 17h16"/></svg>);
const Close     = (p: IconProps) => (<svg {...stroke(p)} strokeWidth={1.8}><path d="M6 6l12 12M18 6l-12 12"/></svg>);
const Sun       = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/></svg>);
const Moon      = (p: IconProps) => (<svg {...stroke(p)}><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></svg>);
const Star      = (p: IconProps) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l3 7 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.8l1.8-7.3L1.5 9.6 9 9z"/></svg>);
const Arrow     = (p: IconProps) => (<svg {...stroke(p)} strokeWidth={1.8}><path d="M5 12h14M13 6l6 6-6 6"/></svg>);
const Check     = (p: IconProps) => (<svg {...stroke(p)} strokeWidth={2}><path d="M4 12l5 5L20 6"/></svg>);
const Plus      = (p: IconProps) => (<svg {...stroke(p)} strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>);
const Minus     = (p: IconProps) => (<svg {...stroke(p)} strokeWidth={2}><path d="M5 12h14"/></svg>);
const Trash     = (p: IconProps) => (<svg {...stroke(p)}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>);
const Edit      = (p: IconProps) => (<svg {...stroke(p)}><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>);
const Truck     = (p: IconProps) => (<svg {...stroke(p)}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>);
const Refresh   = (p: IconProps) => (<svg {...stroke(p)}><path d="M21 12a9 9 0 11-3.5-7.1M21 4v5h-5"/></svg>);
const Spark     = (p: IconProps) => (<svg {...stroke(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>);
const Globe     = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>);
const Dashboard = (p: IconProps) => (<svg {...stroke(p)}><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>);
const Box       = (p: IconProps) => (<svg {...stroke(p)}><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4M21 7v10l-9 4"/></svg>);
const List      = (p: IconProps) => (<svg {...stroke(p)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>);
const Users     = (p: IconProps) => (<svg {...stroke(p)}><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><circle cx="17" cy="9" r="3"/><path d="M16 14c3.5 0 6 2.5 6 6"/></svg>);
const Tag       = (p: IconProps) => (<svg {...stroke(p)}><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>);
const Cog       = (p: IconProps) => (<svg {...stroke(p)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8L4.2 7a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>);
const Trending  = (p: IconProps) => (<svg {...stroke(p)}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>);
const Logout    = (p: IconProps) => (<svg {...stroke(p)}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>);
const Heart     = (p: IconProps) => (<svg {...stroke(p)}><path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/></svg>);

export const Icon = {
  bolt: Bolt, cable: Cable, battery: Battery, wireless: Wireless, plug: Plug, car: Car,
  earbud: Earbud, headset: Headset, speaker: Speaker, shield: Shield, case: Case,
  camlens: Camlens, ringlight: RingLight, tripod: Tripod, gimbal: Gimbal, chip: Chip,
  stand: Stand, cart: Cart, search: Search, user: User, menu: Menu, close: Close,
  sun: Sun, moon: Moon, star: Star, arrow: Arrow, check: Check, plus: Plus, minus: Minus,
  trash: Trash, edit: Edit, truck: Truck, refresh: Refresh, spark: Spark, globe: Globe,
  dashboard: Dashboard, box: Box, list: List, users: Users, tag: Tag, cog: Cog,
  trending: Trending, logout: Logout, heart: Heart
};

export type IconKey = keyof typeof Icon;
