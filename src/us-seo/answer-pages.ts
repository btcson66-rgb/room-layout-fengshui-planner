import type { DiagramItem, DiagramPlan } from './renderer';

/**
 * Answer-first US pages: four room-area pages (350/400/450/500 sq ft) and four
 * bedroom pages (8x10, 9x10, 11x12, 12x12 ft).
 *
 * Every number shown on these pages is computed here from a small set of inputs
 * (room sides, standard U.S. mattress sizes, example furniture footprints), so the
 * prose, the tables and the drawings cannot drift apart. `scripts/us-seo-arithmetic-check.mjs`
 * re-derives all of it independently from the built HTML.
 */

export const FT_TO_M = 0.3048;
export const SQFT_TO_M2 = 0.092903;
/** Planning target for walking space (inches). A planning target, not a building code. */
export const WALK_TARGET_IN = 30;

export type Verdict = 'Fits' | 'Tight' | 'Does not fit';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Cell {
  text: string;
  href?: string;
  verdict?: Verdict;
}

export interface TableData {
  id: string;
  heading: string;
  intro?: string;
  columns: string[];
  rows: Array<{ key: string; cells: Cell[] }>;
  note?: string;
}

export interface PlanFact {
  text: string;
  a?: string;
  b?: string;
  inches?: number;
}

export interface PlanFigure {
  plan: DiagramPlan;
  heading: string;
  summary: string;
  facts: PlanFact[];
  legend: string;
}

export interface AnswerPageData {
  kind: 'area' | 'bedroom';
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  answer: [string, string];
  caveat: string;
  tables: TableData[];
  plansHeading: string;
  plansIntro: string;
  plans: PlanFigure[];
  limitsHeading: string;
  limits: string[];
  faq: FaqItem[];
  relatedHeading: string;
  related: Array<{ href: string; title: string; note: string }>;
  datePublished?: string;
  dateModified: string;
}

// ---------------------------------------------------------------- number helpers

const trim = (value: number, digits: number): string => {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor + (value >= 0 ? 1e-9 : -1e-9)) / factor;
  return String(rounded);
};
const fixed = (value: number, digits: number): string => (Math.round(value * 10 ** digits + 1e-9) / 10 ** digits).toFixed(digits);
const ftM = (ft: number): string => fixed(ft * FT_TO_M, 2);
const sqftM2 = (sqft: number): string => fixed(sqft * SQFT_TO_M2, 1);
const dims = (a: number, b: number): string => `${trim(a, 2)} × ${trim(b, 2)}`;
/** Feet to a `W × L` metres string, two decimals each. */
const dimsM = (wFt: number, lFt: number): string => `${ftM(wFt)} × ${ftM(lFt)}`;
const an = (n: number): string => (/^(8|11|18)/.test(String(n)) ? 'an' : 'a');

const SIZES = {
  Twin: { width: 38, length: 75 },
  Full: { width: 54, length: 75 },
  Queen: { width: 60, length: 80 },
  King: { width: 76, length: 80 },
  'California King': { width: 72, length: 84 },
} as const;
type BedName = keyof typeof SIZES;

const NIGHTSTAND = { width: 16, depth: 16 };
const DRESSER = { width: 36, depth: 18 };
const DESK = { width: 48, depth: 24 };
const SOFA = { width: 84, depth: 36 };
const TABLE = { width: 30, depth: 48 };
const sqftOfIn = (a: number, b: number): number => (a * b) / 144;
const QUEEN_SQFT = sqftOfIn(60, 80);
const SET_SQFT = QUEEN_SQFT + sqftOfIn(SOFA.width, SOFA.depth) + sqftOfIn(DESK.width, DESK.depth) + sqftOfIn(TABLE.width, TABLE.depth);

// ---------------------------------------------------------------- diagram helpers

type Tone = NonNullable<DiagramItem['tone']>;
const box = (label: string, x: number, y: number, width: number, height: number, tone: Tone): DiagramItem => ({ label, x, y, width, height, tone });

function rectOf(plan: DiagramPlan, label: string): DiagramItem {
  const found = plan.items.find((item) => item.label === label);
  if (!found) throw new Error(`${plan.title}: no item labelled ${label}`);
  return found;
}

/** Clear distance in inches between two items, or between an item and a wall (`wall-left|right|top|bottom`). */
function gapIn(plan: DiagramPlan, a: string, b: string): number {
  const ra = rectOf(plan, a);
  if (b.startsWith('wall-')) {
    const side = b.slice(5);
    if (side === 'left') return ra.x;
    if (side === 'right') return plan.roomWidth - (ra.x + ra.width);
    if (side === 'top') return ra.y;
    if (side === 'bottom') return plan.roomLength - (ra.y + ra.height);
    throw new Error(`unknown wall ${b}`);
  }
  const rb = rectOf(plan, b);
  const dx = Math.max(rb.x - (ra.x + ra.width), ra.x - (rb.x + rb.width), 0);
  const dy = Math.max(rb.y - (ra.y + ra.height), ra.y - (rb.y + rb.height), 0);
  if ((dx > 0) === (dy > 0)) throw new Error(`${plan.title}: ${a} and ${b} are not separated along exactly one axis`);
  return dx || dy;
}

function fact(plan: DiagramPlan, a: string, b: string, text: string): PlanFact {
  const inches = gapIn(plan, a, b);
  return { text: `${text}: ${inches} in`, a, b, inches };
}

const LEGEND: Record<string, string> = {
  Queen: 'Queen mattress 60 × 80 in',
  King: 'King mattress 76 × 80 in',
  NS: 'NS = nightstand 16 × 16 in',
  Dresser: 'Dresser 36 × 18 in',
  DR: 'DR = dresser 36 × 18 in',
  Desk: 'Desk 48 × 24 in',
  Sofa: 'Sofa 84 × 36 in',
  Table: 'Table 30 × 48 in',
};
function legendFor(plan: DiagramPlan, extra: string[] = []): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const item of plan.items) {
    if (LEGEND[item.label] && !seen.has(item.label)) {
      seen.add(item.label);
      parts.push(LEGEND[item.label]);
    }
  }
  return [...parts, ...extra, 'green strips = open floor, labelled with its width'].join(' · ');
}

// ---------------------------------------------------------------- area pages

interface Shape {
  w: number;
  l: number;
  label: string;
  /** Square row: sides are the rounded square root, so the product only approximates the area. */
  approx?: boolean;
}

interface AreaConfig {
  squareFeet: number;
  slug: string;
  shapes: Shape[];
  drawn: [number, number];
}

function areaGlanceTable(cfg: AreaConfig): TableData {
  return {
    id: 'glance',
    heading: `${cfg.squareFeet} sq ft at a glance: dimensions in feet and meters`,
    intro: `Every row is ${cfg.squareFeet} sq ft (${sqftM2(cfg.squareFeet)} m²). Any width and length that multiply to ${cfg.squareFeet} work, so these are examples from narrow to square.`,
    columns: ['Shape', 'Sides (ft)', 'Sides (m)', 'Perimeter', 'Area (sq ft)', 'Area (m²)'],
    rows: cfg.shapes.map((shape) => {
      const perimeter = 2 * (shape.w + shape.l);
      return {
        key: `${shape.w}x${shape.l}${shape.approx ? '~' : ''}`,
        cells: [
          { text: shape.label },
          { text: `${dims(shape.w, shape.l)} ft` },
          { text: `${dimsM(shape.w, shape.l)} m` },
          { text: `${trim(perimeter, 2)} ft (${fixed(perimeter * FT_TO_M, 2)} m)` },
          { text: shape.approx ? `about ${cfg.squareFeet} sq ft` : `${cfg.squareFeet} sq ft` },
          { text: `${sqftM2(cfg.squareFeet)} m²` },
        ],
      };
    }),
    note: 'Perimeter is 2 × (width + length). Metric sides are feet × 0.3048; area in m² is sq ft × 0.092903.',
  };
}

function footprintTable(squareFeet: number): TableData {
  const rows: Array<[string, string, number]> = [
    ['Queen mattress', '60 × 80 in', QUEEN_SQFT],
    ['Sofa', `${SOFA.width} × ${SOFA.depth} in`, sqftOfIn(SOFA.width, SOFA.depth)],
    ['Four-seat table', `${TABLE.width} × ${TABLE.depth} in`, sqftOfIn(TABLE.width, TABLE.depth)],
    ['Desk', `${DESK.width} × ${DESK.depth} in`, sqftOfIn(DESK.width, DESK.depth)],
  ];
  return {
    id: 'footprints',
    heading: `What ${squareFeet} sq ft holds: furniture footprints as arithmetic`,
    intro: `Footprint is width × depth ÷ 144 (square inches to square feet). The sizes are common examples; swap in the outside dimensions of the pieces you plan to buy.`,
    columns: ['Piece', 'Size', 'Footprint (sq ft)', `Share of ${squareFeet} sq ft`],
    rows: [
      ...rows.map(([item, size, sqft]) => ({
        key: item,
        cells: [{ text: item }, { text: size }, { text: `${fixed(sqft, 1)} sq ft` }, { text: `${fixed((sqft / squareFeet) * 100, 1)}%` }],
      })),
      { key: 'Total', cells: [{ text: 'All four together' }, { text: '—' }, { text: `${fixed(SET_SQFT, 1)} sq ft` }, { text: `${fixed((SET_SQFT / squareFeet) * 100, 1)}%` }] },
    ],
    note: 'Footprints do not include walking space, chair pullback or the swing of doors and drawers.',
  };
}

const CORE_SQFT = 100;

function studioFigure(squareFeet: number, wFt: number, lFt: number, heading: string, summary: string): PlanFigure {
  const W = Math.round(wFt * 12);
  const L = Math.round(lFt * 12);
  const coreDepth = Math.round((CORE_SQFT * 144) / W);
  const bandTop = coreDepth + 12;
  const bandBottom = bandTop + TABLE.depth;
  const bedTop = L - 80;
  const route = bedTop - bandBottom;
  const plan: DiagramPlan = {
    title: `${dims(wFt, lFt)} ft studio, furniture to scale`,
    roomWidth: W,
    roomLength: L,
    unit: 'in',
    dimensionLabel: `${dims(wFt, lFt)} ft`,
    hideDimensionText: true,
    items: [
      box('Kitchen + bath', 0, 0, W, coreDepth, 'fixed'),
      box('Table', 0, bandTop, TABLE.width, TABLE.depth, 'feature'),
      box('Sofa', 48, bandTop, SOFA.width, SOFA.depth, 'feature'),
      box(`${route} in`, 0, bandBottom, W, route, 'route'),
      box('Queen', 0, bedTop, 60, 80, 'bed'),
      box('Desk', W - DESK.width, L - DESK.depth, DESK.width, DESK.depth, 'work'),
    ],
  };
  return {
    plan,
    heading,
    summary,
    facts: [
      { text: `Room: ${dims(wFt, lFt)} ft = ${squareFeet} sq ft` },
      { text: `Kitchen + bath block: full width, ${coreDepth} in deep, about ${CORE_SQFT} sq ft (an assumption for the drawing)` },
      fact(plan, 'Table', 'Queen', 'Table to Queen'),
    ],
    legend: legendFor(plan),
  };
}

function seriesLinks(current: number): AnswerPageData['related'] {
  const all = [
    { sq: 300, href: '/en/layout-guides/300-sq-ft-studio-layout/', title: '300 sq ft studio layouts: three zoning strategies' },
    { sq: 350, href: '/en/350-sq-ft-studio-apartment-layout/', title: '350 sq ft room: dimensions and studio layout' },
    { sq: 400, href: '/en/400-sq-ft-studio-apartment-layout/', title: '400 square foot apartment: sizes and layouts' },
    { sq: 450, href: '/en/450-sq-ft-studio-apartment-layout/', title: '450 sq ft room: size and studio apartment layout' },
    { sq: 500, href: '/en/500-sq-ft-studio-apartment-layout/', title: '500 sq ft apartment layout: size and how to furnish it' },
  ];
  const nearby = all
    .filter((item) => item.sq !== current)
    .sort((a, b) => Math.abs(a.sq - current) - Math.abs(b.sq - current) || a.sq - b.sq)
    .map((item) => ({ href: item.href, title: item.title, note: `${item.sq} sq ft is ${sqftM2(item.sq)} m², ${item.sq > current ? `${item.sq - current} sq ft larger` : `${current - item.sq} sq ft smaller`}.` }));
  return [
    ...nearby,
    { href: '/en/studio-apartment-layout/', title: 'Studio apartment layout planner', note: 'Zone sleep, work and dining in your own measured studio.' },
    { href: '/en/room-size-layout-templates/', title: 'Room sizer and layout templates', note: 'Pick a room area and get a calculated template.' },
    { href: '/en/room-layout-planner/', title: 'Draw your actual studio in the RoomFeng planner', note: 'Enter your measured walls and furniture.' },
  ];
}

const AREA_LIMITS = (squareFeet: number): string[] => [
  `A listing's ${squareFeet} sq ft can include the kitchen, bathroom, closets and sometimes wall thickness, so the floor you can furnish is smaller than the headline number. The drawings above reserve about ${CORE_SQFT} sq ft for a kitchen and bath to show the effect; your apartment will differ.`,
  'The 30 in walking target is a planning number, not a building-code requirement. Measure the open floor wall to wall, mark door swings and radiators, and use the outside size of each piece before you buy.',
];

function areaPage(cfg: AreaConfig, text: {
  subject: string; title: string; description: string; h1: string; faq: FaqItem[]; summaries: [string, string];
}): AnswerPageData {
  const sq = cfg.squareFeet;
  const [drawnA, drawnB] = cfg.drawn.map((index) => cfg.shapes[index]);
  const exact = cfg.shapes.filter((shape) => !shape.approx);
  const examples = exact.slice(1, 4).map((shape) => `${dims(shape.w, shape.l)} ft (${dimsM(shape.w, shape.l)} m)`);
  const square = cfg.shapes.find((shape) => shape.approx);
  const queens = trim(sq / QUEEN_SQFT, 1);
  const first = `${text.subject} is ${sqftM2(sq)} m²: for example ${examples.slice(0, 2).join(', ')}${square ? ` or about ${dims(square.w, square.l)} ft (${dimsM(square.w, square.l)} m) if it is square` : ` or ${examples[2]}`}.`;
  const second = `In furniture terms, ${sq} sq ft is ${queens} Queen-bed footprints (60 × 80 in = ${fixed(QUEEN_SQFT, 1)} sq ft each), and a Queen bed, an ${SOFA.width} in sofa, a desk and a four-seat table add up to ${fixed(SET_SQFT, 1)} sq ft, or ${fixed((SET_SQFT / sq) * 100, 1)}% of the floor.`;
  return {
    kind: 'area',
    slug: cfg.slug,
    path: `/en/${cfg.slug}/`,
    title: text.title,
    description: text.description,
    h1: text.h1,
    answer: [first, second],
    caveat: 'Listings often count the kitchen and bath in that figure; see what the number leaves out below.',
    tables: [areaGlanceTable(cfg), footprintTable(sq)],
    plansHeading: `Two ${sq} sq ft studio shapes, drawn to scale`,
    plansIntro: `The same Queen bed, sofa, table and desk placed in a ${dims(drawnA.w, drawnA.l)} ft room and a ${dims(drawnB.w, drawnB.l)} ft room. Drawings and numbers use inches.`,
    plans: [
      studioFigure(sq, drawnA.w, drawnA.l, `${dims(drawnA.w, drawnA.l)} ft: ${drawnA.label.toLowerCase()}`, text.summaries[0]),
      studioFigure(sq, drawnB.w, drawnB.l, `${dims(drawnB.w, drawnB.l)} ft: ${drawnB.label.toLowerCase()}`, text.summaries[1]),
    ],
    limitsHeading: `What the ${sq} sq ft number leaves out`,
    limits: AREA_LIMITS(sq),
    faq: text.faq,
    relatedHeading: 'Nearby room sizes and tools',
    related: seriesLinks(sq),
    dateModified: '2026-11-12',
  };
}

const sides = (w: number, l: number): string => `${dims(w, l)} ft (${dimsM(w, l)} m)`;

const gapOf = (w: number, l: number): number => {
  const W = Math.round(w * 12);
  return Math.round(l * 12) - 80 - (Math.round((CORE_SQFT * 144) / W) + 12) - TABLE.depth;
};

function summaryFor(w: number, l: number): string {
  const route = gapOf(w, l);
  if (route < WALK_TARGET_IN) throw new Error(`${w} × ${l} ft drawing leaves only ${route} in`);
  return `The sofa and table sit under the kitchen and bath block, and the Queen and desk share the far wall. The walkway between the table and the bed is ${route} in wide, above the ${WALK_TARGET_IN} in target.`;
}

const exactShapes = (pairs: Array<[number, number, string]>, square?: number): Shape[] => [
  ...pairs.map(([w, l, label]) => ({ w, l, label })),
  ...(square ? [{ w: square, l: square, label: 'Square (sides rounded)', approx: true }] : []),
];

const A350: AreaConfig = {
  squareFeet: 350,
  slug: '350-sq-ft-studio-apartment-layout',
  shapes: exactShapes([[10, 35, 'Narrow and long'], [14, 25, 'Long'], [17.5, 20, 'Nearly square']], 18.71),
  drawn: [1, 2],
};
const A400: AreaConfig = {
  squareFeet: 400,
  slug: '400-sq-ft-studio-apartment-layout',
  shapes: exactShapes([[10, 40, 'Narrow and long'], [12.5, 32, 'Long'], [16, 25, 'Nearly square, longer one way'], [20, 20, 'Square']]),
  drawn: [2, 3],
};
const A450: AreaConfig = {
  squareFeet: 450,
  slug: '450-sq-ft-studio-apartment-layout',
  shapes: exactShapes([[10, 45, 'Narrow and long'], [15, 30, 'Long'], [18, 25, 'Nearly square']], 21.21),
  drawn: [1, 2],
};
const A500: AreaConfig = {
  squareFeet: 500,
  slug: '500-sq-ft-studio-apartment-layout',
  shapes: exactShapes([[10, 50, 'Narrow and long'], [16, 31.25, 'Long'], [20, 25, 'Nearly square']], 22.36),
  drawn: [1, 2],
};

const queensIn = (sq: number): string => trim(sq / QUEEN_SQFT, 1);
const setPct = (sq: number): string => fixed((SET_SQFT / sq) * 100, 1);

const area350 = areaPage(A350, {
  subject: 'A 350 sq ft room',
  title: 'How Big Is a 350 Sq Ft Room? Dimensions and Layouts',
  description: 'A 350 sq ft room is 32.5 m²: 14 × 25 ft, 17.5 × 20 ft or about 18.71 × 18.71 ft. See what fits and two to-scale studio layouts.',
  h1: 'How big is a 350 sq ft room?',
  summaries: [summaryFor(14, 25), summaryFor(17.5, 20)],
  faq: [
    { question: 'How big is a 350 sq ft room?', answer: `A 350 sq ft room is ${sqftM2(350)} m², for example ${sides(14, 25)} or ${sides(17.5, 20)}. As a square it is about ${dims(18.71, 18.71)} ft (${dimsM(18.71, 18.71)} m).` },
    { question: 'What is 350 sq ft in meters?', answer: `350 sq ft is ${sqftM2(350)} m² (350 × 0.092903). A 14 × 25 ft room measures ${dimsM(14, 25)} m.` },
    { question: 'What are the length and width of a 350 square foot room?', answer: `Any pair that multiplies to 350: 10 × 35 ft, 14 × 25 ft, 17.5 × 20 ft, or about ${dims(18.71, 18.71)} ft if it is square. A 14 × 25 ft room has a perimeter of ${2 * (14 + 25)} ft.` },
    { question: 'Is 350 square feet big?', answer: `Compared with a 12 × 12 ft bedroom (144 sq ft), 350 sq ft is ${fixed(350 / 144, 1)} times as large; as a whole studio apartment it is compact. It equals ${queensIn(350)} Queen-bed footprints of floor.` },
    { question: 'Can a Queen bed fit in a 350 sq ft studio?', answer: `Yes, in any shape above: even the narrowest, 10 ft (120 in) wide, leaves 120 − 60 = 60 in beside a lengthwise Queen. A Queen takes ${fixed(QUEEN_SQFT, 1)} sq ft, ${fixed((QUEEN_SQFT / 350) * 100, 1)}% of 350.` },
    { question: 'What is a good 350 sq ft room layout?', answer: `In the drawings, a ${dims(14, 25)} ft room keeps ${gapOf(14, 25)} in between the table and the bed, and a ${dims(17.5, 20)} ft room keeps ${gapOf(17.5, 20)} in. Both clear the 30 in walking target.` },
  ],
});

const area400 = areaPage(A400, {
  subject: 'A 400 square foot apartment',
  title: 'How Big Is a 400 Square Foot Apartment? Sizes and Layouts',
  description: 'A 400 square foot apartment is 37.2 m²: 16 × 25 ft, 20 × 20 ft or 12.5 × 32 ft. See what fits and two to-scale studio layouts.',
  h1: 'How big is a 400 square foot apartment?',
  summaries: [summaryFor(16, 25), summaryFor(20, 20)],
  faq: [
    { question: 'How big is a 400 square foot apartment?', answer: `A 400 square foot apartment is ${sqftM2(400)} m² of floor, for example ${sides(16, 25)} or ${sides(20, 20)}. It is ${queensIn(400)} Queen-bed footprints (60 × 80 in = ${fixed(QUEEN_SQFT, 1)} sq ft each).` },
    { question: 'What are the dimensions of a 400 sq ft room?', answer: `Any width and length that multiply to 400: 10 × 40 ft, 12.5 × 32 ft, 16 × 25 ft or 20 × 20 ft. A 20 × 20 ft square has a perimeter of ${2 * (20 + 20)} ft (${fixed(2 * (20 + 20) * FT_TO_M, 2)} m).` },
    { question: 'What is 400 sq ft in square meters?', answer: `400 sq ft is ${sqftM2(400)} m² (400 × 0.092903). A 16 × 25 ft room measures ${dimsM(16, 25)} m.` },
    { question: 'Is 400 square feet enough for a studio with a Queen bed and a sofa?', answer: `By floor area, yes: a Queen, ${SOFA.width} in sofa, desk and four-seat table take ${fixed(SET_SQFT, 1)} sq ft, ${setPct(400)}% of 400. In the ${dims(20, 20)} ft drawing that leaves ${gapOf(20, 20)} in between the table and the bed.` },
    { question: 'How much bigger is a 400 sq ft studio than a 350 sq ft one?', answer: `400 − 350 = 50 sq ft more (${sqftM2(50)} m²), which is ${fixed((50 / 350) * 100, 1)}% larger. The same furniture set takes ${setPct(350)}% of 350 sq ft but ${setPct(400)}% of 400.` },
  ],
});

const area450 = areaPage(A450, {
  subject: 'A 450 sq ft room',
  title: '450 Sq Ft Room Size and Studio Apartment Layout',
  description: 'A 450 sq ft room is 41.8 m²: 15 × 30 ft, 18 × 25 ft or about 21.21 × 21.21 ft. See its length and width and two to-scale studio layouts.',
  h1: 'How big is a 450 sq ft room? Size and studio layout',
  summaries: [summaryFor(15, 30), summaryFor(18, 25)],
  faq: [
    { question: 'What size is a 450 sq ft room?', answer: `A 450 sq ft room is ${sqftM2(450)} m², for example ${sides(15, 30)} or ${sides(18, 25)}. As a square it is about ${dims(21.21, 21.21)} ft (${dimsM(21.21, 21.21)} m).` },
    { question: 'What are the length and width of a 450 sq ft room?', answer: `Any pair that multiplies to 450: 10 × 45 ft, 15 × 30 ft, 18 × 25 ft, or about ${dims(21.21, 21.21)} ft square. A 15 × 30 ft room has a perimeter of ${2 * (15 + 30)} ft (${fixed(2 * (15 + 30) * FT_TO_M, 2)} m).` },
    { question: 'What does a 450 sq ft studio apartment layout look like?', answer: `In the drawings, a ${dims(15, 30)} ft room keeps ${gapOf(15, 30)} in between the table and the bed, and an ${dims(18, 25)} ft room keeps ${gapOf(18, 25)} in. Both reserve about ${CORE_SQFT} sq ft for a kitchen and bath.` },
    { question: 'How many square meters is 450 sq ft?', answer: `450 sq ft is ${sqftM2(450)} m² (450 × 0.092903).` },
    { question: 'Can a 450 sq ft studio fit a Queen bed, sofa, desk and table?', answer: `By floor area, yes: together they take ${fixed(SET_SQFT, 1)} sq ft, ${setPct(450)}% of 450, and 450 sq ft is ${queensIn(450)} Queen-bed footprints. Both drawn rooms fit all four with a walkway of at least ${Math.min(gapOf(15, 30), gapOf(18, 25))} in between the table and the bed.` },
  ],
});

const area500 = areaPage(A500, {
  subject: 'A 500 sq ft apartment',
  title: '500 Sq Ft Apartment Layout: Size and How to Furnish It',
  description: 'A 500 sq ft apartment is 46.5 m²: 20 × 25 ft, 16 × 31.25 ft or about 22.36 × 22.36 ft. See what fits and how to furnish it, drawn to scale.',
  h1: '500 sq ft apartment layout: size and how to furnish it',
  summaries: [summaryFor(16, 31.25), summaryFor(20, 25)],
  faq: [
    { question: 'How big is a 500 sq ft apartment?', answer: `A 500 sq ft apartment is ${sqftM2(500)} m², for example ${sides(20, 25)} or ${sides(16, 31.25)}. As a square it is about ${dims(22.36, 22.36)} ft (${dimsM(22.36, 22.36)} m).` },
    { question: 'What is a good 500 sq ft apartment layout?', answer: `Put the kitchen and bath on one wall, the bed on the far wall and the sofa and table between. In the ${dims(20, 25)} ft drawing that leaves ${gapOf(20, 25)} in between the table and the bed; in the ${dims(16, 31.25)} ft drawing, ${gapOf(16, 31.25)} in.` },
    { question: 'How do I furnish a 500 sq ft studio?', answer: `Place the bed first (${fixed(QUEEN_SQFT, 1)} sq ft), then the sofa (${fixed(sqftOfIn(SOFA.width, SOFA.depth), 1)}), table (${fixed(sqftOfIn(TABLE.width, TABLE.depth), 1)}) and desk (${fixed(sqftOfIn(DESK.width, DESK.depth), 1)}); together ${fixed(SET_SQFT, 1)} sq ft, ${setPct(500)}% of 500. The rest is walkway and storage.` },
    { question: 'What are the dimensions of a 500 sq ft room?', answer: `Any width and length that multiply to 500: 10 × 50 ft, 16 × 31.25 ft, 20 × 25 ft, or about ${dims(22.36, 22.36)} ft if square. A 20 × 25 ft room has a perimeter of ${2 * (20 + 25)} ft.` },
    { question: 'How many square meters is 500 sq ft?', answer: `500 sq ft is ${sqftM2(500)} m² (500 × 0.092903), which is ${queensIn(500)} Queen-bed footprints of floor.` },
  ],
});

// ---------------------------------------------------------------- bedroom pages

interface BedroomConfig {
  slug: string;
  wFt: number;
  lFt: number;
}

const verdictFor = (left: number): Verdict => (left >= WALK_TARGET_IN ? 'Fits' : left >= 0 ? 'Tight' : 'Does not fit');

function bedVerdict(W: number, L: number, bed: BedName): { verdict: Verdict; side: number; foot: number; both: boolean } {
  const { width, length } = SIZES[bed];
  const side = W - width;
  const foot = L - length;
  const physical = side >= 0 && foot >= 0;
  const verdict: Verdict = !physical ? 'Does not fit' : side >= WALK_TARGET_IN && foot >= WALK_TARGET_IN ? 'Fits' : 'Tight';
  return { verdict, side, foot, both: side >= 2 * WALK_TARGET_IN };
}

function bedTable(cfg: BedroomConfig): TableData {
  const W = cfg.wFt * 12;
  const L = cfg.lFt * 12;
  const beds = Object.keys(SIZES) as BedName[];
  return {
    id: 'what-fits',
    heading: `Which bed fits in ${an(cfg.wFt)} ${cfg.wFt}x${cfg.lFt} room?`,
    intro: `Planning target used here: ${WALK_TARGET_IN} in of clear floor beside the bed on at least one side, and ${WALK_TARGET_IN} in at the foot. It is a planning target, not a building code. Bed lengthwise, headboard on ${an(cfg.wFt)} ${cfg.wFt} ft wall, mattress sizes only. "Fits" meets both; "Tight" fits the mattress but leaves under ${WALK_TARGET_IN} in somewhere; "Does not fit" is larger than the room.`,
    columns: ['Bed', 'Mattress (in)', `Beside the bed (${W} − width)`, `At the foot (${L} − length)`, `${WALK_TARGET_IN} in on both sides?`, 'Verdict'],
    rows: beds.map((bed) => {
      const { width, length } = SIZES[bed];
      const { verdict, side, foot, both } = bedVerdict(W, L, bed);
      return {
        key: bed,
        cells: [
          { text: bed },
          { text: `${width} × ${length}` },
          { text: side >= 0 ? `${side} in (${trim(side / 2, 1)} each side if centered)` : `${side} in` },
          { text: `${foot} in` },
          { text: both ? 'Yes' : 'No' },
          { text: verdict, verdict },
        ],
      };
    }),
    note: 'Twin XL (38 × 80 in) is not listed; it leaves the same side space as a Twin and 5 in less at the foot.',
  };
}

function furnitureTable(cfg: BedroomConfig): TableData {
  const W = cfg.wFt * 12;
  const L = cfg.lFt * 12;
  const side = W - 60;
  const foot = L - 80;
  const rows: Array<[string, string, string, string, number]> = [
    ['nightstand', 'Nightstand', `${NIGHTSTAND.width} × ${NIGHTSTAND.depth} in, against the headboard on the open side`, `${side} − ${NIGHTSTAND.width}`, side - NIGHTSTAND.width],
    ['dresser-side', 'Dresser beside the bed', `${DRESSER.width} × ${DRESSER.depth} in, along the open side`, `${side} − ${DRESSER.depth}`, side - DRESSER.depth],
    ['dresser-foot', 'Dresser at the foot', `${DRESSER.width} × ${DRESSER.depth} in, against the foot wall`, `${foot} − ${DRESSER.depth}`, foot - DRESSER.depth],
    ['desk-foot', 'Desk at the foot', `${DESK.width} × ${DESK.depth} in, against the foot wall`, `${foot} − ${DESK.depth}`, foot - DESK.depth],
  ];
  return {
    id: 'furniture',
    heading: `What furniture fits around a Queen in ${cfg.wFt}x${cfg.lFt}`,
    intro: `Queen lengthwise, pushed to one wall: ${side} in of spare width (${W} − 60) and ${foot} in at the foot (${L} − 80). Each row subtracts the piece's depth from that space and judges what is left against the ${WALK_TARGET_IN} in target.`,
    columns: ['Piece', 'Example size and place', 'Space left', 'Verdict'],
    rows: rows.map(([key, name, where, calc, left]) => {
      const verdict: Verdict = key === 'desk-foot' ? (left >= WALK_TARGET_IN ? 'Fits' : 'Does not fit') : verdictFor(left);
      return { key, cells: [{ text: name }, { text: where }, { text: `${calc} = ${left} in` }, { text: verdict, verdict }] };
    }),
    note: 'A desk is judged "Fits" or "Does not fit" only: its chair pulls out into the space left, and under 30 in the chair blocks the way. Other pieces are "Tight" when they fit but leave under 30 in.',
  };
}

const ROOMS: Array<{ w: number; l: number; href: string; name: string; anchor: string }> = [
  { w: 8, l: 10, href: '/en/8x10-bedroom-layout/', name: '8x10 bedroom layout', anchor: '8x10 bedroom layout: queen bed fit and floor plans' },
  { w: 9, l: 10, href: '/en/9x10-bedroom-layout/', name: '9x10 bedroom layout', anchor: '9x10 bedroom layout: what furniture fits' },
  { w: 10, l: 10, href: '/en/layout-guides/10x10-bedroom-layout/', name: '10x10 bedroom layout guide', anchor: '10×10 bedroom layout ideas with a queen bed' },
  { w: 10, l: 12, href: '/en/layout-guides/10x12-bedroom-queen-desk/', name: '10x12 bedroom layout guide', anchor: '10×12 bedroom layout with a queen bed and desk' },
  { w: 11, l: 12, href: '/en/11x12-bedroom-layout/', name: '11x12 bedroom layout', anchor: '11x12 bedroom layout with a king or queen bed' },
  { w: 12, l: 12, href: '/en/12x12-bedroom-layout/', name: '12x12 bedroom layout', anchor: '12x12 bedroom layout: bed, desk and dresser' },
];

function roomsTable(cfg: BedroomConfig): TableData {
  return {
    id: 'glance',
    heading: `${cfg.wFt}x${cfg.lFt} bedroom dimensions at a glance, with nearby sizes`,
    intro: `A ${cfg.wFt}x${cfg.lFt} room is ${cfg.wFt * 12} × ${cfg.lFt * 12} in. The last column shows what a 60 × 80 in Queen leaves beside it and at the foot in each size.`,
    columns: ['Room', 'Sides (ft)', 'Sides (m)', 'Perimeter', 'Area (sq ft)', 'Area (m²)', 'Queen: beside / foot'],
    rows: ROOMS.map((room) => {
      const area = room.w * room.l;
      const perimeter = 2 * (room.w + room.l);
      const current = room.w === cfg.wFt && room.l === cfg.lFt;
      return {
        key: `${room.w}x${room.l}`,
        cells: [
          current ? { text: `${room.w}x${room.l} (this page)` } : { text: room.name, href: room.href },
          { text: `${dims(room.w, room.l)} ft` },
          { text: `${dimsM(room.w, room.l)} m` },
          { text: `${perimeter} ft (${fixed(perimeter * FT_TO_M, 2)} m)` },
          { text: `${area} sq ft` },
          { text: `${sqftM2(area)} m²` },
          { text: `${room.w * 12 - 60} in / ${room.l * 12 - 80} in` },
        ],
      };
    }),
    note: 'Perimeter is 2 × (width + length). Metric sides are feet × 0.3048; area in m² is sq ft × 0.092903.',
  };
}

const bedFigure = (
  title: string,
  W: number,
  L: number,
  items: DiagramItem[],
  heading: string,
  summary: string,
  facts: (plan: DiagramPlan) => PlanFact[],
): PlanFigure => {
  const plan: DiagramPlan = {
    title,
    roomWidth: W,
    roomLength: L,
    unit: 'in',
    dimensionLabel: `${W} × ${L} in`,
    hideDimensionText: true,
    items,
  };
  return { plan, heading, summary, facts: [{ text: `Room: ${W} × ${L} in (${W / 12} × ${L / 12} ft)` }, ...facts(plan)], legend: legendFor(plan) };
};

const ns = (x: number, y: number): DiagramItem => box('NS', x, y, NIGHTSTAND.width, NIGHTSTAND.depth, 'feature');

function figures8x10(): PlanFigure[] {
  const W = 96;
  const L = 120;
  return [
    bedFigure('8x10 bedroom, Queen lengthwise', W, L, [
      box('Queen', 0, 0, 60, 80, 'bed'),
      ns(60, 0),
      box(`${W - 60} in`, 60, 16, W - 60, 64, 'route'),
      box(`${L - 80} in`, 0, 80, W, L - 80, 'route'),
    ], 'Queen lengthwise, against one wall', 'Headboard on an 8 ft wall, bed against the left wall. One open side, and room at the foot to walk across. No space for a dresser in this orientation.', (plan) => [
      fact(plan, 'Queen', 'wall-right', 'Beside the bed'),
      fact(plan, 'NS', 'wall-right', 'Past the nightstand, at the head'),
      fact(plan, 'Queen', 'wall-bottom', 'At the foot'),
    ]),
    bedFigure('8x10 bedroom, Queen across the room', W, L, [
      box('Queen', 0, 0, 80, 60, 'bed'),
      box('16 in', 80, 0, 16, 60, 'route'),
      ns(0, 60),
      box('36 in', 16, 60, 80, 36, 'route'),
      box('Dresser', 12, 102, 36, 18, 'storage'),
      box('Desk', 48, 96, 48, 24, 'work'),
    ], 'Queen across the room, headboard on the 10 ft wall', 'The Queen lies along the 8 ft dimension, so the 10 ft wall gives a 60 in strip for a nightstand, dresser and desk. The foot end is a 16 in dead end.', (plan) => [
      fact(plan, 'Queen', 'Desk', 'Bed to desk'),
      fact(plan, 'Queen', 'Dresser', 'Bed to dresser'),
      fact(plan, 'Queen', 'wall-right', 'At the foot end of the bed'),
    ]),
  ];
}

function figures9x10(): PlanFigure[] {
  const W = 108;
  const L = 120;
  return [
    bedFigure('9x10 bedroom, Queen and dresser side by side', W, L, [
      box('Queen', 0, 0, 60, 80, 'bed'),
      ns(60, 0),
      box('30 in', 60, 16, 30, 64, 'route'),
      box('DR', 90, 40, DRESSER.depth, DRESSER.width, 'storage'),
      box(`${L - 80} in`, 0, 80, W, L - 80, 'route'),
    ], 'Queen lengthwise with a dresser along the open side', 'Headboard on a 9 ft wall. The 36 × 18 in dresser stands against the right wall and leaves exactly the 30 in target; a desk does not fit in this plan.', (plan) => [
      fact(plan, 'Queen', 'DR', 'Bed to dresser'),
      fact(plan, 'Queen', 'wall-right', 'Bed to wall (spare width)'),
      fact(plan, 'Queen', 'wall-bottom', 'At the foot'),
    ]),
    bedFigure('9x10 bedroom, Queen across the room', W, L, [
      box('Queen', 0, 0, 80, 60, 'bed'),
      box('28 in', 80, 0, 28, 60, 'route'),
      ns(0, 60),
      box('36 in', 16, 60, 92, 36, 'route'),
      box('Dresser', 24, 102, 36, 18, 'storage'),
      box('Desk', 60, 96, 48, 24, 'work'),
    ], 'Queen across the room, headboard on the 10 ft wall', 'Turning the bed gives a 60 in strip along the bottom wall: room for a nightstand, a dresser and a desk, with a 28 in dead end at the foot of the bed.', (plan) => [
      fact(plan, 'Queen', 'Desk', 'Bed to desk'),
      fact(plan, 'Queen', 'Dresser', 'Bed to dresser'),
      fact(plan, 'Queen', 'wall-right', 'At the foot end of the bed'),
    ]),
  ];
}

function figures11x12(): PlanFigure[] {
  const W = 132;
  const L = 144;
  return [
    bedFigure('11x12 bedroom, Queen centered', W, L, [
      box('Queen', 36, 0, 60, 80, 'bed'),
      ns(20, 0),
      ns(96, 0),
      box('36 in', 0, 16, 36, 64, 'route'),
      box('36 in', 96, 16, 36, 64, 'route'),
      box('40 in', 0, 80, W, 40, 'route'),
      box('Dresser', 40, 126, 36, 18, 'storage'),
      box('Desk', 80, 120, 48, 24, 'work'),
    ], 'Queen centered, desk and dresser on the foot wall', 'Headboard on an 11 ft wall with two nightstands. The foot wall holds the dresser and desk, and the desk chair pulls out into the 40 in left.', (plan) => [
      fact(plan, 'Queen', 'wall-left', 'Left of the bed'),
      fact(plan, 'Queen', 'wall-right', 'Right of the bed'),
      fact(plan, 'Queen', 'Desk', 'Bed to desk'),
      fact(plan, 'Queen', 'Dresser', 'Bed to dresser'),
    ]),
    bedFigure('11x12 bedroom, King against one wall', W, L, [
      box('King', 0, 0, 76, 80, 'bed'),
      ns(76, 0),
      box('56 in', 76, 16, 56, 64, 'route'),
      box('40 in', 0, 80, W, 40, 'route'),
      box('Dresser', 0, 126, 36, 18, 'storage'),
      box('Desk', 44, 120, 48, 24, 'work'),
    ], 'King against one wall, desk and dresser on the foot wall', 'A 76 × 80 in King leaves 56 in on one side. The foot wall holds the same dresser and desk, so the King costs the room only its extra 16 in of width.', (plan) => [
      fact(plan, 'King', 'wall-right', 'Beside the bed'),
      fact(plan, 'NS', 'wall-right', 'Past the nightstand, at the head'),
      fact(plan, 'King', 'Desk', 'Bed to desk'),
      fact(plan, 'King', 'Dresser', 'Bed to dresser'),
    ]),
  ];
}

function figures12x12(): PlanFigure[] {
  const W = 144;
  const L = 144;
  return [
    bedFigure('12x12 bedroom, Queen centered', W, L, [
      box('Queen', 42, 0, 60, 80, 'bed'),
      ns(26, 0),
      ns(102, 0),
      box('42 in', 0, 16, 42, 64, 'route'),
      box('42 in', 102, 16, 42, 64, 'route'),
      box('40 in', 0, 80, W, 40, 'route'),
      box('Dresser', 48, 126, 36, 18, 'storage'),
      box('Desk', 88, 120, 48, 24, 'work'),
    ], 'Queen centered, desk and dresser on the foot wall', 'Headboard on a 12 ft wall with two nightstands. Both sides keep more than the 30 in target, and the foot wall holds the dresser and desk.', (plan) => [
      fact(plan, 'Queen', 'wall-left', 'Left of the bed'),
      fact(plan, 'Queen', 'wall-right', 'Right of the bed'),
      fact(plan, 'Queen', 'Desk', 'Bed to desk'),
      fact(plan, 'Queen', 'Dresser', 'Bed to dresser'),
    ]),
    bedFigure('12x12 bedroom, King centered', W, L, [
      box('King', 34, 0, 76, 80, 'bed'),
      ns(18, 0),
      ns(110, 0),
      box('34 in', 0, 16, 34, 64, 'route'),
      box('34 in', 110, 16, 34, 64, 'route'),
      box('40 in', 0, 80, W, 40, 'route'),
      box('Dresser', 48, 126, 36, 18, 'storage'),
      box('Desk', 88, 120, 48, 24, 'work'),
    ], 'King centered, same dresser and desk', 'A King on the same wall leaves 34 in each side, still above the 30 in target, with the foot-wall furniture unchanged.', (plan) => [
      fact(plan, 'King', 'wall-left', 'Left of the bed'),
      fact(plan, 'King', 'wall-right', 'Right of the bed'),
      fact(plan, 'King', 'Desk', 'Bed to desk'),
      fact(plan, 'King', 'Dresser', 'Bed to dresser'),
    ]),
  ];
}

const BEDROOM_LIMITS = (cfg: BedroomConfig): string[] => [
  `These numbers treat the room as a clear ${cfg.wFt * 12} × ${cfg.lFt * 12} in rectangle and the bed as the bare mattress. A frame and headboard add inches to the bed, and a door swing, closet, radiator or baseboard takes floor that the arithmetic counts as free.`,
  'Measure wall to wall at floor level and the outside of the frame before you buy, and mark the door and closet on a plan; the RoomFeng planner lets you enter your own measurements.',
];

function bedroomRelated(cfg: BedroomConfig): AnswerPageData['related'] {
  const order = ROOMS;
  const index = order.findIndex((room) => room.w === cfg.wFt && room.l === cfg.lFt);
  const others = order.filter((_, i) => i !== index).sort((a, b) => Math.abs(a.w * a.l - cfg.wFt * cfg.lFt) - Math.abs(b.w * b.l - cfg.wFt * cfg.lFt));
  return [
    ...others.map((room) => ({
      href: room.href,
      title: room.anchor,
      note: `${room.w * room.l} sq ft (${sqftM2(room.w * room.l)} m²); a Queen leaves ${room.w * 12 - 60} in beside it and ${room.l * 12 - 80} in at the foot.`,
    })),
    { href: '/en/bed-room-fit-calculator/', title: 'Bed and room fit calculator', note: 'Enter any bed and room size to get the clearances.' },
    { href: '/en/room-layout-planner/', title: 'Draw your bedroom in the RoomFeng planner', note: 'Enter your measured walls, door and furniture.' },
  ];
}

function bedroomPage(cfg: BedroomConfig, text: {
  title: string; description: string; h1: string; answer: [string, string]; caveat: string; faq: FaqItem[];
}, plans: PlanFigure[]): AnswerPageData {
  return {
    kind: 'bedroom',
    slug: cfg.slug,
    path: `/en/${cfg.slug}/`,
    title: text.title,
    description: text.description,
    h1: text.h1,
    answer: text.answer,
    caveat: text.caveat,
    tables: [bedTable(cfg), furnitureTable(cfg), roomsTable(cfg)],
    plansHeading: `${cfg.wFt}x${cfg.lFt} bedroom layouts drawn to scale`,
    plansIntro: `Two arrangements in a ${cfg.wFt * 12} × ${cfg.lFt * 12} in room, drawn from the mattress and furniture sizes above. The numbers under each drawing are measured from the drawing.`,
    plans,
    limitsHeading: 'What these numbers leave out',
    limits: BEDROOM_LIMITS(cfg),
    faq: text.faq,
    relatedHeading: 'Other bedroom sizes and tools',
    related: bedroomRelated(cfg),
    dateModified: '2026-11-12',
  };
}

const B8: BedroomConfig = { slug: '8x10-bedroom-layout', wFt: 8, lFt: 10 };
const B9: BedroomConfig = { slug: '9x10-bedroom-layout', wFt: 9, lFt: 10 };
const B11: BedroomConfig = { slug: '11x12-bedroom-layout', wFt: 11, lFt: 12 };
const B12: BedroomConfig = { slug: '12x12-bedroom-layout', wFt: 12, lFt: 12 };

const bed = (W: number, L: number, name: BedName) => bedVerdict(W, L, name);
const roomSize = (w: number, l: number): string => `${an(w) === 'an' ? 'An' : 'A'} ${w}x${l} room is ${w} × ${l} ft (${dimsM(w, l)} m), an area of ${w * l} sq ft (${sqftM2(w * l)} m²)`;

const bedroom8 = bedroomPage(B8, {
  title: '8x10 Bedroom Layout With a Queen Bed: Does It Fit?',
  description: 'Yes, a queen bed fits in an 8x10 room: 96 − 60 = 36 in beside the bed and 120 − 80 = 40 in at the foot. See what else fits, with floor plans.',
  h1: 'Can a queen bed fit in an 8x10 room?',
  answer: [
    'Yes, a queen bed fits in an 8x10 room (96 × 120 in): a 60 × 80 in queen mattress leaves 96 − 60 = 36 in beside the bed and 120 − 80 = 40 in at the foot.',
    `Both are above the ${WALK_TARGET_IN} in planning target, so the bed works pushed against one wall with one open side, but a dresser beside it would leave only 96 − 60 − 18 = 18 in.`,
  ],
  caveat: 'These use the mattress size; a bed frame or headboard is usually larger and takes inches from each number.',
  faq: [
    { question: 'Can a queen bed fit in an 8x10 room?', answer: 'Yes. A 60 × 80 in queen leaves 96 − 60 = 36 in beside it and 120 − 80 = 40 in at the foot, both above the 30 in planning target.' },
    { question: 'What size bed fits in an 8x10 room?', answer: `Twin, full and queen all meet the 30 in target (side space ${bed(96, 120, 'Twin').side}, ${bed(96, 120, 'Full').side} and ${bed(96, 120, 'Queen').side} in). A king (96 − 76 = 20 in beside it) and a California king (96 − 72 = 24 in) fit the room but are tight.` },
    { question: 'How do you arrange an 8x10 bedroom with a queen bed?', answer: 'Either lengthwise against one wall, with a 36 in aisle and a nightstand, or across the room with the headboard on the 10 ft wall, which leaves a 60 in strip for a dresser and a desk with 36 in left in front of the desk.' },
    { question: 'Can a king bed fit in an 8x10 room?', answer: 'The 76 × 80 in mattress fits, but it leaves 96 − 76 = 20 in beside it, under the 30 in target, and 120 − 80 = 40 in at the foot.' },
    { question: 'How big is an 8x10 room in meters?', answer: `${roomSize(8, 10)}.` },
  ],
}, figures8x10());

const bedroom9 = bedroomPage(B9, {
  title: 'What Bedroom Furniture Fits in a 9x10 Room? Sizes and Plans',
  description: 'In a 9x10 room a queen bed, nightstand and 36 × 18 in dresser fit with a 30 in aisle: 108 − 60 − 18 = 30. Desk and king bed options, with floor plans.',
  h1: 'What bedroom furniture fits in a 9x10 room?',
  answer: [
    'In a 9x10 room (108 × 120 in), a queen bed, a nightstand and a 36 × 18 in dresser fit together: the queen leaves 108 − 60 = 48 in beside it, and the dresser along that side leaves 108 − 60 − 18 = 30 in to walk.',
    'A 48 × 24 in desk does not fit at the foot of a lengthwise queen (120 − 80 − 24 = 16 in left, under the 30 in target), but it does if the bed turns across the room, which leaves 120 − 60 − 24 = 36 in in front of the desk.',
  ],
  caveat: 'These use the mattress size; the bed frame and the depth of an open dresser drawer both come out of the 30 in.',
  faq: [
    { question: 'What bedroom furniture fits in a 9x10 room?', answer: 'A queen bed, a 16 × 16 in nightstand and a 36 × 18 in dresser, with 30 in left to walk beside the bed (108 − 60 − 18 = 30). A desk fits only if the bed turns across the room (120 − 60 − 24 = 36 in left).' },
    { question: 'Can a queen bed fit in a 9x10 room?', answer: 'Yes. A 60 × 80 in queen leaves 108 − 60 = 48 in beside it and 120 − 80 = 40 in at the foot.' },
    { question: 'Does a king bed fit in a 9x10 room?', answer: 'Physically yes: a 76 × 80 in king leaves 108 − 76 = 32 in beside it and 120 − 80 = 40 in at the foot, so one side clears the 30 in target but there is no space for a dresser beside it.' },
    { question: 'How much space do I need around a bed?', answer: `This page plans for ${WALK_TARGET_IN} in beside the bed on at least one side and ${WALK_TARGET_IN} in at the foot; the queen in a 9x10 room leaves 48 in and 40 in. That is a planning target, not a building code.` },
    { question: 'How big is a 9x10 room in meters?', answer: `${roomSize(9, 10)}.` },
  ],
}, figures9x10());

const bedroom11 = bedroomPage(B11, {
  title: '11x12 Bedroom Layout With a King or Queen Bed (+ Desk)',
  description: 'An 11x12 room fits a queen or king bed plus a dresser and desk: 132 − 76 = 56 in beside a king and 144 − 80 − 24 = 40 in left at the foot.',
  h1: 'What fits in an 11x12 bedroom? Queen or king bed, desk and dresser',
  answer: [
    'Yes: an 11x12 room (132 × 144 in) fits a queen or a king bed with a dresser and a desk. A queen leaves 132 − 60 = 72 in beside it (36 in each side if centered) and 144 − 80 = 64 in at the foot, and a king leaves 132 − 76 = 56 in and the same 64 in.',
    'A 48 × 24 in desk and a 36 × 18 in dresser on the foot wall leave 144 − 80 − 24 = 40 in and 144 − 80 − 18 = 46 in, both above the 30 in planning target.',
  ],
  caveat: 'These use mattress sizes; a frame or headboard adds to the bed and takes the same inches from the room.',
  faq: [
    { question: 'Does a king bed fit in an 11x12 room?', answer: 'Yes. A 76 × 80 in king leaves 132 − 76 = 56 in beside it and 144 − 80 = 64 in at the foot; centered it leaves 28 in each side, so push it to one wall if you want a 30 in aisle.' },
    { question: 'Can I fit a queen bed and a desk in an 11x12 room?', answer: 'Yes. With the queen lengthwise, a 48 × 24 in desk on the foot wall leaves 144 − 80 − 24 = 40 in for the chair and walking.' },
    { question: 'Can two nightstands fit beside a queen in 11x12?', answer: 'Yes. Centered, a queen leaves 36 in each side, and a 16 in nightstand on each side leaves 36 − 16 = 20 in beside it at the head only.' },
    { question: 'How big is an 11x12 room in meters?', answer: `${roomSize(11, 12)}.` },
  ],
}, figures11x12());

const bedroom12 = bedroomPage(B12, {
  title: '12x12 Bedroom Layout (12 by 12 ft): Bed, Desk and Dresser',
  description: 'A 12 by 12 ft bedroom fits a king bed with 34 in on each side (144 − 76 = 68) plus a dresser and desk on the foot wall. See floor plans.',
  h1: 'What fits in a 12x12 bedroom? Bed, desk and dresser',
  answer: [
    'Yes: a 12x12 room (144 × 144 in, also written 12 by 12 ft) fits a queen or a king with room to spare: a queen leaves 144 − 60 = 84 in beside it (42 in each side if centered), a king leaves 144 − 76 = 68 in (34 in each side), and both leave 144 − 80 = 64 in at the foot.',
    'That is enough for two nightstands, a 36 × 18 in dresser and a 48 × 24 in desk on the foot wall, which leave 144 − 80 − 18 = 46 in and 144 − 80 − 24 = 40 in, above the 30 in planning target.',
  ],
  caveat: 'These use mattress sizes; a frame or headboard adds to the bed and takes the same inches from the room.',
  faq: [
    { question: 'Is a 12x12 bedroom big enough for a king bed?', answer: 'Yes. A 76 × 80 in king leaves 144 − 76 = 68 in beside it (34 in each side if centered) and 144 − 80 = 64 in at the foot.' },
    { question: 'What is a good 12 by 12 bedroom layout?', answer: 'Headboard on one wall, bed centered with a nightstand each side, and the dresser and desk on the opposite wall, which leaves 40 in in front of the desk and 46 in in front of the dresser.' },
    { question: 'Can a California king fit in a 12x12 room?', answer: `Yes. A 72 × 84 in California king leaves 144 − 72 = ${bed(144, 144, 'California King').side} in beside it and 144 − 84 = ${bed(144, 144, 'California King').foot} in at the foot.` },
    { question: 'How big is a 12x12 room in square feet and meters?', answer: `${roomSize(12, 12)}.` },
  ],
}, figures12x12());

export const areaPages: AnswerPageData[] = [area350, area400, area450, area500];
export const bedroomAnswerPages: AnswerPageData[] = [bedroom8, bedroom9, bedroom11, bedroom12];
export const answerPages: AnswerPageData[] = [...areaPages, ...bedroomAnswerPages];

export function getAnswerPage(slug: string): AnswerPageData {
  const page = answerPages.find((item) => item.slug === slug);
  if (!page) throw new Error(`Missing answer page data for ${slug}`);
  return page;
}
