/**
 * Independent arithmetic check for the eleven answer-first US pages and the clearance section of the bed calculator.
 *
 * It reads the BUILT html in dist/ (not the TypeScript data), and recomputes every
 * area, metric conversion, perimeter, clearance, furniture footprint, verdict and
 * drawing measurement from the room sides and standard U.S. mattress sizes below.
 * It fails (exit 1) on any mismatch. Run `npm run build` first.
 *
 * The constants and rules are deliberately re-typed here rather than imported, so a
 * wrong constant in src/us-seo/answer-pages.ts cannot also be wrong here.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = join(resolve(process.cwd()), 'dist');
const FT = 0.3048;
const SQFT = 0.092903;
const TARGET = 30;
const MATTRESS = { Twin: [38, 75], Full: [54, 75], Queen: [60, 80], King: [76, 80], 'California King': [72, 84] };
const SIZES = {
  Queen: [60, 80], King: [76, 80], NS: [16, 16], Dresser: [36, 18], DR: [36, 18], Desk: [48, 24], Sofa: [84, 36], Table: [30, 48],
};
const QUEEN_SQFT = (60 * 80) / 144;
const SET_SQFT = QUEEN_SQFT + (84 * 36) / 144 + (48 * 24) / 144 + (30 * 48) / 144;
const ROOMS = [[8, 10], [9, 10], [10, 10], [10, 12], [11, 12], [12, 12]];

const pages = [
  { slug: 'how-big-is-300-square-feet', kind: 'area', sqft: 300, titleHas: 'How Big Is 300 Square Feet', compare: true },
  { slug: '350-sq-ft-studio-apartment-layout', kind: 'area', sqft: 350, titleHas: 'How Big Is a 350 Sq Ft Room' },
  { slug: '400-sq-ft-studio-apartment-layout', kind: 'area', sqft: 400, titleHas: 'How Big Is a 400 Square Foot Apartment' },
  { slug: '450-sq-ft-studio-apartment-layout', kind: 'area', sqft: 450, titleHas: '450 Sq Ft Room Size' },
  { slug: '500-sq-ft-studio-apartment-layout', kind: 'area', sqft: 500, titleHas: '500 Sq Ft Apartment Layout' },
  { slug: '8x10-bedroom-layout', kind: 'bedroom', w: 8, l: 10, titleHas: '8x10 Bedroom Layout With a Queen Bed' },
  { slug: '9x10-bedroom-layout', kind: 'bedroom', w: 9, l: 10, titleHas: 'What Bedroom Furniture Fits in a 9x10 Room' },
  { slug: 'queen-bed-in-10x10-room', kind: 'bedroom', w: 10, l: 10, titleHas: 'Queen Bed Fit in a 10x10 Room', deskSide: true },
  { slug: 'king-bed-in-10x12-room', kind: 'bedroom', w: 10, l: 12, bed: 'King', turned: true, titleHas: 'King Bed Fit in a 10x12 Room', deskSide: true },
  { slug: '11x12-bedroom-layout', kind: 'bedroom', w: 11, l: 12, titleHas: '11x12 Bedroom Layout' },
  { slug: '12x12-bedroom-layout', kind: 'bedroom', w: 12, l: 12, titleHas: '12 by 12' },
];
const GUIDE_10 = '/en/layout-guides/10x10-bedroom-layout/';
const GUIDE_12 = '/en/layout-guides/10x12-bedroom-queen-desk/';
const GUIDE_300 = '/en/layout-guides/300-sq-ft-studio-layout/';
const P300 = '/en/how-big-is-300-square-feet/';
const P10 = '/en/queen-bed-in-10x10-room/';
const P10x12 = '/en/king-bed-in-10x12-room/';
const seriesLinks = {
  'how-big-is-300-square-feet': ['/en/350-sq-ft-studio-apartment-layout/', '/en/400-sq-ft-studio-apartment-layout/', GUIDE_300, '/en/8x10-bedroom-layout/', P10, '/en/11x12-bedroom-layout/', '/en/12x12-bedroom-layout/'],
  '350-sq-ft-studio-apartment-layout': [P300, '/en/400-sq-ft-studio-apartment-layout/', GUIDE_300],
  '400-sq-ft-studio-apartment-layout': ['/en/350-sq-ft-studio-apartment-layout/', '/en/450-sq-ft-studio-apartment-layout/', P300],
  '450-sq-ft-studio-apartment-layout': ['/en/400-sq-ft-studio-apartment-layout/', '/en/500-sq-ft-studio-apartment-layout/', P300],
  '500-sq-ft-studio-apartment-layout': ['/en/450-sq-ft-studio-apartment-layout/', P300],
  '8x10-bedroom-layout': ['/en/9x10-bedroom-layout/', GUIDE_10, P10, P10x12],
  '9x10-bedroom-layout': ['/en/8x10-bedroom-layout/', '/en/11x12-bedroom-layout/', GUIDE_10, P10, P10x12],
  'queen-bed-in-10x10-room': [GUIDE_10, '/en/9x10-bedroom-layout/', '/en/8x10-bedroom-layout/', P10x12, GUIDE_12, '/en/11x12-bedroom-layout/', '/en/12x12-bedroom-layout/'],
  'king-bed-in-10x12-room': [GUIDE_12, P10, GUIDE_10, '/en/11x12-bedroom-layout/', '/en/12x12-bedroom-layout/', '/en/9x10-bedroom-layout/'],
  '11x12-bedroom-layout': ['/en/9x10-bedroom-layout/', '/en/12x12-bedroom-layout/', GUIDE_12, P10x12],
  '12x12-bedroom-layout': ['/en/11x12-bedroom-layout/', GUIDE_12, P10x12],
};

const errors = [];
const counts = {};
const tally = (page, kind) => {
  counts[page] ??= {};
  counts[page][kind] = (counts[page][kind] ?? 0) + 1;
};
let current = '';
const fail = (message) => errors.push(`${current}: ${message}`);
const num = (text) => Number(String(text).replace(/,/g, ''));
const decimals = (text) => (String(text).split('.')[1] ?? '').length;
/** Assert a displayed number equals `expected` at the precision it was displayed with (half-unit tolerance). */
function same(shown, expected, what, kind, slack = 0) {
  const tolerance = 0.5 * 10 ** -decimals(shown) + 1e-9 + slack;
  tally(current, kind);
  if (!(Math.abs(num(shown) - expected) <= tolerance)) fail(`${what}: shows ${shown}, recomputed ${expected}`);
}
const entities = (text) => text.replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const strip = (html) => entities(html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function parseTables(html) {
  const tables = {};
  for (const match of html.matchAll(/<table class="us-seo-table" data-table="([^"]+)">([\s\S]*?)<\/table>/g)) {
    const rows = {};
    for (const row of match[2].matchAll(/<tr data-key="([^"]*)">([\s\S]*?)<\/tr>/g)) {
      rows[row[1]] = [...row[2].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((cell) => strip(cell[1]));
    }
    const heads = [...match[2].matchAll(/<th scope="col">([\s\S]*?)<\/th>/g)].map((cell) => strip(cell[1]));
    tables[match[1]] = { rows, heads };
  }
  return tables;
}

const verdictFor = (left) => (left >= TARGET ? 'Fits' : left >= 0 ? 'Tight' : 'Does not fit');

function checkText(text, cfg) {
  // metric sides: "A × B ft (a × b m)" or "A × B ft room measures a × b m"
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) m(?![²\w])/g)) {
    const before = text.slice(Math.max(0, match.index - 90), match.index);
    const ft = [...before.matchAll(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) ft/g)].pop();
    if (!ft) { fail(`metric sides "${match[0]}" have no preceding feet sides`); continue; }
    same(match[1], num(ft[1]) * FT, `${ft[0]} -> metres width`, 'metric-sides');
    same(match[2], num(ft[2]) * FT, `${ft[0]} -> metres length`, 'metric-sides');
  }
  // area in m²: needs a preceding "N sq ft"
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) m²/g)) {
    const before = text.slice(Math.max(0, match.index - 80), match.index);
    const sq = [...before.matchAll(/(\d+(?:\.\d+)?) (?:sq ft|square foot|square feet)/g)].pop();
    if (!sq) { fail(`"${match[0]}" has no preceding sq ft value`); continue; }
    same(match[1], num(sq[1]) * SQFT, `${sq[0]} -> m²`, 'area-m2');
  }
  for (const match of text.matchAll(/\((\d+(?:\.\d+)?) × 0\.092903\)/g)) {
    const before = text.slice(Math.max(0, match.index - 60), match.index);
    const sq = [...before.matchAll(/(\d+(?:\.\d+)?) sq ft/g)].pop();
    tally(current, 'factor-note');
    if (!sq || num(sq[1]) !== num(match[1])) fail(`conversion note "${match[0]}" does not match preceding ${sq?.[0]}`);
  }
  // subtraction chains: "96 − 60 − 18 = 18"
  for (const match of text.matchAll(/(\d+(?:\.\d+)?(?: − \d+(?:\.\d+)?)+) = (\d+(?:\.\d+)?)/g)) {
    const [first, ...rest] = match[1].split(' − ').map(num);
    const value = rest.reduce((sum, item) => sum - item, first);
    same(match[2], value, `equation ${match[0]}`, 'subtraction');
  }
  // addition chains: "60 + 30 = 90"
  for (const match of text.matchAll(/(\d+(?:\.\d+)?(?: \+ \d+(?:\.\d+)?)+) = (\d+(?:\.\d+)?)/g)) {
    const value = match[1].split(' + ').map(num).reduce((sum, item) => sum + item, 0);
    same(match[2], value, `equation ${match[0]}`, 'addition');
  }
  // division of areas: "300 ÷ 144 = 2.1"
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) ÷ (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)/g)) same(match[3], num(match[1]) / num(match[2]), `division ${match[0]}`, 'division');
  // inches written as feet and inches: "136 in (11 ft 4 in)"
  for (const match of text.matchAll(/(\d+) in \((\d+) ft(?: (\d+) in)?\)/g)) {
    tally(current, 'ft-in');
    if (num(match[2]) * 12 + num(match[3] ?? 0) !== num(match[1])) fail(`"${match[0]}" is not ${num(match[1])} in`);
  }
  for (const match of text.matchAll(/(\d+) × (\d+) in = (\d+(?:\.\d+)?) sq ft/g)) same(match[3], (num(match[1]) * num(match[2])) / 144, match[0], 'in-footprint');
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) ft = (\d+(?:\.\d+)?) sq ft/g)) same(match[3], num(match[1]) * num(match[2]), match[0], 'ft-area');
  // perimeter statements: "A × B ft room has a perimeter of P ft (Q m)"
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) ft [a-z ]*perimeter of (\d+(?:\.\d+)?) ft(?: \((\d+(?:\.\d+)?) m\))?/g)) {
    const p = 2 * (num(match[1]) + num(match[2]));
    same(match[3], p, `perimeter ${match[0]}`, 'perimeter');
    if (match[4]) same(match[4], p * FT, `perimeter metres ${match[0]}`, 'perimeter');
  }
  for (const match of text.matchAll(/(\d+(?:\.\d+)?)% of (\d+)\b/g)) {
    const base = num(match[2]);
    const shown = num(match[1]);
    const ok = [SET_SQFT, QUEEN_SQFT].some((top) => Math.abs(shown - (top / base) * 100) <= 0.05 + 1e-9);
    tally(current, 'percent');
    if (!ok) fail(`"${match[0]}" matches neither furniture set nor Queen share of ${base}`);
  }
  for (const match of text.matchAll(/(\d+(?:\.\d+)?)% larger/g)) {
    tally(current, 'percent');
    if (Math.abs(num(match[1]) - (50 / 350) * 100) > 0.05) fail(`"${match[0]}" is not 50/350`);
  }
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) Queen-bed footprints/g)) {
    if (cfg.kind === 'area') same(match[1], cfg.sqft / QUEEN_SQFT, `${match[0]} for ${cfg.sqft} sq ft`, 'queen-footprints');
  }
  for (const match of text.matchAll(/(\d+(?:\.\d+)?) times as large/g)) same(match[1], 350 / 144, match[0], 'ratio');
}

function checkAreaTables(tables, cfg) {
  const glance = tables.glance;
  if (!glance || Object.keys(glance.rows).length < 3) return fail('glance table missing or has fewer than 3 shapes');
  for (const [key, cells] of Object.entries(glance.rows)) {
    const sides = cells[1].match(/^(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) ft$/);
    const metres = cells[2].match(/^(\d+\.\d\d) × (\d+\.\d\d) m$/);
    const perimeter = cells[3].match(/^(\d+(?:\.\d+)?) ft \((\d+\.\d\d) m\)$/);
    const area = cells[4].match(/^(about )?(\d+) sq ft$/);
    const m2 = cells[5].match(/^(\d+\.\d) m²$/);
    if (!sides || !metres || !perimeter || !area || !m2) { fail(`glance row ${key}: cannot parse ${JSON.stringify(cells)}`); continue; }
    const [a, b] = [num(sides[1]), num(sides[2])];
    const approx = Boolean(area[1]);
    tally(current, 'glance-row');
    if (num(area[2]) !== cfg.sqft) fail(`glance ${key}: area column ${area[2]} != page area ${cfg.sqft}`);
    if (approx) {
      if (a !== b || Math.abs((a * b - cfg.sqft) / cfg.sqft) > 0.001) fail(`glance ${key}: square sides ${a}² = ${a * b} not within 0.1% of ${cfg.sqft}`);
    } else if (a * b !== cfg.sqft) fail(`glance ${key}: ${a} × ${b} = ${a * b}, not ${cfg.sqft}`);
    same(metres[1], a * FT, `glance ${key} width m`, 'glance-metric');
    same(metres[2], b * FT, `glance ${key} length m`, 'glance-metric');
    same(perimeter[1], 2 * (a + b), `glance ${key} perimeter ft`, 'glance-perimeter');
    same(perimeter[2], 2 * (a + b) * FT, `glance ${key} perimeter m`, 'glance-perimeter');
    same(m2[1], cfg.sqft * SQFT, `glance ${key} area m²`, 'glance-area');
  }
  const foot = tables.footprints;
  if (!foot) return fail('footprint table missing');
  let total = 0;
  for (const [key, cells] of Object.entries(foot.rows)) {
    if (key === 'Total') continue;
    const size = cells[1].match(/^(\d+) × (\d+) in$/);
    const fp = (num(size[1]) * num(size[2])) / 144;
    total += fp;
    same(cells[2].replace(' sq ft', ''), fp, `footprint ${key}`, 'footprint');
    same(cells[3].replace('%', ''), (fp / cfg.sqft) * 100, `footprint share ${key}`, 'footprint-share');
  }
  same(foot.rows.Total[2].replace(' sq ft', ''), total, 'footprint total', 'footprint');
  same(foot.rows.Total[3].replace('%', ''), (total / cfg.sqft) * 100, 'footprint total share', 'footprint-share');
  if (Math.abs(total - SET_SQFT) > 1e-9) fail(`footprint total ${total} != independent set ${SET_SQFT}`);
  if (cfg.compare) {
    const compare = tables.compare;
    if (!compare || Object.keys(compare.rows).length < 3) return fail('compare table missing or has fewer than 3 rooms');
    for (const [key, cells] of Object.entries(compare.rows)) {
      const [w, l] = key.split('x').map(num);
      tally(current, 'compare-row');
      const metres = cells[1].match(/^(\d+) × (\d+) ft \((\d+\.\d\d) × (\d+\.\d\d) m\)$/);
      if (!metres || num(metres[1]) !== w || num(metres[2]) !== l) { fail(`compare ${key}: cannot parse ${cells[1]} as ${w} × ${l} ft`); continue; }
      same(metres[3], w * FT, `compare ${key} width m`, 'compare-metric');
      same(metres[4], l * FT, `compare ${key} length m`, 'compare-metric');
      if (cells[2] !== `${w * l} sq ft`) fail(`compare ${key}: area "${cells[2]}" != ${w * l} sq ft`);
      const ratio = cells[3].match(/^(\d+) ÷ (\d+) = (\d+(?:\.\d+)?)$/);
      if (!ratio || num(ratio[1]) !== cfg.sqft || num(ratio[2]) !== w * l) fail(`compare ${key}: "${cells[3]}" is not ${cfg.sqft} ÷ ${w * l}`);
      else same(ratio[3], cfg.sqft / (w * l), `compare ${key} ratio`, 'compare-ratio');
    }
  }
}

function checkBedTable(table, W, L, label) {
  if (!table) return fail(`${label} table missing`);
  if (Object.keys(table.rows).length !== Object.keys(MATTRESS).length) fail(`${label} table must list every bed size`);
  for (const [name, [bw, bl]] of Object.entries(MATTRESS)) {
    const cells = table.rows[name];
    if (!cells) { fail(`${label}: ${name} row missing`); continue; }
    const side = W - bw;
    const foot = L - bl;
    const parsedSize = cells[1].match(/^(\d+) × (\d+)$/);
    tally(current, 'bed-row');
    if (!parsedSize || num(parsedSize[1]) !== bw || num(parsedSize[2]) !== bl) fail(`${label} ${name}: mattress size ${cells[1]} != ${bw} × ${bl}`);
    const sideShown = cells[2].match(/^(-?\d+) in(?: \((\d+(?:\.\d)?) each side if centered\))?$/);
    if (!sideShown || num(sideShown[1]) !== side) fail(`${label} ${name}: beside-the-bed "${cells[2]}" != ${side} in`);
    else if (sideShown[2] && num(sideShown[2]) !== side / 2) fail(`${label} ${name}: per-side "${cells[2]}" != ${side / 2}`);
    if (num(cells[3].replace(' in', '')) !== foot) fail(`${label} ${name}: foot "${cells[3]}" != ${foot} in`);
    const both = side >= 2 * TARGET ? 'Yes' : 'No';
    if (cells[4] !== both) fail(`${label} ${name}: both-sides "${cells[4]}" != ${both}`);
    const verdict = side < 0 || foot < 0 ? 'Does not fit' : side >= TARGET && foot >= TARGET ? 'Fits' : 'Tight';
    if (cells[5] !== verdict) fail(`${label} ${name}: verdict "${cells[5]}" != ${verdict} (side ${side}, foot ${foot})`);
  }
  for (const head of table.heads) {
    const eq = head.match(/\((\d+) − (?:width|length)\)/);
    if (eq && ![W, L].includes(num(eq[1]))) fail(`${label}: column header "${head}" does not use the room's ${W} or ${L} in`);
  }
}

function checkBedroomTables(tables, cfg) {
  const W = cfg.w * 12;
  const L = cfg.l * 12;
  checkBedTable(tables['what-fits'], W, L, 'what-fits');
  if (cfg.turned) {
    checkBedTable(tables['what-fits-turned'], L, W, 'what-fits-turned');
  } else if (tables['what-fits-turned']) fail('unexpected what-fits-turned table');
  const [bedW, bedL] = MATTRESS[cfg.bed ?? 'Queen'];
  const side = W - bedW;
  const foot = L - bedL;
  const expected = {
    nightstand: [side, 16, verdictFor(side - 16)],
    'dresser-side': [side, 18, verdictFor(side - 18)],
    'dresser-foot': [foot, 18, verdictFor(foot - 18)],
    'desk-foot': [foot, 24, foot - 24 >= TARGET ? 'Fits' : 'Does not fit'],
    ...(cfg.deskSide ? { 'desk-side': [side, 24, side - 24 >= TARGET ? 'Fits' : 'Does not fit'] } : {}),
  };
  if (!cfg.deskSide && tables.furniture?.rows['desk-side']) fail('unexpected desk-side row');
  for (const [key, [space, depth, verdict]] of Object.entries(expected)) {
    const cells = tables.furniture?.rows[key];
    if (!cells) { fail(`furniture row ${key} missing`); continue; }
    tally(current, 'furniture-row');
    const eq = cells[2].match(/^(\d+) − (\d+) = (-?\d+) in$/);
    if (!eq || num(eq[1]) !== space || num(eq[2]) !== depth || num(eq[3]) !== space - depth) fail(`furniture ${key}: "${cells[2]}" != ${space} − ${depth} = ${space - depth} in`);
    if (cells[3] !== verdict) fail(`furniture ${key}: verdict "${cells[3]}" != ${verdict}`);
  }
  const rooms = tables.glance;
  if (!rooms) return fail('room comparison table missing');
  for (const [w, l] of ROOMS) {
    const cells = rooms.rows[`${w}x${l}`];
    if (!cells) { fail(`room table: ${w}x${l} row missing`); continue; }
    tally(current, 'room-row');
    if (cells[1] !== `${w} × ${l} ft`) fail(`room ${w}x${l}: sides "${cells[1]}"`);
    same(cells[2].split(' × ')[0], w * FT, `room ${w}x${l} width m`, 'room-metric');
    same(cells[2].split(' × ')[1].replace(' m', ''), l * FT, `room ${w}x${l} length m`, 'room-metric');
    const perimeter = cells[3].match(/^(\d+) ft \((\d+\.\d\d) m\)$/);
    same(perimeter[1], 2 * (w + l), `room ${w}x${l} perimeter`, 'room-perimeter');
    same(perimeter[2], 2 * (w + l) * FT, `room ${w}x${l} perimeter m`, 'room-perimeter');
    same(cells[4].replace(' sq ft', ''), w * l, `room ${w}x${l} area`, 'room-area');
    same(cells[5].replace(' m²', ''), w * l * SQFT, `room ${w}x${l} m²`, 'room-area');
    if (cells[6] !== `${w * 12 - 60} in / ${l * 12 - 80} in`) fail(`room ${w}x${l}: Queen clearances "${cells[6]}" != ${w * 12 - 60} in / ${l * 12 - 80} in`);
  }
}

function parseFigure(figure) {
  const svg = figure.match(/<svg class="us-seo-floor-plan" viewBox="0 0 ([\d.]+) ([\d.]+)"[\s\S]*?<\/svg>/);
  if (!svg) return null;
  const items = [...svg[0].matchAll(/<g><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*\/><text[^>]*>([^<]*)<\/text><\/g>/g)]
    .map((m) => ({ x: num(m[1]), y: num(m[2]), w: num(m[3]), h: num(m[4]), label: entities(m[5]) }));
  return { W: num(svg[1]), L: num(svg[2]), items };
}

function gapBetween(plan, a, b) {
  const ra = plan.items.find((item) => item.label === a);
  if (!ra) return null;
  if (b.startsWith('wall-')) {
    return { left: ra.x, right: plan.W - ra.x - ra.w, top: ra.y, bottom: plan.L - ra.y - ra.h }[b.slice(5)];
  }
  const rb = plan.items.find((item) => item.label === b);
  if (!rb) return null;
  const dx = Math.max(rb.x - ra.x - ra.w, ra.x - rb.x - rb.w, 0);
  const dy = Math.max(rb.y - ra.y - ra.h, ra.y - rb.y - rb.h, 0);
  return dx > 0 && dy > 0 ? null : dx || dy;
}

function checkFigures(html, cfg) {
  const figures = [...html.matchAll(/<figure class="us-seo-diagram us-seo-diagram--scaled" data-plan[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
  if (figures.length < 2) return fail(`expected at least 2 to-scale diagrams, found ${figures.length}`);
  for (const figure of figures) {
    const plan = parseFigure(figure);
    if (!plan) { fail('diagram svg could not be parsed'); continue; }
    tally(current, 'diagram');
    plan.items.forEach((item, index) => {
      if (item.x < 0 || item.y < 0 || item.x + item.w > plan.W + 1e-9 || item.y + item.h > plan.L + 1e-9) fail(`diagram ${plan.W}×${plan.L}: ${item.label} is outside the room`);
      plan.items.slice(index + 1).forEach((other) => {
        if (item.x < other.x + other.w && item.x + item.w > other.x && item.y < other.y + other.h && item.y + item.h > other.y) fail(`diagram ${plan.W}×${plan.L}: ${item.label} overlaps ${other.label}`);
      });
      const standard = SIZES[item.label];
      if (standard) {
        tally(current, 'diagram-item-size');
        const ok = (item.w === standard[0] && item.h === standard[1]) || (item.w === standard[1] && item.h === standard[0]);
        if (!ok) fail(`diagram ${plan.W}×${plan.L}: ${item.label} drawn ${item.w} × ${item.h}, standard ${standard.join(' × ')}`);
      }
      const route = item.label.match(/^(\d+) in$/);
      if (route) {
        tally(current, 'diagram-route');
        if (![item.w, item.h].includes(num(route[1]))) fail(`diagram ${plan.W}×${plan.L}: route "${item.label}" is drawn ${item.w} × ${item.h}`);
      }
      if (item.label === 'Kitchen + bath') {
        tally(current, 'diagram-core');
        if (item.w !== plan.W) fail('kitchen + bath block must span the room width');
        const sqft = (item.w * item.h) / 144;
        if (Math.abs(sqft - 100) > 1) fail(`kitchen + bath block is ${sqft.toFixed(1)} sq ft, expected about 100`);
      }
    });
    // room size stated in the facts must equal the drawing's viewBox
    const facts = [...figure.matchAll(/<li data-gap-a="([^"]*)" data-gap-b="([^"]*)" data-gap-in="([^"]*)">([^<]*)<\/li>|<li>([^<]*)<\/li>/g)];
    for (const f of facts) {
      const text = entities(f[4] ?? f[5]);
      const roomIn = text.match(/^Room: (\d+) × (\d+) in \((\d+) × (\d+) ft\)$/);
      const roomFt = text.match(/^Room: (\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) ft = (\d+) sq ft$/);
      if (roomIn) {
        tally(current, 'diagram-room');
        if (num(roomIn[1]) !== plan.W || num(roomIn[2]) !== plan.L || num(roomIn[3]) * 12 !== plan.W || num(roomIn[4]) * 12 !== plan.L) fail(`diagram room text "${text}" != viewBox ${plan.W} × ${plan.L}`);
        const straight = num(roomIn[3]) === cfg.w && num(roomIn[4]) === cfg.l;
        const turned = cfg.turned && num(roomIn[3]) === cfg.l && num(roomIn[4]) === cfg.w;
        if (!straight && !turned) fail(`diagram room "${text}" is not ${cfg.w} × ${cfg.l} ft${cfg.turned ? ' (or turned)' : ''}`);
      }
      if (roomFt) {
        tally(current, 'diagram-room');
        if (Math.round(num(roomFt[1]) * 12) !== plan.W || Math.round(num(roomFt[2]) * 12) !== plan.L) fail(`diagram room text "${text}" != viewBox ${plan.W} × ${plan.L} in`);
        if (num(roomFt[3]) !== cfg.sqft) fail(`diagram room area "${text}" != ${cfg.sqft}`);
      }
      if (f[1]) {
        tally(current, 'diagram-gap');
        const gap = gapBetween(plan, f[1], f[2]);
        const stated = num(f[4].match(/: (\d+) in$/)?.[1]);
        if (gap === null || gap !== num(f[3]) || gap !== stated) fail(`diagram gap ${f[1]} -> ${f[2]}: drawing ${gap}, data ${f[3]}, text ${stated}`);
      }
    }
    const coreFact = facts.map((f) => entities(f[4] ?? f[5])).find((t) => t.startsWith('Kitchen + bath block'));
    if (coreFact) {
      const depth = num(coreFact.match(/(\d+) in deep/)[1]);
      const core = plan.items.find((item) => item.label === 'Kitchen + bath');
      tally(current, 'diagram-core');
      if (core.h !== depth) fail(`core fact says ${depth} in deep, drawn ${core.h}`);
    }
  }
}

if (!existsSync(dist)) throw new Error('dist/ is missing; run npm run build first');

for (const cfg of pages) {
  current = cfg.slug;
  const file = join(dist, 'en', cfg.slug, 'index.html');
  if (!existsSync(file)) { fail('built page missing'); continue; }
  const html = readFileSync(file, 'utf8');
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
  const title = entities(html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '');
  const description = entities(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const faqLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((node) => node['@type'] === 'FAQPage');

  const text = [title, description, strip(main), ...(faqLd?.mainEntity ?? []).map((q) => `${q.name} ${q.acceptedAnswer.text}`)].join(' | ');
  checkText(text.replace(/ \| /g, ' . '), cfg);
  const tables = parseTables(main);
  if (cfg.kind === 'area') checkAreaTables(tables, cfg); else checkBedroomTables(tables, cfg);
  checkFigures(main, cfg);

  tally(current, 'meta');
  if (!title.includes(cfg.titleHas)) fail(`title "${title}" does not contain "${cfg.titleHas}"`);
  if (title.length > 62) fail(`title is ${title.length} characters`);
  if (description.length > 170) fail(`description is ${description.length} characters`);
  const visibleFaq = [...main.matchAll(/<article><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/article>/g)].map((m) => [strip(m[1]), strip(m[2])]);
  tally(current, 'faq-schema');
  if (!faqLd || faqLd.mainEntity.length !== visibleFaq.length || faqLd.mainEntity.some((q, i) => q.name !== visibleFaq[i][0] || q.acceptedAnswer.text !== visibleFaq[i][1])) fail('FAQPage JSON-LD does not match the visible FAQ');
  const answer = strip(main.match(/<p class="us-seo-answer" data-answer>([\s\S]*?)<\/p>/)?.[1] ?? '');
  tally(current, 'answer-first');
  if (!/\d/.test(answer.split(/(?<=\.) /)[0] ?? '') || !/\d/.test(answer.split(/(?<=\.) /)[1] ?? '')) fail('first two sentences must both carry numbers');
  for (const href of seriesLinks[cfg.slug]) {
    tally(current, 'series-link');
    if (!main.includes(`href="${href}"`)) fail(`missing series link ${href}`);
  }
  tally(current, 'hedge-scan');
  if (/illustrative|not a claim about|does not certify/i.test(strip(main))) fail('old hedging phrase found');
}

// ---------------------------------------------------------------- bed calculator: "how much space around a bed"
{
  current = 'bed-room-fit-calculator#clearance';
  const file = join(dist, 'en', 'bed-room-fit-calculator', 'index.html');
  if (!existsSync(file)) fail('built page missing');
  else {
    const html = readFileSync(file, 'utf8');
    const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
    const section = main.match(/<section[^>]*id="clearance"[\s\S]*?<\/section>/)?.[0] ?? '';
    if (!section) fail('clearance section missing');
    const faqLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((node) => node['@type'] === 'FAQPage');
    const text = [strip(section), ...(faqLd?.mainEntity ?? []).map((q) => `${q.name} ${q.acceptedAnswer.text}`)].join(' . ');
    checkText(text, { kind: 'calculator' });
    tally(current, 'answer-first');
    const answer = strip(section.match(/<p data-clearance-answer>([\s\S]*?)<\/p>/)?.[1] ?? '');
    if (!/\b30 in\b/.test(answer.split(/(?<=\.) /)[0] ?? '') || !/\d/.test(answer.split(/(?<=\.) /)[1] ?? '')) fail('clearance answer must lead with the 30 in target and carry numbers in the second sentence');
    if (!/planning target/i.test(answer) || !/not a building code/i.test(answer)) fail('clearance answer must label the numbers as a planning target, not a code');
    const table = parseTables(section).clearance;
    if (!table) fail('clearance table missing');
    else {
      for (const [name, bw, bl] of [['Queen', 60, 80], ['King', 76, 80]]) {
        const cells = table.rows[name];
        if (!cells) { fail(`clearance ${name} row missing`); continue; }
        tally(current, 'clearance-row');
        const ftIn = (inches) => `${Math.floor(inches / 12)} ft${inches % 12 ? ` ${inches % 12} in` : ''}`;
        const expected = [`${bw} × ${bl}`, `${bw + TARGET} in (${ftIn(bw + TARGET)})`, `${bw + 2 * TARGET} in (${ftIn(bw + 2 * TARGET)})`, `${bl + TARGET} in (${ftIn(bl + TARGET)})`, `${ftIn(bw + 2 * TARGET)} × ${ftIn(bl + TARGET)}`];
        expected.forEach((value, index) => { if (cells[index + 1] !== value) fail(`clearance ${name} column ${index + 1}: "${cells[index + 1]}" != "${value}"`); });
      }
      for (const head of table.heads) {
        const m = head.match(/\(width \+ (\d+)\)|\(length \+ (\d+)\)/);
        if (m && ![TARGET, 2 * TARGET].includes(num(m[1] ?? m[2]))) fail(`clearance header "${head}" does not use the ${TARGET} in target`);
      }
    }
    for (const href of ['/en/queen-bed-in-10x10-room/', '/en/king-bed-in-10x12-room/', '/en/11x12-bedroom-layout/', '/en/12x12-bedroom-layout/']) {
      tally(current, 'series-link');
      if (!section.includes(`href="${href}"`)) fail(`clearance section missing link ${href}`);
    }
    // the page keeps its calculator and the original FAQ
    tally(current, 'calculator-kept');
    if (!/id="run-calculation"/.test(html)) fail('calculator button missing');
    tally(current, 'faq-schema');
    const visibleFaq = [...main.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => [strip(m[1]), strip(m[2])]);
    if (!faqLd || faqLd.mainEntity.length !== visibleFaq.length || faqLd.mainEntity.some((q, i) => q.name !== visibleFaq[i][0] || q.acceptedAnswer.text !== visibleFaq[i][1])) fail('FAQPage JSON-LD does not match the visible FAQ');
  }
}

console.log('[us-seo-arithmetic] checks per page:');
for (const [page, kinds] of Object.entries(counts)) {
  const total = Object.values(kinds).reduce((a, b) => a + b, 0);
  console.log(`  ${page}: ${total} checks (${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(', ')})`);
}
if (errors.length) {
  console.error(`[us-seo-arithmetic] FAIL: ${errors.length} mismatch(es)`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`[us-seo-arithmetic] PASS: ${Object.values(counts).reduce((s, k) => s + Object.values(k).reduce((a, b) => a + b, 0), 0)} recomputed values across ${pages.length} answer pages plus the bed-calculator clearance section, 0 mismatches.`);
