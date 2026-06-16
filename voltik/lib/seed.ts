import { uniqueSlug } from './slug';
import type { Admin, Category, Customer, Order, Product, PromoCode, Review, Subscriber, User } from './types';

/* ============================================================
   CATEGORIES — root + sub + sub-sub examples
   ============================================================ */
export const SEED_CATEGORIES: Category[] = [
  // Roots
  { id: 'charging', parent: null, name: 'Charging',        icon: 'bolt',    blurb: 'Cables, chargers & power banks',  gradient: 'linear-gradient(135deg,#00d4ff,#7c3aed)' },
  { id: 'audio',    parent: null, name: 'Audio',           icon: 'headset', blurb: 'Earbuds, headsets & speakers',    gradient: 'linear-gradient(135deg,#ff6b6b,#ee0979)' },
  { id: 'screens',  parent: null, name: 'Screen Guards',   icon: 'shield',  blurb: 'Tempered glass & hydrogel',       gradient: 'linear-gradient(135deg,#11998e,#38ef7d)' },
  { id: 'cases',    parent: null, name: 'Cases & Covers',  icon: 'case',    blurb: 'Silicone, magnetic & rugged',     gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { id: 'camera',   parent: null, name: 'Photography',     icon: 'camlens', blurb: 'Lenses, tripods & ring lights',   gradient: 'linear-gradient(135deg,#ffd86f,#fc6262)' },
  { id: 'storage',  parent: null, name: 'Storage',         icon: 'chip',    blurb: 'USB drives, microSD & OTG',       gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { id: 'connect',  parent: null, name: 'Connectivity',    icon: 'plug',    blurb: 'OTG, hubs & card readers',        gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { id: 'mounts',   parent: null, name: 'Mounts & Stands', icon: 'stand',   blurb: 'Car mounts, stands & grips',      gradient: 'linear-gradient(135deg,#fa709a,#fee140)' },

  // Subcategories
  { id: 'charging-cables',   parent: 'charging', name: 'Cables',        icon: 'cable',    blurb: 'USB-C, Lightning, micro-USB',  gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { id: 'charging-wireless', parent: 'charging', name: 'Wireless Pads', icon: 'wireless', blurb: 'MagSafe & Qi pads',            gradient: 'linear-gradient(135deg,#00d4ff,#7c3aed)' },
  { id: 'charging-banks',    parent: 'charging', name: 'Power Banks',   icon: 'battery',  blurb: 'Portable batteries',           gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { id: 'charging-adapters', parent: 'charging', name: 'Wall Adapters', icon: 'plug',     blurb: 'PD, QC, GaN wall chargers',    gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { id: 'charging-car',      parent: 'charging', name: 'Car Chargers',  icon: 'car',      blurb: 'In-car PD & QC adapters',      gradient: 'linear-gradient(135deg,#fa709a,#fee140)' },

  // 3rd level
  { id: 'cables-usbc',      parent: 'charging-cables', name: 'USB-C Cables',     icon: 'cable', blurb: 'USB-C to USB-C / A',     gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { id: 'cables-lightning', parent: 'charging-cables', name: 'Lightning Cables', icon: 'cable', blurb: 'MFi-certified Lightning', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)' },

  // Audio sub-tree
  { id: 'audio-earbuds',  parent: 'audio', name: 'Earbuds',  icon: 'earbud',  blurb: 'TWS & wired in-ears',  gradient: 'linear-gradient(135deg,#ff6b6b,#ee0979)' },
  { id: 'audio-headsets', parent: 'audio', name: 'Headsets', icon: 'headset', blurb: 'Over-ear & business',  gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { id: 'audio-speakers', parent: 'audio', name: 'Speakers', icon: 'speaker', blurb: 'BT portable speakers', gradient: 'linear-gradient(135deg,#ffd86f,#fc6262)' },

  // Photography sub-tree
  { id: 'camera-lenses', parent: 'camera', name: 'Lenses',        icon: 'camlens',   blurb: 'Clip-on optics',        gradient: 'linear-gradient(135deg,#ffd86f,#fc6262)' },
  { id: 'camera-rigs',   parent: 'camera', name: 'Rigs & Lights', icon: 'ringlight', blurb: 'Ring lights, gimbals',  gradient: 'linear-gradient(135deg,#fa709a,#fee140)' }
];

/* ============================================================
   PRODUCTS — rating / review counts are NOT stored.
   They are computed from the reviews table at display time.
   ============================================================ */
export const SEED_PRODUCTS: Product[] = [
  // CHARGING
  { id:'v-001', name:'TurboFlow 65W USB-C Cable', category:'charging', price:19.99, oldPrice:29.99, stock:152, badge:'Bestseller', icon:'cable', brand:'Voltik', sku:'VLT-CBL-65W',
    description:'Braided nylon 65W PD fast-charge cable engineered for the latest USB-C devices. 1.5m length, 20,000-bend lifespan, e-marker chip for true 65W power delivery.',
    features:['65W Power Delivery','480 Mbps data transfer','Braided nylon weave','20,000 bend tested','MFi & USB-IF certified'] },
  { id:'v-002', name:'PowerCore 20000 mAh Slim', category:'charging', price:49.00, oldPrice:69.00, stock:84, badge:'Hot Deal', icon:'battery', brand:'Voltik', sku:'VLT-PWR-20K',
    description:'Slimmest 20,000 mAh power bank in its class. Dual USB-C in/out with 30W PD. Charges an iPhone 15 over 4 times. Carry-on safe.',
    features:['20,000 mAh capacity','30W USB-C PD','Dual input (USB-C / Lightning)','LED status display','Pass-through charging'] },
  { id:'v-003', name:'StackPad Wireless 3-in-1', category:'charging', price:79.99, oldPrice:99.99, stock:47, badge:'New', icon:'wireless', brand:'Voltik', sku:'VLT-WLS-3IN1',
    description:'Charge phone, watch and earbuds on a single foldable pad. MagSafe-compatible 15W zone, 5W watch puck, 5W earbud well.',
    features:['MagSafe-compatible 15W','Foldable travel design','Vegan leather finish','Anti-slip base','Built-in over-temp guard'] },
  { id:'v-004', name:'GaN Cube 100W Charger', category:'charging', price:59.00, stock:213, icon:'plug', brand:'Voltik', sku:'VLT-GAN-100',
    description:'100W GaN III tech in a cube the size of a sugar lump. Powers a 16-inch laptop and two phones simultaneously across 3 USB-C and 1 USB-A.',
    features:['100W total output','GaN III tech','Foldable prongs','3× USB-C + 1× USB-A','Worldwide voltage 100-240V'] },
  { id:'v-005', name:'Lightning 1m Braided', category:'charging', price:14.99, oldPrice:19.99, stock:1024, icon:'cable', brand:'Voltik', sku:'VLT-LTG-1M',
    description:'MFi-certified Lightning cable with double-braided shielding and an aluminum housing. Works with every iPhone since the 5.',
    features:['Apple MFi certified','Aluminum tip housing','1.0m double-braided','Lifetime warranty'] },
  { id:'v-006', name:'CarBolt 45W Dual Adapter', category:'charging', price:24.50, stock:312, icon:'car', brand:'Voltik', sku:'VLT-CAR-45',
    description:'In-car 45W PD + QC charger that fast-charges two phones at once. Recessed LED ring for low-glare night driving.',
    features:['45W total in-car','PD + QuickCharge 4.0','Soft amber LED ring','12-24V truck-safe'] },

  // AUDIO
  { id:'v-101', name:'Volt Buds Pro 2', category:'audio', price:129.00, oldPrice:159.00, stock:96, badge:'Bestseller', icon:'earbud', brand:'Voltik', sku:'VLT-AUD-BP2',
    description:'Active noise-cancelling earbuds with adaptive transparency, 11mm bio-cellulose drivers and 32-hour case life.',
    features:['Adaptive ANC -35dB','Spatial audio with head tracking','11mm bio-cellulose driver','IPX5 sweat resistant','32 hr w/ charging case'] },
  { id:'v-102', name:'SoundWave BT Headset', category:'audio', price:39.99, stock:240, icon:'headset', brand:'Voltik', sku:'VLT-AUD-BT1',
    description:'Single-ear Bluetooth 5.3 business headset. 24-hour talk time, dual-mic ENC for crystal-clear calls.',
    features:['Bluetooth 5.3','Dual-mic ENC','24 hr talk time','Multi-point pairing','Magnetic charging dock'] },
  { id:'v-103', name:'BoomBar Mini Speaker', category:'audio', price:34.99, oldPrice:49.99, stock:178, badge:'Hot Deal', icon:'speaker', brand:'Voltik', sku:'VLT-AUD-BB1',
    description:'Pocket-size 360° Bluetooth speaker. IP67 waterproof, 16-hour playtime, stereo pair with a second BoomBar.',
    features:['360° sound','IP67 waterproof','16 hr playtime','Stereo pairing','Built-in carabiner'] },
  { id:'v-104', name:'GameLink Wired In-Ear', category:'audio', price:12.99, stock:540, icon:'earbud', brand:'Voltik', sku:'VLT-AUD-WD1',
    description:'Hi-Fi 3.5mm earphones tuned for gaming. In-line mic with mute switch, kevlar-reinforced cable.',
    features:['10mm dynamic driver','In-line mic + mute','Kevlar cable','3.5mm gold-plated'] },
  { id:'v-105', name:'Studio Cans Wireless', category:'audio', price:89.00, oldPrice:119.00, stock:62, icon:'headset', brand:'Voltik', sku:'VLT-AUD-SC1',
    description:'Over-ear wireless headphones with hybrid ANC and 60-hour playtime. Foldable for travel.',
    features:['Hybrid ANC','60 hr playtime','40mm Hi-Res drivers','Foldable design','USB-C fast charge'] },

  // SCREENS
  { id:'v-201', name:'GlassShield Diamond 9H', category:'screens', price:9.99, oldPrice:14.99, stock:823, badge:'Bestseller', icon:'shield', brand:'Voltik', sku:'VLT-SCR-D9H',
    description:'0.33mm diamond-coated tempered glass with oleophobic finish. Bubble-free install kit included.',
    features:['9H surface hardness','Oleophobic coating','0.33mm thin','Install kit included','Pack of 2'] },
  { id:'v-202', name:'Privacy Anti-Spy Glass', category:'screens', price:14.99, stock:412, icon:'shield', brand:'Voltik', sku:'VLT-SCR-PRV',
    description:'Side-view blocking privacy glass — keeps your screen invisible beyond 30°. Ideal for travel and commuting.',
    features:['30° privacy filter','9H hardness','Touch-sensitive','Bubble-free install'] },
  { id:'v-203', name:'Hydrogel Edge-to-Edge', category:'screens', price:11.99, stock:687, icon:'shield', brand:'Voltik', sku:'VLT-SCR-HDG',
    description:'Self-healing hydrogel film for curved displays. Conforms to every edge with zero bubbles or whitening.',
    features:['Self-healing surface','Full edge coverage','3-pack film','Wet-install method'] },
  { id:'v-204', name:'CamGuard Lens Protector', category:'screens', price:7.99, stock:921, icon:'camlens', brand:'Voltik', sku:'VLT-SCR-CAM',
    description:'Individual tempered glass rings for each rear camera lens. Preserves Night Mode quality.',
    features:['Per-lens rings','Light-pass optimised','Anti-scratch 9H','Pack of 6 rings'] },

  // CASES
  { id:'v-301', name:'AeroMag Magnetic Case', category:'cases', price:29.99, oldPrice:39.99, stock:341, badge:'New', icon:'case', brand:'Voltik', sku:'VLT-CSE-MAG',
    description:'Featherweight 32g shock-resistant case with built-in N52 magnet ring. Works with all MagSafe accessories.',
    features:['MagSafe-compatible','Mil-spec 1.5m drop','Anti-yellow polymer','Raised camera bezel','32g weight'] },
  { id:'v-302', name:'Rugged Armor X Case', category:'cases', price:24.99, stock:218, icon:'case', brand:'Voltik', sku:'VLT-CSE-RGD',
    description:'Dual-layer TPU+PC armor case with reinforced corners. Tested to 3 meters.',
    features:['3m drop tested','Air-cushion corners','Tactile buttons','Anti-slip texture'] },
  { id:'v-303', name:'WalletFold Vegan Leather', category:'cases', price:34.99, oldPrice:44.99, stock:124, icon:'case', brand:'Voltik', sku:'VLT-CSE-WLT',
    description:'Folio-style wallet case with three card slots and an RFID-blocking layer. Built-in landscape stand.',
    features:['Vegan leather','3 card slots + cash','RFID blocking','Magnetic snap','Built-in stand'] },
  { id:'v-304', name:'Crystal Clear Slim', category:'cases', price:14.99, stock:614, icon:'case', brand:'Voltik', sku:'VLT-CSE-CLR',
    description:'Ultra-clear yellow-resistant case. 1.2mm slim profile preserves the original look of your phone.',
    features:['Anti-yellow polymer','1.2mm slim','Wireless charge ready','Lifted screen lip'] },

  // CAMERA
  { id:'v-401', name:'CinePro 4K Lens Kit', category:'camera', price:69.99, oldPrice:89.99, stock:78, badge:'New', icon:'camlens', brand:'Voltik', sku:'VLT-CAM-LK4',
    description:'Three-piece clip-on lens kit: 0.6× wide-angle, 15× macro, and 2× telephoto. Aspheric optical glass.',
    features:['Aspheric optical glass','3 lenses included','Universal clip','Carry pouch'] },
  { id:'v-402', name:'RingLight Halo Pro', category:'camera', price:29.99, stock:265, icon:'ringlight', brand:'Voltik', sku:'VLT-CAM-RLP',
    description:'10-inch tri-color ring light with phone clamp and Bluetooth shutter. 3 color modes, 10 brightness levels.',
    features:['10-inch LED','3 color temperatures','10 brightness steps','Bluetooth shutter','Extending tripod'] },
  { id:'v-403', name:'TriGrip Travel Tripod', category:'camera', price:24.99, stock:184, icon:'tripod', brand:'Voltik', sku:'VLT-CAM-TGT',
    description:'Bluetooth-enabled selfie stick that transforms into a 1.2m travel tripod. Detachable wireless remote.',
    features:['Selfie + tripod combo','Bluetooth shutter','1.2m extension','360° ball head'] },
  { id:'v-404', name:'GimbalMate Stabilizer', category:'camera', price:119.00, oldPrice:149.00, stock:38, badge:'Hot Deal', icon:'gimbal', brand:'Voltik', sku:'VLT-CAM-GMB',
    description:'3-axis foldable smartphone gimbal with face tracking and panorama. 12-hour battery, app-powered.',
    features:['3-axis stabilization','Face/object tracking','12 hr battery','Foldable design','Companion app'] },

  // STORAGE
  { id:'v-501', name:'FlashDrive USB-C 256GB', category:'storage', price:34.99, stock:421, icon:'chip', brand:'Voltik', sku:'VLT-STG-FD256',
    description:'Dual-interface USB-C + USB-A flash drive. 500 MB/s read speeds, all-metal swivel housing.',
    features:['256 GB capacity','500 MB/s read','USB-C + USB-A','Metal swivel design','5-yr warranty'] },
  { id:'v-502', name:'microSD Pro 128GB U3', category:'storage', price:18.99, oldPrice:24.99, stock:1100, badge:'Bestseller', icon:'chip', brand:'Voltik', sku:'VLT-STG-SD128',
    description:'A2-rated microSDXC for 4K video and high-frame action cams. Drop, water and X-ray proof.',
    features:['128 GB U3 A2','170 MB/s read','4K video certified','Waterproof + shockproof'] },
  { id:'v-503', name:'OTG Pocket Drive 64GB', category:'storage', price:19.99, stock:329, icon:'chip', brand:'Voltik', sku:'VLT-STG-OTG64',
    description:'Tiny OTG drive that plugs straight into any USB-C phone. Move 4K video files in seconds.',
    features:['64 GB OTG','USB-C 3.2','Keychain loop','Aluminum body'] },

  // CONNECT
  { id:'v-601', name:'HubLink 7-in-1 USB-C', category:'connect', price:49.00, oldPrice:69.00, stock:142, icon:'plug', brand:'Voltik', sku:'VLT-CON-H7',
    description:'7-port USB-C hub with 4K HDMI, gigabit ethernet, 100W PD passthrough, SD/microSD and USB-A 3.0.',
    features:['4K HDMI output','Gigabit ethernet','100W PD passthrough','SD + microSD','2× USB-A 3.0'] },
  { id:'v-602', name:'OTG Mini Adapter', category:'connect', price:6.99, stock:1800, icon:'plug', brand:'Voltik', sku:'VLT-CON-OTG',
    description:'USB-A to USB-C OTG adapter. Connect keyboards, controllers and pen drives to your phone.',
    features:['USB-A to USB-C','480 Mbps','Plug-and-play','Compact aluminum'] },
  { id:'v-603', name:'CardReader Pro 4-in-1', category:'connect', price:16.99, stock:289, icon:'chip', brand:'Voltik', sku:'VLT-CON-CRD',
    description:'4-in-1 card reader supporting SD, microSD, CF and MS. USB-C + USB-A dual interface.',
    features:['SD/microSD/CF/MS','USB-C + USB-A','Up to 104 MB/s','Pocket-size'] },

  // MOUNTS
  { id:'v-701', name:'DriveMount Magnetic', category:'mounts', price:19.99, oldPrice:27.99, stock:362, badge:'Hot Deal', icon:'car', brand:'Voltik', sku:'VLT-MNT-DRV',
    description:'Vent-clip magnetic car mount with six N52 magnets. Rock-solid grip even on bumpy roads.',
    features:['6× N52 magnets','Vent clip + sticker','360° rotation','MagSafe compatible'] },
  { id:'v-702', name:'DeskHover Aluminum Stand', category:'mounts', price:24.99, stock:241, icon:'stand', brand:'Voltik', sku:'VLT-MNT-DSK',
    description:'Adjustable aluminum desk stand. Holds phones and tablets up to 12.9 inches at any angle.',
    features:['Aluminum CNC body','Adjustable hinge','Anti-slip silicone','Tablet-compatible'] },
  { id:'v-703', name:'GripPop Magnetic Holder', category:'mounts', price:9.99, stock:704, icon:'stand', brand:'Voltik', sku:'VLT-MNT-GRP',
    description:'Magnetic finger-grip and kickstand combo. Snap on and off to keep the back of your phone clean.',
    features:['Magnetic detach','Dual-axis kickstand','Wireless charge friendly','12 designs available'] }
];

/* ============================================================
   SEED USERS — plaintext password gets hashed on first DB seed.
   demo@voltik.com / demo123
   alex@voltik.com / alex1234
   ============================================================ */
export type SeedUser = Omit<User, 'passwordHash'> & { plainPassword: string };

/** Seeded admin account — hashed on first DB write, never plaintext on disk.
 *  Override via the ADMIN_USER / ADMIN_PASS env vars if you want a different
 *  bootstrap. Once seeded, you can change the password from /admin/profile
 *  in a future iteration. */
export type SeedAdmin = Omit<Admin, 'passwordHash'> & { plainPassword: string };

export const SEED_ADMINS: SeedAdmin[] = [
  {
    id: 'a-arizz',
    email: 'arizz@gmail.com',
    name: 'Arizz',
    plainPassword: 'arizz123#',
    createdAt: '2025-12-01'
  }
];

export const SEED_USERS: SeedUser[] = [
  {
    id: 'u-demo',
    email: 'demo@voltik.com',
    name: 'Demo Voltic',
    plainPassword: 'demo123',
    createdAt: '2025-09-12',
    cart: [],
    favorites: ['v-101', 'v-301']
  },
  {
    id: 'u-alex',
    email: 'alex@voltik.com',
    name: 'Alex Wong',
    plainPassword: 'alex1234',
    createdAt: '2025-11-30',
    cart: [],
    favorites: []
  }
];

/* ============================================================
   SEED PROMO CODES — a small starter set; admin can add more.
   ============================================================ */
export const SEED_PROMOS: PromoCode[] = [
  { id:'VOLT10',    code:'VOLT10',    type:'percent',  value:10, minBasket:0,   active:true, usedCount:0, createdAt:'2025-12-01' },
  { id:'WELCOME10', code:'WELCOME10', type:'percent',  value:10, minBasket:0,   active:true, usedCount:0, createdAt:'2025-12-01' },
  { id:'WELCOME15', code:'WELCOME15', type:'percent',  value:15, minBasket:50,  active:true, usedCount:0, createdAt:'2025-12-01' },
  { id:'FREESHIP',  code:'FREESHIP',  type:'shipping', value:0,  minBasket:25,  active:true, usedCount:0, createdAt:'2025-12-01' },
  { id:'5OFF',      code:'5OFF',      type:'flat',     value:5,  minBasket:30,  active:true, usedCount:0, createdAt:'2025-12-01' }
];

/** Subscribers start empty — the newsletter form populates it live. */
export const SEED_SUBSCRIBERS: Subscriber[] = [];

/** Add stable slugs to seed products so URLs work out of the box. */
export function withSeededSlugs(products: Product[]): Product[] {
  const taken = new Set<string>();
  return products.map(p => {
    if (p.slug && !taken.has(p.slug)) {
      taken.add(p.slug);
      return p;
    }
    const s = uniqueSlug(p.name, taken);
    taken.add(s);
    return { ...p, slug: s };
  });
}

/* ============================================================
   SEED REVIEWS — real review records that drive each product's
   rating & review count. Distributed across products with a mix
   of star ratings and authentic-feeling content.
   ============================================================ */
export const SEED_REVIEWS: Review[] = [
  // v-001 TurboFlow 65W
  { id:'r-001', productId:'v-001', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Charges my Pixel at full speed', body:'Finally a cable that delivers the full 65W. My Pixel 8 Pro hits 30W steady — none of the throttling I got from random cables.', createdAt:'2026-04-12' },
  { id:'r-002', productId:'v-001', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Build feels indestructible',           body:'The braided sleeve is super dense, and the connectors fit snugly. Three months in and zero fraying.', createdAt:'2026-05-02' },
  { id:'r-003', productId:'v-001', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'Slightly stiff at first',               body:'Took a week to soften up — but once it does, it lays flat. Solid value.', createdAt:'2026-05-19' },

  // v-002 PowerCore 20K
  { id:'r-010', productId:'v-002', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Genuinely slim for 20K',                body:'Fits in a jeans pocket. Charged my iPhone 15 from 5% to 100% four times before needing a top-up.', createdAt:'2026-03-08' },
  { id:'r-011', productId:'v-002', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Travels through customs fine',           body:'74Wh, well under the 100Wh airline limit. Took it on three flights last quarter, no questions asked.', createdAt:'2026-04-21' },
  { id:'r-012', productId:'v-002', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'LED could be dimmer at night',          body:'Performance is great but the status LED is too bright for hotel rooms. Tape over it solves it.', createdAt:'2026-05-17' },

  // v-003 StackPad
  { id:'r-020', productId:'v-003', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Replaced three chargers on my desk',    body:'iPhone, Apple Watch, and AirPods on one pad. Travel folded form makes hotel nightstands a non-issue.', createdAt:'2026-05-30' },
  { id:'r-021', productId:'v-003', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'Magsafe alignment is on point',         body:'Snaps perfectly every time. Watch puck runs slightly warm but never hot.', createdAt:'2026-06-02' },

  // v-004 GaN Cube
  { id:'r-030', productId:'v-004', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Replaces my MacBook brick',             body:'M2 Pro 16-inch charges full speed. Frees up an entire outlet for travel.', createdAt:'2026-02-14' },
  { id:'r-031', productId:'v-004', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Tiny tiny tiny',                        body:'Smaller than the stock Apple 30W. Insane that this puts out 100W.', createdAt:'2026-03-02' },
  { id:'r-032', productId:'v-004', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Runs cool under load',                  body:'Charged a MacBook + two phones for 45 min — barely warm. GaN III tech is the real deal.', createdAt:'2026-04-08' },

  // v-005 Lightning braided
  { id:'r-040', productId:'v-005', userId:'u-alex', userName:'Alex Wong',   rating:4, title:'Works as advertised',                   body:'No "this cable not certified" warnings on my iPhone 14. Braiding feels solid.', createdAt:'2026-04-29' },
  { id:'r-041', productId:'v-005', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Cheapest reliable Lightning I have',     body:'Better than the Apple cable that came in the box, and at half the price.', createdAt:'2026-05-10' },

  // v-101 Volt Buds Pro 2
  { id:'r-100', productId:'v-101', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'ANC is shockingly good',                body:'Killed the noise of an A320 cabin completely. Adaptive transparency on the train is also excellent.', createdAt:'2026-05-22' },
  { id:'r-101', productId:'v-101', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Spatial audio is actually fun',         body:'Watched a Netflix movie on the iPad and the head-tracking spatial mix was eerie in a good way.', createdAt:'2026-05-28' },
  { id:'r-102', productId:'v-101', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'Case scratches easily',                 body:'Glossy plastic catches micro-scratches fast. Audio quality is unimpeachable though.', createdAt:'2026-06-01' },
  { id:'r-103', productId:'v-101', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Battery survives a workday',            body:'On-and-off use through 8 hours of meetings + a workout = case at 40%. More than enough.', createdAt:'2026-06-10' },

  // v-102 SoundWave Headset
  { id:'r-110', productId:'v-102', userId:'u-alex', userName:'Alex Wong',   rating:4, title:'Call quality is the highlight',        body:'Customers always sound clear. The ENC genuinely cuts cafe noise.', createdAt:'2026-04-02' },

  // v-103 BoomBar speaker
  { id:'r-120', productId:'v-103', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Surprisingly loud for the size',       body:'Filled a hotel room without distortion. Carabiner is a clever touch.', createdAt:'2026-05-05' },
  { id:'r-121', productId:'v-103', userId:'u-alex', userName:'Alex Wong',   rating:4, title:'Pool party tested, pool party approved',body:'Dropped it in the pool. Floated, played, dried. IP67 confirmed.', createdAt:'2026-05-14' },

  // v-105 Studio Cans
  { id:'r-130', productId:'v-105', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'60-hour battery is real',              body:'Used them across a week of remote work without charging. Comfort over long sessions is excellent.', createdAt:'2026-04-25' },

  // v-201 GlassShield 9H
  { id:'r-200', productId:'v-201', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Survived a tile floor drop',           body:'Phone hit the kitchen tile face-down. Tempered glass cracked, screen untouched. Bought the next pack immediately.', createdAt:'2026-03-22' },
  { id:'r-201', productId:'v-201', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Install kit is foolproof',             body:'The alignment frame made my first ever bubble-free install. Genuinely no air pockets.', createdAt:'2026-04-19' },

  // v-202 Privacy glass
  { id:'r-210', productId:'v-202', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'Great on the plane',                   body:'Worth it for the seatmate side-glance protection. Screen does dim a notch — fine indoors, slight issue in direct sun.', createdAt:'2026-05-11' },

  // v-204 CamGuard
  { id:'r-220', productId:'v-204', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Lenses still scratch-free',            body:'Two months into pocket abuse with keys and coins. Camera glass untouched.', createdAt:'2026-06-04' },

  // v-301 AeroMag
  { id:'r-300', productId:'v-301', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Lightest MagSafe case I owned',         body:'Holds magnetic accessories with zero slippage and you barely feel it on the phone.', createdAt:'2026-03-30' },
  { id:'r-301', productId:'v-301', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Wallet sticks like glue',               body:'My MagSafe wallet has not slipped once even when pulling the phone hard out of jeans.', createdAt:'2026-04-15' },
  { id:'r-302', productId:'v-301', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'Camera bezel could be taller',          body:'Lenses don\'t touch the surface but I\'d feel better with another mm of clearance.', createdAt:'2026-05-08' },

  // v-302 Rugged Armor
  { id:'r-310', productId:'v-302', userId:'u-alex', userName:'Alex Wong',   rating:4, title:'Built like a tank',                    body:'Survived a fall off the rooftop terrace onto concrete. Some scuff marks on the case, phone is fine.', createdAt:'2026-05-19' },

  // v-401 CinePro lens kit
  { id:'r-400', productId:'v-401', userId:'u-demo', userName:'Demo Voltic', rating:4, title:'Macro is the standout',                body:'Wide is decent, telephoto is OK, but the macro shots of plants and watches are genuinely impressive.', createdAt:'2026-04-30' },

  // v-402 RingLight
  { id:'r-410', productId:'v-402', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'My Zoom calls finally look good',      body:'Color modes nail my office tone. The remote shutter is a nice add for stills.', createdAt:'2026-05-25' },

  // v-404 GimbalMate
  { id:'r-420', productId:'v-404', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Tracking is silky smooth',             body:'Face-tracking kept my talking-head shots locked even when walking. Stabilization is on par with the Osmo.', createdAt:'2026-06-05' },

  // v-501 FlashDrive
  { id:'r-500', productId:'v-501', userId:'u-alex', userName:'Alex Wong',   rating:4, title:'Read speeds are real',                 body:'Copied a 60GB folder in just over 2 minutes. USB-C side is much faster than the A side, as expected.', createdAt:'2026-04-04' },

  // v-502 microSD Pro
  { id:'r-510', productId:'v-502', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Works flawlessly in my drone',         body:'4K60 on the Mini 4 Pro records without dropouts. Has survived a couple of dunks too.', createdAt:'2026-03-16' },
  { id:'r-511', productId:'v-502', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'A2 makes a real difference',           body:'App loading on my Pi 4 is noticeably faster than the old class-10 card.', createdAt:'2026-04-08' },

  // v-601 HubLink
  { id:'r-600', productId:'v-601', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'My docking station replacement',        body:'4K monitor + ethernet + power + SD all from one cable. The MacBook lives on this thing.', createdAt:'2026-05-21' },

  // v-602 OTG adapter
  { id:'r-610', productId:'v-602', userId:'u-alex', userName:'Alex Wong',   rating:5, title:'Tiny lifesaver',                       body:'Connected my Pro Controller to a phone for emulator stuff in 5 seconds.', createdAt:'2026-04-29' },

  // v-701 DriveMount
  { id:'r-700', productId:'v-701', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Grip survived a pothole',              body:'Bumpiest road in the city couldn\'t shake the phone loose. Magnets are no joke.', createdAt:'2026-05-04' },
  { id:'r-701', productId:'v-701', userId:'u-alex', userName:'Alex Wong',   rating:4, title:'Vent clip stays put',                  body:'No vent fatigue after two months. Easy snap-in MagSafe alignment.', createdAt:'2026-05-26' },

  // v-702 DeskHover
  { id:'r-710', productId:'v-702', userId:'u-demo', userName:'Demo Voltic', rating:5, title:'Holds my iPad Pro 12.9 fine',          body:'Solid, doesn\'t tip, and the angle locks securely. Looks like a $100 stand.', createdAt:'2026-04-18' }
];

/* ============================================================
   ADMIN — orders + customers (unchanged)
   ============================================================ */
export const SEED_ORDERS: Order[] = [
  // Demo user's order history — shows up under /account on first login.
  { id:'#VLT-10231', userId:'u-demo', customer:'Demo Voltic', email:'demo@voltik.com',
    total: 178.99, status:'delivered', date:'2026-04-22', items:3, payment:'Card',
    lines:[{ id:'v-101', qty:1 }, { id:'v-001', qty:1 }, { id:'v-005', qty:2 }],
    shipping:{ address:'221B Baker St', city:'London', country:'UK', phone:'+44 7700 900111' } },
  { id:'#VLT-10236', userId:'u-demo', customer:'Demo Voltic', email:'demo@voltik.com',
    total:  64.98, status:'delivered', date:'2026-05-09', items:2, payment:'UPI',
    lines:[{ id:'v-201', qty:2 }, { id:'v-303', qty:1 }],
    shipping:{ address:'221B Baker St', city:'London', country:'UK', phone:'+44 7700 900111' } },
  { id:'#VLT-10240', userId:'u-demo', customer:'Demo Voltic', email:'demo@voltik.com',
    total: 119.00, status:'shipped',   date:'2026-06-08', items:1, payment:'Card',
    lines:[{ id:'v-404', qty:1 }],
    shipping:{ address:'221B Baker St', city:'London', country:'UK', phone:'+44 7700 900111' } },

  // Alex's order
  { id:'#VLT-10238', userId:'u-alex', customer:'Alex Wong', email:'alex@voltik.com',
    total:  84.98, status:'delivered', date:'2026-05-29', items:2, payment:'Card',
    lines:[{ id:'v-301', qty:1 }, { id:'v-701', qty:1 }],
    shipping:{ address:'88 Orchard Rd', city:'Singapore', country:'SG', phone:'+65 9123 4567' } },

  // Guest / mixed orders that drive the admin dashboard.
  { id:'#VLT-10241', customer:'Ahmed Khan',     email:'ahmed.k@gmail.com',  total: 148.97, status:'delivered',  date:'2026-06-10', items:3, payment:'Card' },
  { id:'#VLT-10242', customer:'Priya Sharma',   email:'priya@outlook.com',  total:  79.99, status:'shipped',    date:'2026-06-11', items:1, payment:'COD'  },
  { id:'#VLT-10243', customer:'Daniel Lee',     email:'dlee@yahoo.com',     total: 219.50, status:'processing', date:'2026-06-12', items:4, payment:'Card' },
  { id:'#VLT-10244', customer:'Sofia Garcia',   email:'sofia.g@mail.com',   total:  34.99, status:'pending',    date:'2026-06-12', items:1, payment:'UPI'  },
  { id:'#VLT-10245', customer:'Wei Chen',       email:'wei.c@126.com',      total: 327.00, status:'delivered',  date:'2026-06-09', items:5, payment:'Card' },
  { id:'#VLT-10246', customer:'Hassan Raza',    email:'hraza@gmail.com',    total:  19.99, status:'shipped',    date:'2026-06-12', items:1, payment:'Card' },
  { id:'#VLT-10247', customer:'Olivia Brown',   email:'olivia@brown.io',    total:  92.48, status:'processing', date:'2026-06-13', items:2, payment:'Card' },
  { id:'#VLT-10248', customer:'Yuki Tanaka',    email:'yuki@nippon.jp',     total: 144.99, status:'cancelled',  date:'2026-06-08', items:2, payment:'Card' },
  { id:'#VLT-10249', customer:"Liam O'Connor",  email:'liam@oconnor.ie',    total:  68.98, status:'delivered',  date:'2026-06-10', items:2, payment:'UPI'  },
  { id:'#VLT-10250', customer:'Aisha Mohammed', email:'aisha@dxb.ae',       total: 199.00, status:'shipped',    date:'2026-06-13', items:3, payment:'Card' },
  { id:'#VLT-10251', customer:'Marco Rossi',    email:'marco@italia.it',    total:  44.50, status:'pending',    date:'2026-06-13', items:1, payment:'COD'  },
  { id:'#VLT-10252', customer:'Fatima Noor',    email:'fatima@noor.pk',     total: 287.49, status:'processing', date:'2026-06-13', items:4, payment:'Card' }
];

export const SEED_CUSTOMERS: Customer[] = [
  { id:'C-001', name:'Ahmed Khan',     email:'ahmed.k@gmail.com',  phone:'+92 300 1234567', orders:7,  spent:1248.74, since:'2025-04-12', tier:'Gold' },
  { id:'C-002', name:'Priya Sharma',   email:'priya@outlook.com',  phone:'+91 98 7654 3210', orders:3, spent:289.97,  since:'2025-11-02', tier:'Silver' },
  { id:'C-003', name:'Daniel Lee',     email:'dlee@yahoo.com',     phone:'+1 415 555 0123',  orders:11,spent:2104.50, since:'2024-09-18', tier:'Platinum' },
  { id:'C-004', name:'Sofia Garcia',   email:'sofia.g@mail.com',   phone:'+34 612 345 678',  orders:2, spent:64.98,   since:'2026-01-30', tier:'Silver' },
  { id:'C-005', name:'Wei Chen',       email:'wei.c@126.com',      phone:'+86 138 0013 8000',orders:9, spent:1782.00, since:'2024-12-04', tier:'Gold' },
  { id:'C-006', name:'Hassan Raza',    email:'hraza@gmail.com',    phone:'+92 333 4444555',  orders:1, spent:19.99,   since:'2026-06-12', tier:'Bronze' },
  { id:'C-007', name:'Olivia Brown',   email:'olivia@brown.io',    phone:'+44 7700 900123',  orders:4, spent:412.40,  since:'2025-08-21', tier:'Silver' },
  { id:'C-008', name:'Yuki Tanaka',    email:'yuki@nippon.jp',     phone:'+81 90 1234 5678', orders:6, spent:879.20,  since:'2025-03-14', tier:'Gold' },
  { id:'C-009', name:"Liam O'Connor",  email:'liam@oconnor.ie',    phone:'+353 87 654 3210', orders:2, spent:128.96,  since:'2026-02-08', tier:'Bronze' },
  { id:'C-010', name:'Aisha Mohammed', email:'aisha@dxb.ae',       phone:'+971 50 123 4567', orders:5, spent:998.45,  since:'2025-06-30', tier:'Gold' }
];
