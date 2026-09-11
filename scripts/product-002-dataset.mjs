import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { validateLayoutGeometry } from '../src/small-space/geometry.ts';
import { CLEARANCE_POLICY, clearanceClass } from '../src/small-space/clearance-policy.ts';
import { validateStudioLayout } from '../src/small-space/studio.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REVIEW_DIR = path.join(ROOT, 'docs', 'product-002', 'review');
const SVG_DIR = path.join(REVIEW_DIR, 'svg');

const now = '2026-09-11';
const VERSION = '1.0.0-phase1';
const UNIVERSAL = 'universal';

function item(id, type, xMm, yMm, widthMm, depthMm, options = {}) {
  return {
    id, type, xMm, yMm, widthMm, depthMm,
    rotationDeg: options.rotationDeg ?? 0,
    clearanceMm: options.clearanceMm ?? 0,
    ...(options.label ? { label: options.label } : {}),
    ...(options.presetId ? { presetId: options.presetId } : {}),
    ...(options.footprintBasis ? { footprintBasis: options.footprintBasis } : {}),
    ...(options.frameAllowanceMm !== undefined ? { frameAllowanceMm: options.frameAllowanceMm } : {}),
    ...(options.required !== undefined ? { required: options.required } : {}),
    ...(options.swingMm !== undefined ? { swingMm: options.swingMm } : {}),
  };
}

function bed(id, x, y, width, depth, presetId, options = {}) {
  return item(id, 'bed', x, y, width, depth, { presetId, footprintBasis: 'mattress', frameAllowanceMm: 0, required: true, ...options });
}

function desk(id, x, y, width = 1000, depth = 600, options = {}) {
  return item(id, 'desk', x, y, width, depth, { required: true, ...options });
}

function chair(id, x, y, options = {}) { return item(id, 'chair', x, y, 500, 500, options); }
function wardrobe(id, x, y, width = 900, depth = 600, options = {}) { return item(id, 'wardrobe', x, y, width, depth, options); }
function dresser(id, x, y, width = 800, depth = 450, options = {}) { return item(id, 'dresser', x, y, width, depth, options); }
function shelf(id, x, y, width = 700, depth = 300, options = {}) { return item(id, 'shelving', x, y, width, depth, options); }
function nightstand(id, x, y) { return item(id, 'nightstand', x, y, 450, 400); }
function sofa(id, x, y, width = 1800, depth = 850, options = {}) { return item(id, 'sofa', x, y, width, depth, options); }
function loveseat(id, x, y, options = {}) { return item(id, 'loveseat', x, y, 1500, 800, options); }
function dining(id, x, y, width = 1000, depth = 700, options = {}) { return item(id, 'dining-table', x, y, width, depth, options); }
function storage(id, x, y, width = 1000, depth = 600, options = {}) { return item(id, 'storage-cabinet', x, y, width, depth, options); }

function fixtures(widthMm, lengthMm, doorScenario = 'D1', windowScenario = 'W1') {
  const door = doorScenario === 'D2'
    ? item('door', 'door', 0, Math.max(100, lengthMm - 850), 850, 100, { swingMm: 850, rotationDeg: 90 })
    : item('door', 'door', 0, Math.max(100, lengthMm - 100), 850, 100, { swingMm: 850 });
  const window = windowScenario === 'W2'
    ? item('window', 'window', Math.round(widthMm * 0.62), 0, Math.min(1200, Math.round(widthMm * 0.28)), 80)
    : windowScenario === 'W3'
      ? null
      : item('window', 'window', Math.round(widthMm * 0.32), 0, Math.min(1200, Math.round(widthMm * 0.34)), 80);
  return [door, ...(window ? [window] : [])];
}

function base(id, family, name, widthMm, lengthMm, furniture, options = {}) {
  return {
    id, version: VERSION, family, archetype: name, roomWidthMm: widthMm, roomLengthMm: lengthMm,
    shape: options.shape ?? 'rectangle', areaMm2: widthMm * lengthMm, localeBasis: UNIVERSAL,
    furniture, zones: options.zones ?? ['sleep'], clearances: options.clearances ?? { 'bed-side-mm': 760 },
    targetUses: options.targetUses ?? ['sleep'], priorityTags: options.priorityTags ?? [], warnings: options.warnings ?? [],
    qualityStatus: 'generated', doorScenario: options.doorScenario ?? 'D1', windowScenario: options.windowScenario ?? 'W1',
    occupancy: options.occupancy ?? 'single', bestFor: options.bestFor, tradeOff: options.tradeOff,
    review: options.review ?? { functional: true, visual: true, distinctiveness: true },
    strategyKey: options.strategyKey ?? name,
  };
}

function bedroomFamilies() {
  const rows = [];
  // 01 Compact single 2400 x 3000
  rows.push(base('BR-CS-001', 'compact-single-bedroom', 'Sleep-first Single + Open Floor', 2400, 3000, [
    ...fixtures(2400, 3000), bed('bed', 980, 520, 990, 1905, 'us-twin'), nightstand('nightstand', 480, 520), shelf('shelf', 100, 2500, 650, 300),
  ], { strategyKey: 'sleep-open-floor', bestFor: 'single sleeper who values an uncluttered centre', tradeOff: 'The shelf is narrow; there is no full work desk.', priorityTags: ['open-floor', 'sleep'], clearances: { 'bed-side-mm': 760, 'primary-route-mm': 760 }, targetUses: ['sleep', 'rest'] }));
  rows.push(base('BR-CS-002', 'compact-single-bedroom', 'Study-first Twin + Compact Desk', 2400, 3000, [
    ...fixtures(2400, 3000), bed('bed', 300, 950, 990, 1905, 'us-twin'), desk('desk', 1450, 350, 750, 550), chair('chair', 1550, 1000),
  ], { strategyKey: 'study-first', bestFor: 'student renter with a real study zone', tradeOff: 'Bed access is stronger on one side than the other.', priorityTags: ['study', 'work'], clearances: { 'bed-side-mm': 600, 'chair-pullback-mm': 750, 'primary-route-mm': 760 } }));
  rows.push(base('BR-CS-003', 'compact-single-bedroom', 'Storage-wall Single + Folding Work Surface', 2400, 3000, [
    ...fixtures(2400, 3000), bed('bed', 1000, 650, 900, 2000, 'eu-single'), wardrobe('wardrobe', 100, 500, 800, 600), dresser('dresser', 100, 2450, 700, 400), shelf('shelf', 1700, 2700, 550, 300),
  ], { strategyKey: 'storage-wall', bestFor: 'renter prioritising closed storage over a full desk', tradeOff: 'Work surface is compact and must stay clear to remain usable.', priorityTags: ['storage', 'rental'], clearances: { 'bed-side-mm': 600, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 760 } }));

  // 02 Compact single-plus 2700 x 3000
  rows.push(base('BR-CSP-001', 'compact-single-plus-bedroom', 'Full Desk Single + Clear Entry', 2700, 3000, [
    ...fixtures(2700, 3000), bed('bed', 250, 600, 990, 1905, 'us-twin'), desk('desk', 1500, 300, 1000, 600), chair('chair', 1700, 1050), wardrobe('wardrobe', 1800, 2200, 800, 550),
  ], { strategyKey: 'full-desk', bestFor: 'student who needs a full-size desk', tradeOff: 'Wardrobe sits at the foot zone and needs disciplined door opening.', priorityTags: ['study', 'clear-entry'], clearances: { 'bed-side-mm': 760, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-CSP-002', 'compact-single-plus-bedroom', 'Larger Bed + Compact Desk', 2700, 3000, [
    ...fixtures(2700, 3000), bed('bed', 1000, 500, 1372, 1905, 'us-full'), desk('desk', 100, 2500, 700, 350), chair('chair', 300, 1900), wardrobe('wardrobe', 100, 300, 750, 550),
  ], { strategyKey: 'larger-bed', bestFor: 'single sleeper who wants a wider bed', tradeOff: 'The desk is compact and the bed has a preferred one-side approach.', priorityTags: ['sleep', 'compact-work'], clearances: { 'bed-side-mm': 600, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700 } }));
  rows.push(base('BR-CSP-003', 'compact-single-plus-bedroom', 'Storage Wall + Open Centre', 2700, 3000, [
    ...fixtures(2700, 3000), bed('bed', 1600, 700, 990, 1905, 'us-twin'), wardrobe('wardrobe', 100, 300, 900, 600), dresser('dresser', 100, 2350, 800, 450), shelf('shelf', 1300, 250, 1000, 300),
  ], { strategyKey: 'storage-open-centre', bestFor: 'renter with high storage needs', tradeOff: 'Desk work is secondary; the open centre is the main relief.', priorityTags: ['storage', 'open-centre'], clearances: { 'bed-side-mm': 760, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 900 } }));

  // 03 Square small 3000 x 3000
  rows.push(base('BR-SQ-001', 'square-small-bedroom', 'Bed-centred Queen + Side Access', 3000, 3000, [
    ...fixtures(3000, 3000), bed('bed', 700, 500, 1524, 2032, 'us-queen'), nightstand('nightstand-left', 180, 600), nightstand('nightstand-right', 2370, 600), wardrobe('wardrobe', 2300, 1100, 500, 900),
  ], { strategyKey: 'bed-centred', occupancy: 'couple', bestFor: 'couple prioritising a centred queen bed', tradeOff: 'There is no full desk; storage is concentrated at the foot.', priorityTags: ['couple', 'bed-centred'], clearances: { 'bed-side-mm': 760, 'wardrobe-opening-mm': 700, 'primary-route-mm': 760 } }));
  rows.push(base('BR-SQ-002', 'square-small-bedroom', 'Work-first Queen + Wall Desk', 3000, 3000, [
    ...fixtures(3000, 3000, 'D2', 'W2'), bed('bed', 300, 800, 1524, 2032, 'us-queen'), desk('desk', 2050, 350, 750, 550), chair('chair', 2150, 1000), wardrobe('wardrobe', 300, 250, 800, 500),
  ], { strategyKey: 'work-first', occupancy: 'couple', bestFor: 'couple sharing a room with a focused work zone', tradeOff: 'One long side of the queen is intentionally tighter than the other.', priorityTags: ['work', 'couple'], clearances: { 'bed-side-mm': 600, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 760 }, warnings: ['One-side bed access is the deliberate trade-off.'] }));
  rows.push(base('BR-SQ-003', 'square-small-bedroom', 'Open-centre Full + Flexible Desk', 3000, 3000, [
    ...fixtures(3000, 3000), bed('bed', 250, 650, 1372, 1905, 'us-full'), desk('desk', 2050, 2200, 700, 500), chair('chair', 2100, 1600), wardrobe('wardrobe', 1850, 350, 900, 500),
  ], { strategyKey: 'open-centre', bestFor: 'single sleeper who wants the largest central activity zone', tradeOff: 'The full bed gives up sleeping width for circulation.', priorityTags: ['open-centre', 'flexibility'], clearances: { 'bed-side-mm': 900, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));

  // 04 Narrow 2400 x 3600
  rows.push(base('BR-N-001', 'narrow-bedroom', 'Long-wall Twin + Clear Route', 2400, 3600, [
    ...fixtures(2400, 3600), bed('bed', 300, 1150, 990, 1905, 'us-twin'), wardrobe('wardrobe', 1450, 450, 800, 550), desk('desk', 300, 300, 800, 500), chair('chair', 1350, 1100),
  ], { strategyKey: 'long-wall-bed', bestFor: 'narrow room needing a continuous route from entry to window', tradeOff: 'Desk and bed share the same long-wall rhythm.', priorityTags: ['route', 'study'], clearances: { 'bed-side-mm': 760, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-N-002', 'narrow-bedroom', 'End-wall Twin + Side Work Zone', 2400, 3600, [
    ...fixtures(2400, 3600), bed('bed', 1050, 300, 990, 1905, 'us-twin'), desk('desk', 300, 2500, 900, 550), chair('chair', 500, 1950), wardrobe('wardrobe', 100, 500, 750, 550),
  ], { strategyKey: 'end-wall-bed', bestFor: 'single sleeper who prefers the bed to define the far end', tradeOff: 'The desk is at the window end and gets the strongest light but less storage nearby.', priorityTags: ['work', 'light'], clearances: { 'bed-side-mm': 600, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 760 } }));
  rows.push(base('BR-N-003', 'narrow-bedroom', 'Linear Storage + Work Nook', 2400, 3600, [
    ...fixtures(2400, 3600, 'D2', 'W2'), bed('bed', 1100, 1450, 900, 2000, 'eu-single'), wardrobe('wardrobe', 150, 300, 900, 600), dresser('dresser', 150, 2550, 800, 450), desk('desk', 1500, 300, 700, 500), chair('chair', 1550, 900),
  ], { strategyKey: 'linear-storage-work', bestFor: 'renter balancing storage and a small work nook', tradeOff: 'The route is efficient but visually busier than the open-centre options.', priorityTags: ['storage', 'work'], clearances: { 'bed-side-mm': 600, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 760 } }));

  // 05 Medium narrow 2700 x 3600
  rows.push(base('BR-MN-001', 'medium-narrow-bedroom', 'Double-first + Stable Wardrobe Wall', 2700, 3600, [
    ...fixtures(2700, 3600), bed('bed', 200, 900, 1524, 1905, 'us-queen'), wardrobe('wardrobe', 1900, 300, 700, 600), nightstand('nightstand', 1750, 900),
  ], { strategyKey: 'double-first', occupancy: 'couple', bestFor: 'couple prioritising a wider sleep surface', tradeOff: 'Storage is narrow and concentrated on one wall.', priorityTags: ['couple', 'storage'], clearances: { 'bed-side-mm': 760, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-MN-002', 'medium-narrow-bedroom', 'Desk-first Queen + Side Route', 2700, 3600, [
    ...fixtures(2700, 3600), bed('bed', 1150, 1400, 1524, 2032, 'us-queen'), desk('desk', 100, 500, 1000, 550), chair('chair', 300, 1100), wardrobe('wardrobe', 100, 2800, 700, 550),
  ], { strategyKey: 'desk-first', occupancy: 'couple', bestFor: 'couple with a dedicated work-from-home surface', tradeOff: 'Only one side of the queen has the most generous access.', priorityTags: ['work', 'couple'], clearances: { 'bed-side-mm': 600, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 760 }, warnings: ['One-side bed access is intentional in this compact WFH strategy.'] }));
  rows.push(base('BR-MN-003', 'medium-narrow-bedroom', 'Storage-first Double + Open Foot', 2700, 3600, [
    ...fixtures(2700, 3600), bed('bed', 1200, 1500, 1372, 1905, 'us-full'), wardrobe('wardrobe', 100, 250, 900, 600), dresser('dresser', 100, 2900, 800, 450), shelf('shelf', 1800, 300, 700, 300),
  ], { strategyKey: 'storage-first', bestFor: 'renter who wants a clear, labelled storage wall', tradeOff: 'The bed is smaller than a queen to protect an open foot route.', priorityTags: ['storage', 'open-route'], clearances: { 'bed-side-mm': 760, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 900 } }));

  // 06 3048 x 3658 (10x12 class)
  rows.push(base('BR-1012-001', '10x12-bedroom', 'Queen + Desk with Light Route', 3048, 3658, [
    ...fixtures(3048, 3658), bed('bed', 250, 900, 1524, 2032, 'us-queen'), desk('desk', 2050, 300, 850, 600), chair('chair', 2150, 1000), wardrobe('wardrobe', 2050, 3000, 750, 500),
  ], { strategyKey: 'queen-desk-light-route', occupancy: 'couple', bestFor: 'couple who needs both a queen bed and a usable desk', tradeOff: 'The desk sits close to the window wall; keep cable and curtain access clear.', priorityTags: ['work', 'couple', 'light'], clearances: { 'bed-side-mm': 760, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-1012-002', '10x12-bedroom', 'Queen + Wardrobe Wall', 3048, 3658, [
    ...fixtures(3048, 3658, 'D2'), bed('bed', 700, 650, 1524, 2032, 'us-queen'), wardrobe('wardrobe', 2300, 1200, 700, 600), dresser('dresser', 2050, 2800, 750, 450), nightstand('nightstand', 200, 700),
  ], { strategyKey: 'queen-wardrobe-wall', occupancy: 'couple', bestFor: 'couple who prefers consolidated clothing storage', tradeOff: 'The wardrobe wall wins storage but narrows the secondary route.', priorityTags: ['storage', 'couple'], clearances: { 'bed-side-mm': 760, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 760 } }));
  rows.push(base('BR-1012-003', '10x12-bedroom', 'Taiwan 5-ft + Desk + Wardrobe Balance', 3048, 3658, [
    ...fixtures(3048, 3658, 'D2', 'W2'), bed('bed', 150, 900, 1520, 1880, 'tw-5-ft'), desk('desk', 1850, 2850, 900, 550), chair('chair', 2050, 2200), wardrobe('wardrobe', 1850, 400, 900, 600),
  ], { strategyKey: 'full-desk-wardrobe', bestFor: 'single sleeper wanting the most complete furniture set', tradeOff: 'The full bed is the deliberate compromise that keeps both desk and wardrobe usable.', priorityTags: ['work', 'storage', 'trade-off'], clearances: { 'bed-side-mm': 900, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));

  // 07 Medium 3000 x 4000
  rows.push(base('BR-M-001', 'medium-bedroom', 'Couple-first Queen + Two Sides', 3000, 4000, [
    ...fixtures(3000, 4000), bed('bed', 730, 750, 1524, 2032, 'us-queen'), nightstand('nightstand-left', 200, 800), nightstand('nightstand-right', 2370, 800), wardrobe('wardrobe', 1900, 3200, 850, 550),
  ], { strategyKey: 'couple-two-sides', occupancy: 'couple', bestFor: 'couple wanting balanced access to a queen bed', tradeOff: 'The layout leaves less room for a full desk.', priorityTags: ['couple', 'balanced-access'], clearances: { 'bed-side-mm': 900, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-M-002', 'medium-bedroom', 'WFH Queen + Quiet Work Wall', 3000, 4000, [
    ...fixtures(3000, 4000, 'D2'), bed('bed', 250, 1100, 1524, 2032, 'us-queen'), desk('desk', 1900, 300, 1000, 600), chair('chair', 2050, 1000), wardrobe('wardrobe', 250, 3300, 800, 550),
  ], { strategyKey: 'wfh-quiet-wall', occupancy: 'couple', bestFor: 'couple needing a dedicated quiet work wall', tradeOff: 'The bed shifts off-centre to protect a straight chair pull-back zone.', priorityTags: ['work', 'couple'], clearances: { 'bed-side-mm': 760, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-M-003', 'medium-bedroom', 'Storage/Open-space Balance', 3000, 4000, [
    ...fixtures(3000, 4000, 'D2', 'W2'), bed('bed', 980, 700, 1372, 1905, 'us-full'), wardrobe('wardrobe', 100, 2800, 900, 600), dresser('dresser', 1900, 3300, 800, 450), shelf('shelf', 100, 2300, 750, 300),
  ], { strategyKey: 'storage-open-balance', bestFor: 'single sleeper choosing open floor over a larger bed', tradeOff: 'Storage is excellent but the bed is a full rather than a queen.', priorityTags: ['storage', 'open-floor'], clearances: { 'bed-side-mm': 900, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 900 } }));

  // 08 Wider 3300 x 3600
  rows.push(base('BR-W-001', 'wider-bedroom', 'Balanced Couple Queen', 3300, 3600, [
    ...fixtures(3300, 3600), bed('bed', 880, 650, 1524, 2032, 'us-queen'), nightstand('nightstand-left', 300, 700), nightstand('nightstand-right', 2470, 700), wardrobe('wardrobe', 2100, 2900, 900, 550),
  ], { strategyKey: 'balanced-couple', occupancy: 'couple', bestFor: 'couple who wants balanced access without overfurnishing', tradeOff: 'Work happens elsewhere; this is intentionally sleep-led.', priorityTags: ['couple', 'balanced-access'], clearances: { 'bed-side-mm': 900, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-W-002', 'wider-bedroom', 'Large Workstation + Queen', 3300, 3600, [
    ...fixtures(3300, 3600, 'D2'), bed('bed', 250, 700, 1524, 2032, 'us-queen'), desk('desk', 2050, 250, 1100, 650), chair('chair', 2200, 1050), wardrobe('wardrobe', 250, 3000, 850, 500),
  ], { strategyKey: 'large-workstation', occupancy: 'couple', bestFor: 'WFH couple needing a real-width desk', tradeOff: 'The desk takes the brightest wall and reduces spare display space.', priorityTags: ['work', 'couple'], clearances: { 'bed-side-mm': 760, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'primary-route-mm': 900 } }));
  rows.push(base('BR-W-003', 'wider-bedroom', 'Storage-first Queen + Dresser Wall', 3300, 3600, [
    ...fixtures(3300, 3600, 'D2', 'W2'), bed('bed', 900, 850, 1524, 2032, 'us-queen'), wardrobe('wardrobe', 100, 250, 1000, 600), dresser('dresser', 2450, 3000, 750, 450), shelf('shelf', 100, 2850, 800, 300),
  ], { strategyKey: 'storage-first-queen', occupancy: 'couple', bestFor: 'couple with a high clothing and display-storage load', tradeOff: 'The open centre is preserved, but the foot wall is visually busy.', priorityTags: ['storage', 'couple'], clearances: { 'bed-side-mm': 900, 'wardrobe-opening-mm': 700, 'dresser-opening-mm': 700, 'primary-route-mm': 900 } }));

  // 09 Micro studio 5600 x 5000 (~28 m2)
  rows.push(base('ST-MICRO-001', 'micro-studio', 'Open-space Micro Studio', 5600, 5000, [
    ...fixtures(5600, 5000, 'D2', 'W2'), bed('bed', 350, 350, 1524, 2032, 'us-queen'), loveseat('sofa', 3500, 350), desk('desk', 350, 3300, 1000, 600), chair('chair', 1400, 3400), dining('dining', 3500, 3300, 1000, 700), storage('storage', 4700, 1800, 600, 500),
  ], { strategyKey: 'open-space', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], targetUses: ['studio', 'hosting'], bestFor: 'single renter who wants one legible open room', tradeOff: 'The bed is visually open to the living zone; privacy is intentionally low.', priorityTags: ['open-plan', 'hosting'], clearances: { 'primary-route-mm': 900, 'chair-pullback-mm': 750, 'studio-entry-mm': 900 } }));
  rows.push(base('ST-MICRO-002', 'micro-studio', 'Work-first Micro Studio', 5600, 5000, [
    ...fixtures(5600, 5000, 'D2'), bed('bed', 3600, 350, 1524, 2032, 'us-queen'), sofa('sofa', 350, 3500, 1900, 850), desk('desk', 350, 500, 1400, 650), chair('chair', 900, 1300), dining('dining', 3000, 3500, 900, 650), storage('storage', 4800, 2800, 600, 500),
  ], { strategyKey: 'work-first', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], targetUses: ['studio', 'work'], bestFor: 'WFH renter who needs a true desk zone', tradeOff: 'The sleeping zone is separated by distance rather than a partition.', priorityTags: ['work', 'zoning'], clearances: { 'primary-route-mm': 900, 'chair-pullback-mm': 750, 'studio-entry-mm': 900 } }));
  rows.push(base('ST-MICRO-003', 'micro-studio', 'Sleep-privacy Micro Studio', 5600, 5000, [
    ...fixtures(5600, 5000, 'D2', 'W2'), bed('bed', 350, 300, 1524, 2032, 'us-queen'), shelf('divider', 2050, 250, 300, 1800), sofa('sofa', 3300, 3300, 1900, 850), desk('desk', 3300, 600, 900, 550), chair('chair', 3400, 1350), dining('dining', 3300, 2150, 900, 650), storage('storage', 4700, 300, 600, 500),
  ], { strategyKey: 'sleep-privacy', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], targetUses: ['studio', 'privacy'], bestFor: 'sleeper who values a visual sleep boundary', tradeOff: 'The divider costs some central openness and is not a full acoustic wall.', priorityTags: ['privacy', 'zoning'], clearances: { 'primary-route-mm': 900, 'chair-pullback-mm': 750, 'studio-entry-mm': 900 } }));

  // 10 Small studio 6100 x 6100 (~37 m2)
  rows.push(base('ST-SMALL-001', 'small-studio', 'Hosting-first Small Studio', 6100, 6100, [
    ...fixtures(6100, 6100, 'D2', 'W2'), bed('bed', 350, 350, 1524, 2032, 'us-queen'), sofa('sofa', 3500, 400, 2000, 900), dining('dining', 3500, 2300, 1200, 750), desk('desk', 350, 4000, 1000, 600), chair('chair', 1400, 4100), storage('storage', 5100, 1800, 700, 550),
  ], { strategyKey: 'hosting-first', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], targetUses: ['studio', 'hosting'], bestFor: 'renter who hosts meals and still needs a work surface', tradeOff: 'The bed is exposed and the work zone is compact.', priorityTags: ['hosting', 'dining'], clearances: { 'primary-route-mm': 900, 'chair-pullback-mm': 750, 'studio-entry-mm': 900 } }));
  rows.push(base('ST-SMALL-002', 'small-studio', 'WFH-first Small Studio', 6100, 6100, [
    ...fixtures(6100, 6100, 'D2'), bed('bed', 3800, 350, 1524, 2032, 'us-queen'), sofa('sofa', 350, 3800, 1900, 850), desk('desk', 350, 400, 1600, 700), chair('chair', 900, 1350), dining('dining', 3600, 3300, 900, 650), storage('storage', 5100, 2800, 700, 550),
  ], { strategyKey: 'wfh-first', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], targetUses: ['studio', 'work'], bestFor: 'WFH renter who wants a full-size desk without losing the living zone', tradeOff: 'The sofa shifts to the entry-side wall and needs a clear arrival route.', priorityTags: ['work', 'full-desk'], clearances: { 'primary-route-mm': 900, 'chair-pullback-mm': 750, 'studio-entry-mm': 900 } }));
  rows.push(base('ST-SMALL-003', 'small-studio', 'Storage-first Small Studio', 6100, 6100, [
    ...fixtures(6100, 6100, 'D2', 'W2'), bed('bed', 350, 350, 1372, 1905, 'us-full'), sofa('sofa', 3600, 3800, 1900, 850), desk('desk', 3600, 500, 1000, 600), chair('chair', 3750, 1350), dining('dining', 3500, 2300, 900, 650), storage('storage-wall', 5000, 1200, 1100, 600), wardrobe('wardrobe', 2300, 350, 900, 600),
  ], { strategyKey: 'storage-first', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], targetUses: ['studio', 'storage'], bestFor: 'renter with a high storage load and smaller bed preference', tradeOff: 'The full bed is smaller, but the storage wall is materially stronger.', priorityTags: ['storage', 'full-bed'], clearances: { 'primary-route-mm': 900, 'chair-pullback-mm': 750, 'wardrobe-opening-mm': 700, 'studio-entry-mm': 900 } }));
  return rows;
}

function rejectedCandidates() {
  return [
    base('REJ-CS-001', 'compact-single-bedroom', 'Duplicate Sleep-first Variant', 2400, 3000, [...fixtures(2400, 3000), bed('bed', 985, 520, 990, 1905, 'us-twin'), nightstand('nightstand', 480, 520), shelf('shelf', 1600, 250, 650, 300)], { strategyKey: 'sleep-open-floor', review: { functional: true, visual: true, distinctiveness: false }, rejectionReason: 'duplicate candidate: same strategy and near-identical geometry as BR-CS-001' }),
    base('REJ-SQ-001', 'square-small-bedroom', 'Blocked Queen Door Swing', 3000, 3000, [...fixtures(3000, 3000), bed('bed', 150, 150, 1524, 2032, 'us-queen')], { strategyKey: 'door-conflict', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'door swing collision / bed placed in entry exclusion zone' }),
    base('REJ-N-001', 'narrow-bedroom', 'Unusable Chair Nook', 2400, 3600, [...fixtures(2400, 3600), bed('bed', 300, 1150, 990, 1905, 'us-twin'), desk('desk', 1450, 300, 800, 500), chair('chair', 1500, 700)], { strategyKey: 'unusable-chair', review: { functional: false, visual: true, distinctiveness: true }, rejectionReason: 'desk chair pull-back is blocked by bed clearance and has no usable exit' }),
    base('REJ-MN-001', 'medium-narrow-bedroom', 'Blocked Hinged Wardrobe', 2700, 3600, [...fixtures(2700, 3600), bed('bed', 200, 900, 1524, 1905, 'us-queen'), wardrobe('wardrobe', 1750, 850, 900, 600)], { strategyKey: 'blocked-wardrobe', occupancy: 'couple', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'wardrobe opening zone collides with the bed access route' }),
    base('REJ-1012-001', '10x12-bedroom', 'Overloaded Furniture Set', 3048, 3658, [...fixtures(3048, 3658), bed('bed', 150, 650, 1524, 2032, 'us-queen'), desk('desk', 1800, 650, 1100, 650), chair('chair', 1900, 1400), wardrobe('wardrobe', 1850, 1400, 900, 600), dresser('dresser', 900, 2900, 900, 500)], { strategyKey: 'overloaded', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'required access paths collapse when the requested furniture set is combined' }),
    base('REJ-M-001', 'medium-bedroom', 'Cosmetic Mirror of Couple Plan', 3000, 4000, [...fixtures(3000, 4000), bed('bed', 730, 750, 1524, 2032, 'us-queen'), nightstand('nightstand-left', 200, 800), nightstand('nightstand-right', 2370, 800), wardrobe('wardrobe', 1900, 3200, 850, 550)], { strategyKey: 'couple-two-sides', review: { functional: true, visual: true, distinctiveness: false }, rejectionReason: 'duplicate candidate: cosmetic coordinate shift does not create a new strategy' }),
    base('REJ-W-001', 'wider-bedroom', 'Wardrobe and Dresser Collision', 3300, 3600, [...fixtures(3300, 3600), bed('bed', 880, 650, 1524, 2032, 'us-queen'), wardrobe('wardrobe', 100, 250, 1000, 600), dresser('dresser', 900, 300, 850, 450)], { strategyKey: 'storage-collision', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'storage pieces overlap and their opening zones conflict' }),
    base('REJ-ST-001', 'micro-studio', 'Studio Without Entry Route', 5600, 5000, [...fixtures(5600, 5000, 'D2'), bed('bed', 100, 2100, 1524, 2032, 'us-queen'), sofa('sofa', 200, 2500, 1900, 850), desk('desk', 2300, 2400, 1000, 600), chair('chair', 2500, 3000), dining('dining', 3400, 2500), storage('storage', 4600, 2500)], { strategyKey: 'entry-blocked', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'furniture blocks the studio entry path and zone completeness is nominal only' }),
    base('REJ-ST-002', 'small-studio', 'Studio Furniture Pile', 6100, 6100, [...fixtures(6100, 6100, 'D2'), bed('bed', 200, 200, 1930, 2032, 'us-king'), sofa('sofa', 2200, 250, 2200, 1000), desk('desk', 200, 2500, 1600, 700), chair('chair', 900, 3300), dining('dining', 2200, 2600, 1400, 800), storage('storage', 4000, 2500, 1500, 700)], { strategyKey: 'overloaded-studio', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'too many large pieces for a legible route; technically close but not a believable small-space choice' }),
    base('REJ-CS-002', 'compact-single-bedroom', 'No Bedside Access', 2400, 3000, [...fixtures(2400, 3000), bed('bed', 1350, 500, 990, 1905, 'us-twin'), wardrobe('wardrobe', 300, 450, 800, 550)], { strategyKey: 'no-bed-access', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'bed is pinned against furniture on both practical access sides' }),
    base('REJ-CSP-001', 'compact-single-plus-bedroom', 'Desk Behind Wardrobe', 2700, 3000, [...fixtures(2700, 3000), bed('bed', 300, 600, 1372, 1905, 'us-full'), wardrobe('wardrobe', 1700, 400, 900, 600), desk('desk', 1750, 900, 900, 600), chair('chair', 1900, 1550)], { strategyKey: 'desk-blocked', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'wardrobe and desk compete for the same functional wall' }),
    base('REJ-SQ-002', 'square-small-bedroom', 'Queen with Cosmetic Bed Shift', 3000, 3000, [...fixtures(3000, 3000), bed('bed', 710, 510, 1524, 2032, 'us-queen'), nightstand('nightstand-left', 190, 600), nightstand('nightstand-right', 2380, 600), wardrobe('wardrobe', 1900, 2400, 900, 500)], { strategyKey: 'bed-centred', occupancy: 'couple', review: { functional: true, visual: true, distinctiveness: false }, rejectionReason: 'duplicate candidate: only a small bed translation from BR-SQ-001' }),
    base('REJ-1012-002', '10x12-bedroom', 'Desk Chair into Window', 3048, 3658, [...fixtures(3048, 3658, 'D2'), bed('bed', 250, 900, 1524, 2032, 'us-queen'), desk('desk', 1950, 100, 850, 600), chair('chair', 2100, 750), wardrobe('wardrobe', 250, 3100, 900, 500)], { strategyKey: 'chair-window-conflict', occupancy: 'couple', review: { functional: false, visual: false, distinctiveness: true }, rejectionReason: 'desk chair blocks window opening and has no practical pull-back' }),
    base('REJ-MICRO-001', 'micro-studio', 'Studio Duplicate Open Plan', 5600, 5000, [...fixtures(5600, 5000, 'D2', 'W2'), bed('bed', 350, 350, 1524, 2032, 'us-queen'), loveseat('sofa', 3500, 350), desk('desk', 350, 3300, 1000, 600), chair('chair', 1400, 3400), dining('dining', 3500, 3300, 1000, 700), storage('storage', 4700, 700, 600, 500)], { strategyKey: 'open-space', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], review: { functional: true, visual: true, distinctiveness: false }, rejectionReason: 'duplicate candidate: same furniture topology as ST-MICRO-001' }),
    base('REJ-SMALL-001', 'small-studio', 'Studio Missing Sleep Privacy', 6100, 6100, [...fixtures(6100, 6100, 'D2'), bed('bed', 3800, 350, 1524, 2032, 'us-queen'), sofa('sofa', 350, 3800, 1900, 850), desk('desk', 350, 400, 1600, 700), chair('chair', 900, 1350), dining('dining', 3600, 3300, 900, 650), storage('storage', 5100, 350, 700, 550)], { strategyKey: 'wfh-first', shape: 'rectangle', occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], review: { functional: true, visual: true, distinctiveness: false }, rejectionReason: 'duplicate candidate: same topology as ST-SMALL-002 without a meaningful strategy change' }),
  ];
}

function functionalReview(layout) {
  const issues = [];
  const types = new Set(layout.furniture.map((item) => item.type));
  if (types.has('desk') && !types.has('chair')) issues.push('desk-without-chair');
  if (types.has('wardrobe') && (layout.clearances['wardrobe-opening-mm'] ?? 0) < 600) issues.push('wardrobe-opening');
  if (types.has('dresser') && (layout.clearances['dresser-opening-mm'] ?? 0) < 600) issues.push('dresser-opening');
  if (layout.occupancy === 'couple') {
    const bed = layout.furniture.find((item) => item.type === 'bed');
    if (!bed || bed.widthMm < 1372) issues.push('couple-bed-width');
    if ((layout.clearances['bed-side-mm'] ?? 0) < 600) issues.push('couple-bed-access');
  }
  if (layout.occupancy === 'studio') {
    for (const zone of ['sleep', 'work', 'living', 'dining', 'storage-entry']) if (!layout.zones.includes(zone)) issues.push(`missing-${zone}`);
    for (const type of ['bed', 'desk', 'chair', 'dining-table']) if (!types.has(type)) issues.push(`studio-missing-${type}`);
    if (!(types.has('sofa') || types.has('loveseat'))) issues.push('studio-missing-living-seat');
    if (!(types.has('storage-cabinet') || types.has('wardrobe'))) issues.push('studio-missing-storage');
    if ((layout.clearances['studio-entry-mm'] ?? 0) < 760) issues.push('studio-entry-route');
    issues.push(...validateStudioLayout(layout).issues.map((issue) => issue.code));
  }
  if (layout.review.functional === false) issues.push(layout.rejectionReason ?? 'manual-functional-review-fail');
  return { pass: issues.length === 0, issues };
}

function strategySignature(layout) {
  return layout.furniture.filter((item) => !['door', 'window'].includes(item.type)).map((item) => `${item.type}:${item.rotationDeg}:${Math.round(item.xMm / 100)}:${Math.round(item.yMm / 100)}`).join('|');
}

function distinctivenessReview(layout, familySeen) {
  const sig = strategySignature(layout);
  if (familySeen.has(sig) || layout.review.distinctiveness === false) return { pass: false, reason: layout.rejectionReason ?? 'duplicate candidate' };
  familySeen.add(sig);
  return { pass: true, reason: null };
}

function visualReview(layout) {
  // Manual review decisions are authored in the candidate spec; this function only
  // records the review result and the questions used by the reviewer.
  const questions = [
    'bed legible', 'route legible', 'desk usable', 'wardrobe usable', 'scale plausible',
    'no dead-end', 'meaningfully different', 'human choice', '搬家具時可照做', 'no algorithmic artefact',
  ];
  return { pass: layout.review.visual !== false, questions, reviewer: 'product-002-phase1-review', reviewedOn: now };
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function renderSvg(layout) {
  const scale = Math.min(700 / layout.roomWidthMm, 500 / layout.roomLengthMm);
  const pad = 60;
  const width = Math.round(layout.roomWidthMm * scale + pad * 2);
  const height = Math.round(layout.roomLengthMm * scale + pad * 2 + 45);
  const colors = { bed: '#cfe6dc', desk: '#f4dfc8', chair: '#f2cfb0', wardrobe: '#dcd4bc', dresser: '#e4d7c9', shelving: '#ded9c8', 'storage-cabinet': '#ded9c8', sofa: '#d4dfea', loveseat: '#d4dfea', 'dining-table': '#eadcb5', nightstand: '#d8e1d0', door: '#bd7450', window: '#4f8596', divider: '#b4a78f' };
  const box = (item) => {
    const rotated = item.rotationDeg === 90 || item.rotationDeg === 270;
    const w = rotated ? item.depthMm : item.widthMm;
    const h = rotated ? item.widthMm : item.depthMm;
    const x = pad + item.xMm * scale;
    const y = pad + item.yMm * scale;
    if (item.type === 'door') return `<path d="M ${x} ${y + h * scale} A ${item.swingMm * scale} ${item.swingMm * scale} 0 0 1 ${x + item.swingMm * scale} ${y + h * scale - item.swingMm * scale}" fill="none" stroke="${colors.door}" stroke-width="3"/><line x1="${x}" y1="${y + h * scale}" x2="${x + w * scale}" y2="${y + h * scale}" stroke="${colors.door}" stroke-width="6"/>`;
    if (item.type === 'window') return `<line x1="${x}" y1="${y}" x2="${x + w * scale}" y2="${y}" stroke="${colors.window}" stroke-width="7"/>`;
    return `<rect x="${x}" y="${y}" width="${w * scale}" height="${h * scale}" rx="4" fill="${colors[item.type] ?? '#e4e0d7'}" stroke="#4a4a43" stroke-width="2"/><text x="${x + (w * scale) / 2}" y="${y + (h * scale) / 2 + 4}" text-anchor="middle" font-size="11" fill="#262623">${escapeXml(item.label ?? item.type)}</text>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f7f4ee"/><text x="${pad}" y="25" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#272b27">${escapeXml(layout.id)} · ${escapeXml(layout.archetype)}</text><rect x="${pad}" y="${pad}" width="${layout.roomWidthMm * scale}" height="${layout.roomLengthMm * scale}" fill="#fffdf9" stroke="#242b28" stroke-width="3"/>${layout.furniture.map(box).join('')}<text x="${pad}" y="${height - 12}" font-family="Arial,sans-serif" font-size="11" fill="#5d625d">${layout.roomWidthMm} × ${layout.roomLengthMm} mm · ${escapeXml(layout.family)} · ${escapeXml(layout.qualityStatus)}</text></svg>`;
}

function renderContactSheet(layouts, title) {
  const cols = 3;
  const cellW = 390;
  const cellH = 310;
  const rows = Math.ceil(layouts.length / cols);
  const items = layouts.map((layout, index) => {
    const x = (index % cols) * cellW;
    const y = Math.floor(index / cols) * cellH + 38;
    const scale = Math.min(330 / layout.roomWidthMm, 230 / layout.roomLengthMm);
    const ox = x + 28;
    const oy = y + 34;
    const rects = layout.furniture.map((item) => {
      const rotated = item.rotationDeg === 90 || item.rotationDeg === 270;
      const w = (rotated ? item.depthMm : item.widthMm) * scale;
      const h = (rotated ? item.widthMm : item.depthMm) * scale;
      const fill = item.type === 'bed' ? '#cfe6dc' : item.type === 'desk' ? '#f4dfc8' : item.type === 'wardrobe' ? '#dcd4bc' : item.type === 'sofa' || item.type === 'loveseat' ? '#d4dfea' : '#e4e0d7';
      return `<rect x="${ox + item.xMm * scale}" y="${oy + item.yMm * scale}" width="${w}" height="${h}" fill="${fill}" stroke="#42453f" stroke-width="1"/>`;
    }).join('');
    return `<g><rect x="${x + 10}" y="${y}" width="${cellW - 20}" height="${cellH - 10}" rx="8" fill="#fffdf9" stroke="#d8d1c4"/><text x="${x + 22}" y="${y + 22}" font-family="Arial,sans-serif" font-size="12" font-weight="700">${escapeXml(layout.id)} · ${escapeXml(layout.archetype)}</text><rect x="${ox}" y="${oy}" width="${layout.roomWidthMm * scale}" height="${layout.roomLengthMm * scale}" fill="#faf8f2" stroke="#303630" stroke-width="2"/>${rects}<text x="${x + 22}" y="${y + 285}" font-family="Arial,sans-serif" font-size="10" fill="#5d625d">${layout.roomWidthMm}×${layout.roomLengthMm} · ${layout.qualityStatus} · ${escapeXml(layout.strategyKey)}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cellW}" height="${rows * cellH + 38}" viewBox="0 0 ${cols * cellW} ${rows * cellH + 38}"><rect width="100%" height="100%" fill="#f1eee7"/><text x="18" y="25" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#272b27">${escapeXml(title)}</text>${items}</svg>`;
}

async function main() {
  await mkdir(SVG_DIR, { recursive: true });
  const candidates = [...bedroomFamilies(), ...rejectedCandidates()];
  const familySeen = new Map();
  const processed = [];
  const rejected = [];
  for (const candidate of candidates) {
    const validation = validateLayoutGeometry(candidate);
    const familySet = familySeen.get(candidate.family) ?? new Set();
    familySeen.set(candidate.family, familySet);
    const functional = functionalReview(candidate);
    const distinctiveness = distinctivenessReview(candidate, familySet);
    const visual = visualReview(candidate);
    const status = !validation.valid ? 'rejected' : !functional.pass ? 'rejected' : !visual.pass ? 'rejected' : !distinctiveness.pass ? 'rejected' : 'approved';
    const result = { ...candidate, areaMm2: candidate.roomWidthMm * candidate.roomLengthMm, qualityStatus: status, layoutDistinctiveness: distinctiveness.pass ? 1 : 0, clearanceClassification: Object.fromEntries(Object.entries(candidate.clearances).map(([key, value]) => [key, clearanceClass(value)])), validation, functionalReview: functional, visualReview: visual, distinctivenessReview: distinctiveness, validatedOn: now };
    processed.push(result);
    const rejectionReason = candidate.rejectionReason || validation.issues.map((issue) => issue.code).join(', ') || functional.issues.join(', ') || distinctiveness.reason || 'review failed';
    if (status === 'rejected') rejected.push({ id: candidate.id, family: candidate.family, reason: rejectionReason, validation, functionalReview: functional, visualReview: visual, distinctivenessReview: distinctiveness });
    await writeFile(path.join(SVG_DIR, `${candidate.id}.svg`), renderSvg(result), 'utf8');
  }
  const approved = processed.filter((layout) => layout.qualityStatus === 'approved');
  const candidateSummary = { generatedOn: now, version: VERSION, candidateCount: processed.length, approvedCount: approved.length, rejectedCount: rejected.length, clearancePolicy: CLEARANCE_POLICY, familyCounts: Object.fromEntries([...new Set(processed.map((layout) => layout.family))].map((family) => [family, { candidates: processed.filter((layout) => layout.family === family).length, approved: approved.filter((layout) => layout.family === family).length }])), rejectedReasons: rejected.reduce((map, row) => { const key = row.reason.split(':')[0]; map[key] = (map[key] ?? 0) + 1; return map; }, {}) };
  await writeFile(path.join(REVIEW_DIR, 'candidate-layouts.json'), JSON.stringify(processed, null, 2), 'utf8');
  await writeFile(path.join(REVIEW_DIR, 'approved-layouts.json'), JSON.stringify(approved, null, 2), 'utf8');
  await writeFile(path.join(REVIEW_DIR, 'rejected-layouts.json'), JSON.stringify(rejected, null, 2), 'utf8');
  await writeFile(path.join(REVIEW_DIR, 'validation-report.json'), JSON.stringify(candidateSummary, null, 2), 'utf8');
  const candidateSheet = renderContactSheet(processed, 'PRODUCT-002 Candidate Layout Review');
  const approvedSheet = renderContactSheet(approved, 'PRODUCT-002 Approved Layout Review');
  await writeFile(path.join(REVIEW_DIR, 'candidate-contact-sheet.svg'), candidateSheet, 'utf8');
  await writeFile(path.join(REVIEW_DIR, 'approved-contact-sheet.svg'), approvedSheet, 'utf8');
  await sharp(Buffer.from(candidateSheet)).png().toFile(path.join(REVIEW_DIR, 'candidate-contact-sheet.png'));
  await sharp(Buffer.from(approvedSheet)).png().toFile(path.join(REVIEW_DIR, 'approved-contact-sheet.png'));
  console.log(JSON.stringify(candidateSummary, null, 2));
}

await main();
