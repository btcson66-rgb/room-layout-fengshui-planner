import type { DiagramPlan } from './renderer';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface GuidePageData {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  quickAnswer: string;
  assumptions: string[];
  math: string[];
  plans: Array<DiagramPlan & { description: string }>;
  compatibility: Array<{ item: string; guidance: string }>;
  mistakes: string[];
  measureNext: string[];
  faq: FaqItem[];
  related: Array<{ href: string; title: string }>;
  ctaHref?: string;
  ctaLabel?: string;
  squareFeet?: number;
  footprintNote?: string;
}

export interface FengShuiPageData {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  quickAnswer: string;
  measurable: string[];
  traditional: string[];
  steps: string[];
  mistakes: string[];
  faq: FaqItem[];
  related: Array<{ href: string; title: string }>;
}

export interface StudioPageData extends GuidePageData {
  squareFeet: number;
  footprintNote: string;
}

export interface BedRow {
  name: string;
  dimensions: string;
  physicalFit: string;
  accessNote: string;
}

const mattressSizes = [
  ['Twin', 38, 75],
  ['Twin XL', 38, 80],
  ['Full', 54, 75],
  ['Queen', 60, 80],
  ['King', 76, 80],
  ['California King', 72, 84],
] as const;

function bestClearance(roomWidth: number, roomLength: number, bedWidth: number, bedLength: number): number {
  const orientations = [
    Math.min(roomWidth - bedWidth - 48, roomLength - bedLength - 30),
    Math.min(roomWidth - bedLength - 48, roomLength - bedWidth - 30),
  ];
  return Math.max(...orientations);
}

export function bedroomBedRows(roomWidth: number, roomLength: number): BedRow[] {
  return mattressSizes.map(([name, width, length]) => {
    const physical = (width <= roomWidth && length <= roomLength) || (length <= roomWidth && width <= roomLength);
    const spare = bestClearance(roomWidth, roomLength, width, length);
    const accessNote = spare >= 24
      ? 'Leaves a useful planning margin around the mattress under the stated targets.'
      : spare >= 0
        ? 'Physical mattress fit, but the two-side/foot access targets are tight.'
        : 'Physical mattress fit may still be possible, but those access targets do not fit; expect one-sided or highly constrained placement.';
    return {
      name,
      dimensions: `${width} × ${length} in mattress reference`,
      physicalFit: physical ? 'Yes, mattress rectangle' : 'No',
      accessNote,
    };
  });
}

function bedroomPlans(roomWidth: number, roomLength: number, labels: [string, string]): GuidePageData['plans'] {
  const deskWidth = roomWidth <= 100 ? 30 : 36;
  const dresserWidth = roomWidth <= 100 ? 30 : 36;
  const rightX = roomWidth - Math.max(deskWidth, dresserWidth) - 2;
  const secondDeskY = roomLength <= 120 ? 72 : 84;
  return [
    {
      title: labels[0],
      roomWidth,
      roomLength,
      unit: 'in',
      items: [
        { label: 'Queen', x: 0, y: 22, width: 60, height: 80, tone: 'bed' },
        { label: 'Desk', x: rightX, y: 4, width: deskWidth, height: 18, tone: 'work' },
        { label: 'Nightstand', x: rightX, y: 28, width: 14, height: 14, tone: 'feature' },
        { label: 'Dresser', x: rightX, y: roomLength - 23, width: dresserWidth, height: 18, tone: 'storage' },
      ],
      description: 'The Queen is placed lengthwise on one side so the opposite strip can hold a shallow desk and dresser. This protects a recognizable entry route but gives up generous two-sided bed access in the smallest room.',
    },
    {
      title: labels[1],
      roomWidth,
      roomLength,
      unit: 'in',
      items: [
        { label: 'Queen', x: 8, y: 4, width: 80, height: 60, tone: 'bed' },
        { label: 'Desk', x: roomWidth - 28, y: secondDeskY, width: 24, height: 36, tone: 'work' },
        { label: 'Dresser', x: 4, y: roomLength - 24, width: 30, height: 18, tone: 'storage' },
        { label: 'Open route', x: 36, y: 70, width: Math.max(12, roomWidth - 66), height: 14, tone: 'route' },
      ],
      description: 'The bed turns across the short end and the desk moves to a separate end zone. The open middle is easier to read, but chair pullback and closet-door operation must be checked against the real openings.',
    },
  ];
}

const bedroomSpecs: Array<Omit<GuidePageData, 'plans'> & { roomWidth: number; roomLength: number; planLabels: [string, string] }> = [
  {
    slug: '8x10-bedroom-layout',
    path: '/en/8x10-bedroom-layout/',
    title: '8×10 Bedroom Layout: What Fits With a Queen Bed?',
    description: 'Work through an 8×10 bedroom layout with real mattress dimensions, desk and dresser footprints, two floor-plan options, and honest clearance limits.',
    h1: '8×10 bedroom layout: fit the bed first, then protect the route',
    lead: 'An 8 × 10 ft bedroom is 96 × 120 in. A Queen mattress can fit on paper, but a bed frame, chair pullback, dresser doors, and closet access compete for the same narrow strips.',
    quickAnswer: 'Twin, Twin XL, Full, Queen, King, and California King mattress rectangles can all fit inside a 96 × 120 in rectangle in at least one orientation. Twin through Queen are the more workable starting points. A King or California King may be a physical fit while leaving little room for two-sided access, storage doors, or a desk.',
    assumptions: ['The room math treats 96 × 120 in as a clear interior rectangle; it does not include wall thickness, a built-in closet, a radiator, or a door swing.', 'The bed diagrams use a 60 × 80 in Queen mattress reference. A real frame is usually larger, so measure the outside frame before purchasing.', 'The comparison uses 24 in at each bed side and 30 in at the foot as planning targets, not legal or building-code minimums.'],
    math: ['Room: 8 × 10 ft = 96 × 120 in.', 'Queen mattress reference: 60 × 80 in.', 'A lengthwise Queen leaves 36 in across the room before side-access targets and 40 in beyond the mattress at the foot.', 'A 36 in desk placed across the remaining side strip leaves only 0 in beside a 60 in mattress in a 96 in room, so the desk must be shallower or moved to the end zone.'],
    compatibility: [
      { item: 'Bed', guidance: 'Start with the outside frame dimensions. A Queen can work, but the smallest clearances are usually on the bed sides rather than at the mattress itself.' },
      { item: 'Desk', guidance: 'A 24–30 in deep desk is easier than a full 36 in desk. Protect the chair pullback zone instead of measuring only the desktop.' },
      { item: 'Dresser', guidance: 'Use a shallow dresser or place it on the wall opposite the bed. Drawer travel can consume the route that looks empty in a top-down sketch.' },
      { item: 'Nightstand', guidance: 'One compact nightstand may be more realistic than two. Count its outside width, not just the tabletop.' },
      { item: 'Closet access', guidance: 'Keep the closet door arc or sliding-door reach outside the bed and dresser footprints. A technically empty corner may not be usable storage access.' },
    ],
    mistakes: ['Treating the mattress size as the bed-frame size.', 'Putting a full-depth desk beside the bed and forgetting where the chair goes.', 'Using the 96 × 120 in rectangle without drawing the entry door and closet opening.', 'Calling a one-sided bed route comfortable without testing the actual daily path.'],
    measureNext: ['Measure finished wall-to-wall dimensions at floor level.', 'Record the outside bed frame, desk depth plus chair pullback, dresser opening depth, closet opening, and door swing.', 'Transfer the measurements to the RoomFeng Room Planner and test the route before ordering.'],
    faq: [
      { question: 'Will a Queen bed fit in an 8×10 bedroom?', answer: 'A 60 × 80 in Queen mattress rectangle fits inside a 96 × 120 in room, but the frame and everyday access may be tight. Measure the outside frame and test the door, closet and chair zones before buying.' },
      { question: 'Is a King bed practical in an 8×10 bedroom?', answer: 'A 76 × 80 in King mattress can fit physically in the rectangle, but it leaves only 20 in across the width before furniture and access zones. It is a constrained layout starting point, not a promise of comfortable circulation.' },
      { question: 'How deep should a desk be in this room?', answer: 'A shallow 24–30 in desk is easier to place than a 36 in desk. The chair pullback and the route from the door matter as much as the desktop depth.' },
    ],
    related: [
      { href: '/en/9x10-bedroom-layout/', title: 'Compare a 9×10 bedroom layout' },
      { href: '/en/layout-guides/10x10-bedroom-layout/', title: 'Compare a 10×10 bedroom layout' },
      { href: '/en/room-size-layout-templates/', title: 'Room sizer and layout templates' },
      { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' },
    ],
    roomWidth: 96,
    roomLength: 120,
    planLabels: ['Bed-first side strip', 'End-zone work layout'],
  },
  {
    slug: '9x10-bedroom-layout',
    path: '/en/9x10-bedroom-layout/',
    title: '9×10 Bedroom Layout: Queen, Desk and Dresser Fit',
    description: 'Plan a 9×10 bedroom with real bed dimensions, desk and dresser clearance math, two distinct layouts, and a practical checklist before buying furniture.',
    h1: '9×10 bedroom layout: the extra foot changes the side route',
    lead: 'A 9 × 10 ft room gives you 108 × 120 in—12 in more width than an 8 × 10. That extra strip can change where a desk, dresser, or closet route works, but it does not remove the need to measure frames and door swings.',
    quickAnswer: 'Twin, Twin XL, Full, Queen, King, and California King mattress rectangles fit within 108 × 120 in in at least one orientation. A Queen is the most flexible couple-sized starting point. King and California King can fit physically, but the available side route becomes a deliberate tradeoff once the frame and storage are added.',
    assumptions: ['The clear rectangle is 108 × 120 in, with no allowance for wall thickness, radiators, door arcs, or built-in storage.', 'The diagrams show a Queen mattress reference, not a branded bed frame. Use the product outside dimensions for a purchase decision.', 'The side and foot access comparison uses 24 in at each side and 30 in at the foot as a planning target only.'],
    math: ['Room: 9 × 10 ft = 108 × 120 in.', 'Queen mattress reference: 60 × 80 in.', 'A lengthwise Queen leaves 48 in of raw width before subtracting any desk, dresser, or access zones.', 'A 30 in deep work surface beside a Queen leaves 18 in of raw width, so a chair cannot be assumed to pull back there without a different orientation.'],
    compatibility: [
      { item: 'Bed', guidance: 'A Queen has more breathing room than in an 8 × 10, but the frame can still turn a nominal 48 in strip into a narrow side route.' },
      { item: 'Desk', guidance: 'Place a 24 in desk at the foot or on a separate wall when chair pullback beside the bed would pinch the route.' },
      { item: 'Dresser', guidance: 'A 30–36 in wide dresser can fit in the side zone, but drawers need a clear opening area rather than a decorative gap.' },
      { item: 'Nightstand', guidance: 'One 16–18 in nightstand is easier to protect than two full tables. Consider a wall-mounted shelf only after checking the real use case.' },
      { item: 'Closet access', guidance: 'Keep the closet opening visible in the planner. The extra foot often belongs to the closet door, not to another furniture item.' },
    ],
    mistakes: ['Assuming the 12 in improvement means a full-depth desk can sit anywhere.', 'Measuring only the Queen mattress and not the headboard or frame.', 'Placing the dresser in front of the closet’s operating zone.', 'Comparing furniture footprints without preserving the route from the door.'],
    measureNext: ['Measure the room in both directions and note which wall holds the door.', 'Measure bed-frame outside dimensions, desk plus chair zone, dresser drawer extension, and closet access.', 'Try both orientations in the planner, then walk the tape outline before delivery.'],
    faq: [
      { question: 'Can a Queen bed and desk fit in a 9×10 bedroom?', answer: 'The Queen mattress fits physically. A desk can fit when its depth, chair pullback, and the bed frame are placed as separate footprints; the best arrangement depends on the door and closet positions.' },
      { question: 'Is a 9×10 room large enough for a King?', answer: 'A 76 × 80 in King mattress fits the rectangle, but the width left beside it is limited once frame and access dimensions are included. Treat it as a measurement exercise rather than a guaranteed comfortable layout.' },
      { question: 'Where should the dresser go?', answer: 'Keep it on a wall that does not share the bed’s main passage or the closet opening. A shallow dresser at the end of the room can be easier to operate than a deeper one beside the bed.' },
    ],
    related: [
      { href: '/en/8x10-bedroom-layout/', title: 'Compare an 8×10 bedroom layout' },
      { href: '/en/layout-guides/10x10-bedroom-layout/', title: 'Compare a 10×10 bedroom layout' },
      { href: '/en/bed-desk-wardrobe-layout/', title: 'Bed, desk and wardrobe guide' },
      { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' },
    ],
    roomWidth: 108,
    roomLength: 120,
    planLabels: ['Bed-first side route', 'Separate end-zone desk'],
  },
  {
    slug: '11x12-bedroom-layout',
    path: '/en/11x12-bedroom-layout/',
    title: '11×12 Bedroom Layout: Queen or King With Desk',
    description: 'Use 11×12 bedroom layout math to compare Queen and King footprints, work space, dresser access, and two dimension-aware arrangements.',
    h1: '11×12 bedroom layout: use the wider wall for choices, not clutter',
    lead: 'An 11 × 12 ft bedroom is 132 × 144 in. It gives a Queen or King more usable context than a 10 × 10 room, but the best layout still depends on keeping one wall or route open for everyday movement.',
    quickAnswer: 'All six common mattress rectangles fit physically in an 11 × 12 room. Twin through Queen leave the most flexibility for a desk and storage. King and California King can be workable starting points, but use the frame footprint and protect the closet and door route before adding a second nightstand.',
    assumptions: ['The room is treated as a clear 132 × 144 in rectangle, not as the full listing area of an apartment.', 'The floor plans use a Queen reference to make the furniture relationships visible; a King requires replacing that rectangle with the actual frame.', 'The clearance targets are planning comparisons only and are not code or accessibility certification.'],
    math: ['Room: 11 × 12 ft = 132 × 144 in.', 'Queen mattress: 60 × 80 in; King mattress: 76 × 80 in.', 'A lengthwise Queen leaves 72 in of raw width; a lengthwise King leaves 56 in before desks, dressers, and access.', 'The extra 12 in over a 10 ft wall can be assigned to a deeper desk, a second nightstand, or a more legible route—but not all three automatically.'],
    compatibility: [
      { item: 'Bed', guidance: 'Choose the bed by outside frame dimensions. A King is easier here than in an 8 × 10, but bed-side access still competes with the desk and closet.' },
      { item: 'Desk', guidance: 'A 30–36 in desk can work on an opposite wall or end zone. Draw the chair as a footprint if it will be used daily.' },
      { item: 'Dresser', guidance: 'A full dresser is more realistic than in smaller rooms, but it still needs drawer travel and a route in front of it.' },
      { item: 'Nightstand', guidance: 'Two compact nightstands may fit with a Queen; a King frame and headboard can use the extra side width quickly.' },
      { item: 'Closet access', guidance: 'Use the wider room to preserve the closet opening first. Do not treat a closet door arc as leftover floor.' },
    ],
    mistakes: ['Using the room area rather than the two clear wall dimensions.', 'Placing a King frame by mattress dimensions only.', 'Putting a desk chair in the main path to the closet.', 'Calling a layout open because the centre is empty while drawers cannot open.'],
    measureNext: ['Measure both wall lengths, door swing, closet opening, windows and radiators.', 'Measure the bed frame, headboard, desk with chair, dresser drawer extension and nightstands.', 'Use the planner to compare Queen and King as separate plans rather than assuming the mattress swap is the only change.'],
    faq: [
      { question: 'Will a King bed fit in an 11×12 bedroom?', answer: 'The 76 × 80 in King mattress rectangle fits inside 132 × 144 in. Whether the room remains practical depends on the frame, closet door, desk, and the route you need every day.' },
      { question: 'Can I add a desk to an 11×12 bedroom?', answer: 'Usually, yes as a planning starting point. Place the desk where its chair pullback does not conflict with the bed’s main route or closet opening.' },
      { question: 'Do I need two nightstands?', answer: 'No. Treat nightstands as optional footprints. Preserve bed access and storage operation first, then add one or two tables if the measured space supports them.' },
    ],
    related: [
      { href: '/en/layout-guides/10x12-bedroom-queen-desk/', title: 'Compare a 10×12 bedroom layout' },
      { href: '/en/12x12-bedroom-layout/', title: 'Compare a 12×12 bedroom layout' },
      { href: '/en/bed-room-fit-calculator/', title: 'Check a bed in your measured room' },
      { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' },
    ],
    roomWidth: 132,
    roomLength: 144,
    planLabels: ['Bed plus opposite work wall', 'Open-centre end-zone plan'],
  },
  {
    slug: '12x12-bedroom-layout',
    path: '/en/12x12-bedroom-layout/',
    title: '12×12 Bedroom Layout: Queen, King and Furniture Clearance',
    description: 'Plan a 12×12 bedroom around a Queen or King with measurable bed, desk, dresser, nightstand, closet and walkway tradeoffs.',
    h1: '12×12 bedroom layout: protect circulation before filling the square',
    lead: 'A 12 × 12 bedroom gives you a 144 × 144 in square. That is enough to compare several bed sizes, but a larger room can still feel blocked when every wall receives a deep piece of furniture.',
    quickAnswer: 'All six common mattress rectangles fit physically in a 12 × 12 room. Queen and King layouts can both leave useful options for a desk, dresser, and nightstands when the frame and openings are measured. California King also fits the rectangle, but its 84 in length changes which wall can hold a desk or dresser.',
    assumptions: ['The math uses 144 × 144 in of clear floor and does not count a bathroom, closet, walls, or fixed obstacles as furniture area.', 'The diagrams use a Queen reference. Swap in the outside dimensions of the chosen frame before finalizing a King or California King plan.', 'The suggested clearances describe daily-use planning tradeoffs, not legal minimums.'],
    math: ['Room: 12 × 12 ft = 144 × 144 in.', 'Queen mattress: 60 × 80 in; King: 76 × 80 in; California King: 72 × 84 in.', 'A lengthwise Queen leaves 84 in of raw width, while a King leaves 68 in and a California King leaves 72 in.', 'The square supports more than one furniture strategy, but the door, closet and window positions decide whether the apparent spare floor is actually usable.'],
    compatibility: [
      { item: 'Bed', guidance: 'A Queen, King, or California King can be a legitimate starting point. Use the longest outside frame dimension to decide which wall leaves the best foot route.' },
      { item: 'Desk', guidance: 'A 30–42 in work surface may fit, but the chair zone and screen position should not consume the route to the door or closet.' },
      { item: 'Dresser', guidance: 'A full dresser can work on the wall opposite the bed. Leave drawer travel outside the walking line.' },
      { item: 'Nightstand', guidance: 'Two nightstands are more feasible, but a headboard and frame can be wider than the mattress by several inches on each side.' },
      { item: 'Closet access', guidance: 'Keep a clear operating rectangle in front of the closet. Storage access is part of the layout, not an annotation added afterward.' },
    ],
    mistakes: ['Treating 144 × 144 in as a blank square after ignoring the door and closet.', 'Using a Queen diagram as proof that a California King will use the same wall.', 'Filling every corner with a dresser, bench, nightstand, or chair.', 'Using a clearance number as a building-code claim.'],
    measureNext: ['Measure the finished clear rectangle and every fixed opening.', 'Measure the chosen frame, headboard, desk and chair zone, dresser with drawers open, and closet access.', 'Draw at least two options in the planner and walk the route with a basket or laundry load.'],
    faq: [
      { question: 'Is a 12×12 bedroom big enough for a King bed?', answer: 'A 76 × 80 in King mattress fits physically in a 144 × 144 in room. The practical result depends on the outside frame, openings, desk, dresser and the access you want around the bed.' },
      { question: 'Can a California King fit in a 12×12 room?', answer: 'The 72 × 84 in mattress rectangle fits physically. Measure the frame length and place the door, closet and foot route before deciding which wall should hold the headboard.' },
      { question: 'What should go in the centre of the room?', answer: 'Usually the centre works best as circulation or flexible open floor. Add an ottoman or chair only after testing the entry, bed access, desk chair and storage paths.' },
    ],
    related: [
      { href: '/en/11x12-bedroom-layout/', title: 'Compare an 11×12 bedroom layout' },
      { href: '/en/layout-guides/10x12-bedroom-queen-desk/', title: 'Compare a 10×12 bedroom layout' },
      { href: '/en/bed-room-fit-calculator/', title: 'Check a bed in your measured room' },
      { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' },
    ],
    roomWidth: 144,
    roomLength: 144,
    planLabels: ['Queen with two-use work wall', 'Open-centre storage plan'],
  },
];

export const bedroomPages: GuidePageData[] = bedroomSpecs.map((spec) => ({
  ...spec,
  plans: bedroomPlans(spec.roomWidth, spec.roomLength, spec.planLabels),
}));

function studioPlans(width: number, length: number, labels: [string, string]): GuidePageData['plans'] {
  const bathWidth = Math.min(6, Math.round(width * 0.4 * 10) / 10);
  const sleepX = bathWidth + 0.5;
  const workWidth = Math.max(1, width - 8);
  const bottomHeight = Math.max(1.5, length - 18);
  const make = (title: string, variant: 'open' | 'privacy'): GuidePageData['plans'][number] => ({
    title,
    roomWidth: width,
    roomLength: length,
    unit: 'ft',
    items: [
      { label: 'Kitchen', x: 0, y: 0, width, height: 5, tone: 'fixed' },
      { label: 'Bath', x: 0, y: 5, width: bathWidth, height: 8, tone: 'fixed' },
      { label: variant === 'privacy' ? 'Sleep + screen' : 'Sleep zone', x: sleepX, y: 5, width: width - sleepX, height: 8, tone: 'bed' },
      { label: 'Entry', x: 0, y: 13, width: 4, height: 5, tone: 'fixed' },
      { label: variant === 'privacy' ? 'Work nook' : 'Workspace', x: 4, y: 13, width: workWidth, height: 5, tone: 'work' },
      { label: 'Dining', x: width - 4, y: 13, width: 4, height: 5, tone: 'feature' },
      { label: 'Storage', x: 0, y: 18, width: 4, height: bottomHeight, tone: 'storage' },
      { label: variant === 'privacy' ? 'Living / flex' : 'Living', x: 4, y: 18, width: width - 4, height: bottomHeight, tone: 'route' },
    ],
    description: variant === 'privacy'
      ? 'The sleeping zone gets a stronger visual edge and the work surface shares a defined nook. This protects privacy but reduces the amount of open floor that can change use during the day.'
      : 'The sleeping zone stays visually open to the living area. The room is easier to reconfigure, but sleep, work, and guest circulation share more of the same floor.',
  });
  return [make(labels[0], 'open'), make(labels[1], 'privacy')];
}

const studioSpecs: Array<Omit<StudioPageData, 'plans'>> = [
  {
    slug: '350-sq-ft-studio-apartment-layout',
    path: '/en/350-sq-ft-studio-apartment-layout/',
    title: '350 Sq Ft Studio Apartment Layout: Two Footprint Studies',
    description: 'Compare two illustrative 350 sq ft studio layouts with sleep, living, work, dining, storage, entry, kitchen and bath zones.',
    h1: '350 sq ft studio apartment layout: shape changes the usable room',
    lead: 'A 350 sq ft listing is an area, not a furniture rectangle. Compare a 14 × 25 ft footprint with a 17.5 × 20 ft footprint to see how the same area changes the sleeping, work, and circulation problem.',
    quickAnswer: 'The 350 sq ft examples below are illustrative layout studies, not a claim about a typical American studio. A long 14 × 25 ft shape can separate zones by length; a 17.5 × 20 ft shape gives a broader central area. In both cases, kitchen, bath, entry, walls and closets reduce the usable furniture area.',
    assumptions: ['Square footage alone does not tell you the usable furniture area. Listing area may include kitchen, bathroom, entry, closet, walls, and fixed elements.', 'The two footprints are intentionally different rectangles with the same 350 sq ft area.', 'The diagrams reserve fixed-zone blocks to illustrate the planning problem; replace them with the actual apartment plan before buying furniture.'],
    math: ['14 × 25 ft = 350 sq ft.', '17.5 × 20 ft = 350 sq ft.', 'The long footprint has 11 ft more length than width; the broader footprint has only 2.5 ft difference between its sides.', 'Sleeping, workspace, dining and storage must share the remaining open rectangle after fixed kitchen and bath zones are measured.'],
    compatibility: [
      { item: 'Sleeping zone', guidance: 'Use the long footprint to put sleep at the far end, or use a screen only when it does not block the entry route.' },
      { item: 'Living zone', guidance: 'A loveseat or compact sofa leaves more flexible floor than a full-depth sectional. Measure the delivery path separately.' },
      { item: 'Workspace', guidance: 'A 24–30 in deep desk can share a wall with storage, but the chair needs a real pullback zone.' },
      { item: 'Dining', guidance: 'A two-seat table or counter-depth surface may preserve circulation better than a four-seat table in the long footprint.' },
      { item: 'Storage and entrance', guidance: 'Keep entry, closet and kitchen doors visible. They are fixed circulation zones, not spare square footage.' },
    ],
    mistakes: ['Turning 350 sq ft into one assumed square room.', 'Counting the kitchen or bath as furniture area.', 'Adding a divider without drawing how doors and windows operate.', 'Using a sofa footprint without checking its delivery route.'],
    measureNext: ['Measure the clear open area separately from kitchen, bath, entry, closet and wall projections.', 'Mark every door swing, window, radiator and outlet that constrains a zone.', 'Use the RoomFeng planner to test the actual apartment before ordering a bed, sofa or desk.'],
    faq: [
      { question: 'Is a 350 sq ft studio always a 14×25 ft room?', answer: 'No. 14 × 25 ft is one illustrative footprint. The same 350 sq ft can have different proportions and fixed zones, which changes what furniture arrangement works.' },
      { question: 'Can a Queen bed fit in a 350 sq ft studio?', answer: 'A 60 × 80 in mattress may fit in many studio footprints, but the listing area is not enough evidence. Measure the open sleep zone, frame, route and storage access.' },
      { question: 'Why show two layouts for the same square footage?', answer: 'Because equal area does not imply equal shape. A long room and a broader room distribute circulation, work space and privacy differently.' },
    ],
    related: [
      { href: '/en/studio-apartment-layout/', title: 'Read the studio layout pillar guide' },
      { href: '/en/400-sq-ft-studio-apartment-layout/', title: 'Compare a 400 sq ft study' },
      { href: '/en/room-size-layout-templates/', title: 'Use measured room-size templates' },
      { href: '/en/room-layout-planner/', title: 'Draw your actual studio' },
    ],
    squareFeet: 350,
    footprintNote: '14 × 25 ft and 17.5 × 20 ft are illustrative footprint studies; they are not listing or market averages.',
  },
  {
    slug: '400-sq-ft-studio-apartment-layout',
    path: '/en/400-sq-ft-studio-apartment-layout/',
    title: '400 Sq Ft Studio Apartment Layout: Sleep, Work and Living Zones',
    description: 'See how two different 400 sq ft studio footprints change sleep, living, work, dining, storage and entry circulation.',
    h1: '400 sq ft studio apartment layout: compare 16×25 with 20×20',
    lead: 'A 400 sq ft studio can be 16 × 25 ft or 20 × 20 ft before fixed elements are counted. The longer footprint can separate sleep and living; the square footprint can make the centre more flexible but harder to zone without visual overlap.',
    quickAnswer: 'Neither 400 sq ft example is a typical American studio claim. They are illustrative layout studies. Use the actual clear open dimensions because a listing may include a kitchen, bathroom, entry, closet, walls, and other fixed elements that do not accept furniture.',
    assumptions: ['Square footage alone does not tell you the usable furniture area.', 'The two examples are 16 × 25 ft and 20 × 20 ft, both 400 sq ft.', 'The fixed zones in the diagrams are planning placeholders; real openings and built-ins can move the usable boundary.'],
    math: ['16 × 25 ft = 400 sq ft.', '20 × 20 ft = 400 sq ft.', 'The 16 × 25 footprint has 9 ft of extra length to separate zones, while the square footprint has equal sides and a shorter visual distance between them.', 'A Queen mattress reference is 60 × 80 in; a frame, closet path and chair zone must be added outside that nominal rectangle.'],
    compatibility: [
      { item: 'Sleeping zone', guidance: 'A long footprint can put the sleep zone at the far end. In a square footprint, use orientation and storage placement to create separation without blocking the middle.' },
      { item: 'Living zone', guidance: 'Keep a sofa depth that leaves a route from entry to kitchen/bath. The broader footprint does not make a deep sectional automatically safe.' },
      { item: 'Workspace', guidance: 'Place the desk where daylight and chair pullback do not consume the only route to the sleeping zone.' },
      { item: 'Dining', guidance: 'A drop-leaf or two-seat table can preserve the central floor while still creating a distinct eating surface.' },
      { item: 'Storage and entrance', guidance: 'Draw closet doors and kitchen/bath access before adding decorative storage or a room divider.' },
    ],
    mistakes: ['Assuming 20 × 20 ft is the default 400 sq ft studio.', 'Ignoring kitchen and bath fixed zones when calculating the bed area.', 'Using a divider that blocks the only clear route.', 'Calling a plan flexible without testing dining-chair pullback.'],
    measureNext: ['Measure the clear furniture envelope, not only the listing area.', 'Mark fixed zones and every route between the entrance, bath, kitchen and sleeping area.', 'Compare the two footprint ideas in the planner, then replace every placeholder with actual measurements.'],
    faq: [
      { question: 'Does 400 sq ft mean a 20×20 ft usable room?', answer: 'No. 20 × 20 ft is only one illustrative footprint. Apartment listing square footage may include fixed zones and walls, so measure the usable furniture area separately.' },
      { question: 'Is a Queen bed realistic in 400 sq ft?', answer: 'It may be, but the answer depends on the clear sleep zone, bed frame, entry route, closet access and the other zones you need. The total listing area alone cannot answer it.' },
      { question: 'Which footprint is easier, long or square?', answer: 'A long footprint can make zone separation more obvious. A square footprint may provide a broader centre, but it can require more deliberate placement to keep sleep, work and living from competing.' },
    ],
    related: [
      { href: '/en/350-sq-ft-studio-apartment-layout/', title: 'Compare a 350 sq ft study' },
      { href: '/en/450-sq-ft-studio-apartment-layout/', title: 'Compare a 450 sq ft study' },
      { href: '/en/studio-apartment-layout/', title: 'Read the studio layout pillar guide' },
      { href: '/en/room-layout-planner/', title: 'Draw your actual studio' },
    ],
    squareFeet: 400,
    footprintNote: '16 × 25 ft and 20 × 20 ft are illustrative footprint studies; they are not listing or market averages.',
  },
  {
    slug: '450-sq-ft-studio-apartment-layout',
    path: '/en/450-sq-ft-studio-apartment-layout/',
    title: '450 Sq Ft Studio Apartment Layout: Compare Two Floor Shapes',
    description: 'Compare two illustrative 450 sq ft studio footprints and see how fixed zones change sleep, work, dining, storage and circulation.',
    h1: '450 sq ft studio apartment layout: more area still needs zoning',
    lead: 'A 450 sq ft listing can describe a 15 × 30 ft long footprint or an 18 × 25 ft footprint. The added area helps, but it does not tell you where the kitchen, bath, entry, closet or walls sit.',
    quickAnswer: 'Both examples are illustrative studies, not a claim about a typical American 450 sq ft studio. The 15 × 30 version can create a strong sequence from entry to sleep; the 18 × 25 version is broader and may support a more balanced living area. Measure the actual open zone before applying either idea.',
    assumptions: ['Square footage alone does not tell you the usable furniture area.', 'The two footprints have equal area but different proportions: 15 × 30 ft and 18 × 25 ft.', 'Kitchen, bath, entry and storage blocks are shown as planning assumptions, not a measured apartment plan.'],
    math: ['15 × 30 ft = 450 sq ft.', '18 × 25 ft = 450 sq ft.', 'The long footprint has twice as much length as width; the broader footprint reduces the long corridor effect.', 'A larger area can absorb a sofa or desk more easily only if fixed zones do not take the added floor first.'],
    compatibility: [
      { item: 'Sleeping zone', guidance: 'Use the long footprint to separate sleep from the entry, or use a partial screen in the broader footprint without closing the route.' },
      { item: 'Living zone', guidance: 'Place the sofa so its depth does not create a corridor pinch between the entrance and kitchen.' },
      { item: 'Workspace', guidance: 'A dedicated desk can work, but chair pullback and daylight should be checked against the same route used by guests.' },
      { item: 'Dining', guidance: 'A four-seat table may fit in the broader example, but pullback space is part of the dining footprint.' },
      { item: 'Storage and entrance', guidance: 'Keep the entry and storage opening legible. Extra floor area should not become a reason to fill the arrival path.' },
    ],
    mistakes: ['Treating 450 sq ft as an open rectangle with no fixed zones.', 'Adding a full dining set without measuring chair movement.', 'Using a long room as a storage corridor instead of protecting a living route.', 'Assuming a divider is harmless because the apartment has more area.'],
    measureNext: ['Separate listing area from clear open-room dimensions.', 'Measure kitchen, bath, entry, closet, windows, radiators and door arcs.', 'Test bed, sofa, desk, dining and storage together in the planner before buying.'],
    faq: [
      { question: 'What shape is a 450 sq ft studio?', answer: 'There is no single shape. This page compares 15 × 30 ft and 18 × 25 ft as illustrative studies to show why equal area can produce different furniture routes.' },
      { question: 'Can I fit a Queen bed and sofa in 450 sq ft?', answer: 'Possibly, but use the clear open area and outside furniture dimensions. A kitchen, bath, entry and closet can reduce the usable zone substantially.' },
      { question: 'Does more studio area solve circulation?', answer: 'It can create more options, but only if the added floor is actually usable. Door swings, fixed zones and chair or drawer operation still decide the route.' },
    ],
    related: [
      { href: '/en/400-sq-ft-studio-apartment-layout/', title: 'Compare a 400 sq ft study' },
      { href: '/en/500-sq-ft-studio-apartment-layout/', title: 'Compare a 500 sq ft study' },
      { href: '/en/room-size-layout-templates/', title: 'Use measured room-size templates' },
      { href: '/en/room-layout-planner/', title: 'Draw your actual studio' },
    ],
    squareFeet: 450,
    footprintNote: '15 × 30 ft and 18 × 25 ft are illustrative footprint studies; they are not listing or market averages.',
  },
  {
    slug: '500-sq-ft-studio-apartment-layout',
    path: '/en/500-sq-ft-studio-apartment-layout/',
    title: '500 Sq Ft Studio Apartment Layout: Sleep, Work and Dining',
    description: 'Compare two illustrative 500 sq ft studio footprints with measurable zones for sleeping, living, work, dining, storage, entry and fixed areas.',
    h1: '500 sq ft studio apartment layout: assign the extra floor before filling it',
    lead: 'A 500 sq ft studio can be 20 × 25 ft or 16 × 31.25 ft before fixed elements are counted. The area offers more choices, but zoning still needs actual walls, openings and furniture footprints.',
    quickAnswer: 'The two layouts are illustrative studies, not a typical American 500 sq ft apartment claim. The 20 × 25 footprint supports a broader living and dining relationship; the 16 × 31.25 footprint can create a longer sequence of zones. Neither one proves that a particular listing has the same usable furniture area.',
    assumptions: ['Square footage alone does not tell you the usable furniture area.', 'The footprint examples are 20 × 25 ft and 16 × 31.25 ft, both 500 sq ft.', 'Fixed kitchen, bath, entry and storage blocks are illustrative placeholders until replaced by measured conditions.'],
    math: ['20 × 25 ft = 500 sq ft.', '16 × 31.25 ft = 500 sq ft.', 'The broad footprint has a 5 ft difference between sides; the long footprint has a 15.25 ft difference.', 'A Queen mattress reference is 60 × 80 in, but the bed frame, side access and foot route should be measured as a larger planning zone.'],
    compatibility: [
      { item: 'Sleeping zone', guidance: 'Choose whether sleep should be visually open, screened, or placed at the far end. Do not let a divider close the entry route.' },
      { item: 'Living zone', guidance: 'A compact sofa can anchor a living zone, but the clear route from entrance to kitchen and bath is still the first constraint.' },
      { item: 'Workspace', guidance: 'A real desk can be separated from dining in the broader footprint, while the long footprint may need a shared surface.' },
      { item: 'Dining', guidance: 'A table for more than two can work in one footprint and become a pinch point in another. Draw chairs pulled out, not only the tabletop.' },
      { item: 'Storage and entrance', guidance: 'Use the added area for storage only after the entrance, kitchen/bath doors and sleeping route remain operational.' },
    ],
    mistakes: ['Assuming 500 sq ft equals a square usable room.', 'Sizing a sofa or dining table without its delivery and chair zones.', 'Using a screen to create privacy while blocking daylight or the main route.', 'Adding storage to every remaining wall and losing flexible floor.'],
    measureNext: ['Measure the clear open room separately from the apartment’s listing area.', 'Mark fixed kitchen, bath, entry, closet, windows, radiators and door arcs.', 'Use the planner to test both zone sequences with the exact furniture outside dimensions.'],
    faq: [
      { question: 'Is a 500 sq ft studio large enough for a separate work area?', answer: 'It may be, but the footprint and fixed zones matter more than the number alone. A shared dining/work surface can be more useful than a desk that blocks the route.' },
      { question: 'Why compare 20×25 with 16×31.25?', answer: 'They have the same area but different proportions. The broad version can support a wider central relationship; the long version can separate zones but may feel more linear.' },
      { question: 'Should I buy furniture based on the listing square footage?', answer: 'No. Measure the clear open furniture area, fixed elements, outside product dimensions and delivery route before purchasing.' },
    ],
    related: [
      { href: '/en/450-sq-ft-studio-apartment-layout/', title: 'Compare a 450 sq ft study' },
      { href: '/en/studio-apartment-layout/', title: 'Read the studio layout pillar guide' },
      { href: '/en/apartment-furniture-planner/', title: 'Plan furniture across an apartment' },
      { href: '/en/room-layout-planner/', title: 'Draw your actual studio' },
    ],
    squareFeet: 500,
    footprintNote: '20 × 25 ft and 16 × 31.25 ft are illustrative footprint studies; they are not listing or market averages.',
  },
];

export const studioPages: StudioPageData[] = studioSpecs.map((spec) => {
  const footprints: Record<number, [[number, number], [number, number]]> = {
    350: [[14, 25], [17.5, 20]],
    400: [[16, 25], [20, 20]],
    450: [[15, 30], [18, 25]],
    500: [[20, 25], [16, 31.25]],
  };
  const [first, second] = footprints[spec.squareFeet];
  return {
    ...spec,
    plans: studioPlans(first[0], first[1], ['Long-footprint zoning', 'Long-footprint privacy'])
      .concat(studioPlans(second[0], second[1], ['Broad-footprint zoning', 'Broad-footprint privacy'])),
  };
});

const livingPages: GuidePageData[] = [
  {
    slug: 'long-narrow-living-room-layout',
    path: '/en/long-narrow-living-room-layout/',
    title: 'Long Narrow Living Room Layout: Sofa, TV and Clear Routes',
    description: 'Solve a long narrow living room layout with measured sofa depth, TV placement, circulation routes, two diagrams and clear tradeoffs.',
    h1: 'Long narrow living room layout: make the route visible first',
    lead: 'A long narrow room often fails when a sofa, coffee table and TV are placed by wall length alone. Start by protecting the route through the room, then choose the seating depth that the remaining width can support.',
    quickAnswer: 'For the illustrative 12 × 24 ft room below, a sofa along one long wall can leave a clearer longitudinal route than a deep sectional across the width. A two-seat arrangement at one end may create a better conversation zone, but it can make the far end feel unused. Measure sofa depth, coffee-table clearance, door swing and TV sightline together.',
    assumptions: ['The diagrams use a 12 × 24 ft clear rectangle and are illustrative, not a typical room claim.', 'Furniture dimensions are planning footprints: the sofa is 84 × 36 in in the first option and a compact arrangement in the second.', 'A route shown as open still needs an on-site test for doors, windows, vents, radiators and actual walking behaviour.'],
    math: ['Room: 12 × 24 ft = 144 × 288 in.', 'An 84 × 36 in sofa uses 3 ft of depth before coffee-table and walking space.', 'A 36 in route is shown as a planning comparison, not a legal minimum or accessibility certification.', 'If the sofa, table and route are all measured on the short dimension, the room can feel blocked even when the long wall has spare length.'],
    plans: [
      { title: 'Long-wall sofa with through-route', roomWidth: 12, roomLength: 24, unit: 'ft', items: [{ label: 'Sofa', x: 0, y: 4, width: 7, height: 3, tone: 'feature' }, { label: 'TV', x: 0, y: 20, width: 3, height: .5, tone: 'fixed' }, { label: 'Coffee table', x: 4, y: 10, width: 4, height: 2, tone: 'storage' }, { label: 'Route', x: 8, y: 0, width: 3, height: 24, tone: 'route' }], description: 'The sofa sits on a long wall and the right side stays legible as a route. The tradeoff is a less symmetrical seating relationship with the TV.' },
      { title: 'End-zone seating with open length', roomWidth: 12, roomLength: 24, unit: 'ft', items: [{ label: 'Sofa', x: 2, y: 0, width: 8, height: 3, tone: 'feature' }, { label: 'TV', x: 2, y: 21, width: 8, height: .5, tone: 'fixed' }, { label: 'Chair', x: 0, y: 10, width: 3, height: 3, tone: 'work' }, { label: 'Route', x: 8, y: 5, width: 3, height: 14, tone: 'route' }], description: 'Seating is concentrated at one end so the long dimension remains visually open. The far-end route and TV distance need an actual comfort check.' },
    ],
    compatibility: [
      { item: 'Sofa', guidance: 'Measure outside depth, arm width and chaise extension. A sectional can consume the route even when its overall length fits the wall.' },
      { item: 'TV', guidance: 'Choose the wall by measured sightline and glare, not by habit. Note windows, fireplace, outlets and wall structure.' },
      { item: 'Coffee table', guidance: 'Leave space for walking around it and for pulling a chair or ottoman out. A smaller table can protect the route better than a large centre piece.' },
      { item: 'Storage', guidance: 'Prefer shallow storage where the room narrows. Door and drawer travel need their own operating rectangles.' },
      { item: 'Entry route', guidance: 'Draw the route from the door to the useful zones before adding accent seating.' },
    ],
    mistakes: ['Using wall length as the only furniture constraint.', 'Putting a deep sectional across the narrow dimension.', 'Ignoring a door swing or window opening because it is not furniture.', 'Calling a route clear when the coffee table or chair moves into it during use.'],
    measureNext: ['Measure the narrowest clear width, door swing, window projection and radiator depth.', 'Measure sofa depth, chaise, coffee table, chair pullback and TV wall conditions.', 'Draw the room in the planner and test the route with the largest expected daily object.'],
    faq: [
      { question: 'Where should a sofa go in a long narrow living room?', answer: 'Usually start with the longest wall or an end zone that leaves a clear route through the room. The right choice depends on door, window, TV and furniture depth.' },
      { question: 'Should a coffee table be centred in a narrow room?', answer: 'Only if it leaves a usable route around it. A smaller table, side table or offset arrangement may preserve circulation better.' },
      { question: 'Is a 36 inch walkway required?', answer: 'Not universally. This page uses 36 in as a planning comparison, not as a legal or building-code claim. Check the requirements that apply to the property when accessibility is part of the brief.' },
    ],
    related: [{ href: '/en/awkward-living-room-layout/', title: 'Solve an awkward living room' }, { href: '/en/living-room-layout-with-fireplace-and-tv/', title: 'Compare fireplace and TV layouts' }, { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' }],
  },
  {
    slug: 'awkward-living-room-layout',
    path: '/en/awkward-living-room-layout/',
    title: 'Awkward Living Room Layout: Work Around Columns, Doors and Dead Zones',
    description: 'Diagnose an awkward living room with measurable obstacles, two layout strategies, furniture sizing and circulation tradeoffs.',
    h1: 'Awkward living room layout: name the constraint before moving the sofa',
    lead: 'An awkward living room is usually a geometry problem: a column splits the room, a door claims a corner, a window limits the wall, or the TV has only one plausible position. Measure those constraints before choosing a style solution.',
    quickAnswer: 'In the illustrative 16 × 20 ft room, a sofa can either protect a route around a central column or create a stronger conversation zone while accepting a narrower approach. Neither plan is universally correct. The right choice depends on which route, opening and furniture operation you use every day.',
    assumptions: ['The 16 × 20 ft rectangle and 2 × 2 ft column are illustrative geometry, not a claim about every awkward room.', 'Furniture rectangles represent outside dimensions; a real sofa, chair and storage piece may have arms, legs or doors beyond the simple box.', 'The diagrams do not certify structural, electrical, fire or accessibility conditions.'],
    math: ['Room: 16 × 20 ft = 192 × 240 in.', 'The 2 × 2 ft column removes 4 sq ft from the simple rectangle and creates two different approach widths.', 'A 7 × 3 ft sofa needs more than its own footprint when people pass, sit, or reach a table.', 'A layout should be judged by the narrowest active route, not the average open area.'],
    plans: [
      { title: 'Route-first around the column', roomWidth: 16, roomLength: 20, unit: 'ft', items: [{ label: 'Column', x: 7, y: 7, width: 2, height: 2, tone: 'fixed' }, { label: 'Sofa', x: 1, y: 12, width: 8, height: 3, tone: 'feature' }, { label: 'TV', x: 12, y: 12, width: 3, height: .5, tone: 'fixed' }, { label: 'Chair', x: 10, y: 2, width: 4, height: 3, tone: 'work' }, { label: 'Route', x: 9, y: 5, width: 3, height: 14, tone: 'route' }], description: 'This option keeps the main route visible around the column. It sacrifices a perfectly centred sofa-to-TV relationship to make arrival and passage easier.' },
      { title: 'Conversation-first split zone', roomWidth: 16, roomLength: 20, unit: 'ft', items: [{ label: 'Column', x: 7, y: 7, width: 2, height: 2, tone: 'fixed' }, { label: 'Sofa', x: 1, y: 3, width: 8, height: 3, tone: 'feature' }, { label: 'TV', x: 12, y: 3, width: 3, height: .5, tone: 'fixed' }, { label: 'Chair', x: 9, y: 13, width: 4, height: 3, tone: 'work' }, { label: 'Route', x: 2, y: 8, width: 4, height: 10, tone: 'route' }], description: 'This option makes the seating group feel more intentional, but its routes depend on keeping the column approach and chair movement free.' },
    ],
    compatibility: [{ item: 'Sofa', guidance: 'Use a footprint that leaves a route on at least one side of the obstacle. Measure chaise and arm depth separately.' }, { item: 'TV', guidance: 'Check glare, outlets and the wall’s actual suitability. The most obvious wall is not always the usable one.' }, { item: 'Chair', guidance: 'A chair is a moving footprint. Include pullback and the route to the seat, not only the chair’s parked size.' }, { item: 'Storage', guidance: 'Keep doors and drawers away from the column pinch point. Shallow open storage may be easier to operate.' }, { item: 'Door and windows', guidance: 'Treat them as fixed geometry. Do not use a dead-looking corner until the opening path is drawn.' }],
    mistakes: ['Measuring the whole rectangle while ignoring the column or notch.', 'Parking the sofa in the only route around the obstacle.', 'Using a TV wall without checking glare and outlets.', 'Assuming every empty corner is furniture-ready.'],
    measureNext: ['Map columns, radiators, door arcs, windows and built-ins from finished surfaces.', 'Measure every item’s outside footprint and the active operating space.', 'Try a route-first and a conversation-first drawing in the planner, then walk both.'],
    faq: [{ question: 'How do I start an awkward living room layout?', answer: 'Measure and draw the fixed obstacles first. Then protect the route you use most, choose the sofa footprint, and test TV, chair and storage operation around the constraint.' }, { question: 'Should furniture hide a column?', answer: 'Only if the resulting route and maintenance access still work. A column can be a useful zoning edge, but it should not be treated as disposable floor.' }, { question: 'What if there is no good TV wall?', answer: 'Compare the wall conditions, glare, outlets and viewing direction. A different seating orientation or a smaller screen zone may be more practical than forcing one wall.' }],
    related: [{ href: '/en/long-narrow-living-room-layout/', title: 'Plan a long narrow living room' }, { href: '/en/living-room-layout-with-fireplace-and-tv/', title: 'Compare fireplace and TV layouts' }, { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' }],
  },
  {
    slug: 'living-room-layout-with-fireplace-and-tv',
    path: '/en/living-room-layout-with-fireplace-and-tv/',
    title: 'Living Room Layout With Fireplace and TV: Three Geometry Checks',
    description: 'Compare TV over a fireplace, an adjacent wall, and an opposite wall with measurable furniture and circulation tradeoffs.',
    h1: 'Living room layout with fireplace and TV: compare the wall choices',
    lead: 'A fireplace does not automatically determine where the TV belongs. Compare the fireplace wall, an adjacent wall and an opposite wall as separate geometry options, then check sightline, glare, seating distance and the room’s actual route.',
    quickAnswer: 'In the illustrative 16 × 20 ft room, placing the TV above the fireplace keeps the seating group compact but may create a viewing-height or heat/structure question that needs qualified site-specific advice. An adjacent wall separates the functions but changes the seating angle. An opposite wall can create a clear media wall where the room geometry supports it. This page does not provide electrical, structural or fire-safety guarantees.',
    assumptions: ['The 16 × 20 ft room and 5 × 1 ft fireplace are illustrative planning geometry.', 'TV and fireplace locations must be checked against the actual wall, heat, structure, outlets and local requirements by the appropriate professional.', 'The diagrams compare furniture relationships; they are not installation instructions.'],
    math: ['Room: 16 × 20 ft = 192 × 240 in.', 'A 7 × 3 ft sofa is shown as a planning footprint; include chaise, arm and table clearance in the actual plan.', 'A media wall needs a clear viewing line and a practical route around the seating, not only a free wall rectangle.', 'The TV-over-fireplace option should be treated as a review condition, not an automatic recommendation.'],
    plans: [
      { title: 'TV over fireplace: compact but review', roomWidth: 16, roomLength: 20, unit: 'ft', items: [{ label: 'Fireplace', x: 6, y: 19, width: 4, height: 1, tone: 'fixed' }, { label: 'TV over FP', x: 6, y: 17.8, width: 4, height: .6, tone: 'feature' }, { label: 'Sofa', x: 4, y: 6, width: 8, height: 3, tone: 'work' }, { label: 'Route', x: 1, y: 5, width: 2, height: 13, tone: 'route' }], description: 'This keeps the media and fireplace wall compact. Review viewing height, heat, mounting, wiring and the actual wall before treating it as an installation plan.' },
      { title: 'TV on adjacent wall', roomWidth: 16, roomLength: 20, unit: 'ft', items: [{ label: 'Fireplace', x: 6, y: 19, width: 4, height: 1, tone: 'fixed' }, { label: 'TV', x: 0, y: 9, width: .6, height: 4, tone: 'feature' }, { label: 'Sofa', x: 5, y: 6, width: 8, height: 3, tone: 'work' }, { label: 'Chair', x: 1, y: 3, width: 3, height: 3, tone: 'route' }], description: 'The TV moves to an adjacent wall, so the seating can face it without using the fireplace wall. The result may create a diagonal route and more glare decisions.' },
      { title: 'TV on opposite wall', roomWidth: 16, roomLength: 20, unit: 'ft', items: [{ label: 'Fireplace', x: 6, y: 19, width: 4, height: 1, tone: 'fixed' }, { label: 'TV', x: 6, y: 0, width: 4, height: .6, tone: 'feature' }, { label: 'Sofa', x: 5, y: 7, width: 8, height: 3, tone: 'work' }, { label: 'Route', x: 1, y: 4, width: 3, height: 13, tone: 'route' }], description: 'The opposite wall creates a conventional media direction while leaving the fireplace independent. Check the actual viewing distance, windows, glare and route around the sofa.' },
    ],
    compatibility: [{ item: 'Fireplace', guidance: 'Record its exact projection, hearth, clearances and operating area. Do not infer safety from a top-down rectangle.' }, { item: 'TV', guidance: 'Compare height, glare, viewing angle, outlets and wall suitability. A mounting decision may require qualified advice.' }, { item: 'Sofa', guidance: 'Place the sofa by outside dimensions and route, then check whether people can enter, sit and pass without crossing the fireplace operating area.' }, { item: 'Coffee table', guidance: 'Keep a practical route around the table. A smaller table can preserve a better media arrangement than forcing a large centre.' }, { item: 'Windows and doors', guidance: 'Draw openings before judging any wall option. The wall that looks empty may be the active route or glare source.' }],
    mistakes: ['Assuming the fireplace is automatically the correct TV wall.', 'Making electrical, structural, heat or fire-safety claims from a layout diagram.', 'Ignoring viewing height and glare.', 'Checking the sofa-to-TV line while forgetting the route around the seating.'],
    measureNext: ['Measure the fireplace projection, hearth, wall width, openings, outlets and windows.', 'Measure sofa, chairs, tables and the desired viewing distance.', 'Use the planner to compare all three directions, then obtain site-specific professional advice for installation questions.'],
    faq: [{ question: 'Should the TV go above the fireplace?', answer: 'Not automatically. Compare the fireplace wall with adjacent and opposite walls, then review viewing height, glare, heat, wall structure, wiring and the requirements that apply to the installation.' }, { question: 'What is the best layout when the fireplace is off-centre?', answer: 'Use the actual fireplace and wall dimensions as fixed geometry. A sofa can face an adjacent or opposite wall while preserving a route, but the best choice depends on openings and daily use.' }, { question: 'Does this page confirm a safe TV installation?', answer: 'No. It compares furniture geometry only and does not provide electrical, structural or fire-safety advice. Get site-specific guidance where needed.' }],
    related: [{ href: '/en/awkward-living-room-layout/', title: 'Solve an awkward living room' }, { href: '/en/long-narrow-living-room-layout/', title: 'Plan a long narrow living room' }, { href: '/en/room-layout-planner/', title: 'Open the RoomFeng Room Planner' }],
  },
];

export const livingRoomPages = livingPages;

export const fengShuiPages: FengShuiPageData[] = [
  {
    slug: 'feng-shui-bed-placement', path: '/en/feng-shui-bed-placement/', title: 'Feng Shui Bed Placement: A Traditional Reference Guide', description: 'Explore traditional feng shui bed-placement ideas alongside measurable room fit, door, window and walkway checks.', h1: 'Feng shui bed placement: separate tradition from room geometry', lead: 'Traditional feng shui practice often considers the bed’s relationship to walls, doors and the room’s wider position. RoomFeng presents those ideas as cultural references, then keeps measurable fit and clearance as a separate planning task.', quickAnswer: 'Some feng shui traditions prefer a stable wall behind the headboard, visibility of the door without placing the bed directly in its path, and enough room to approach the bed. These are traditional preferences, not guarantees about health, wealth, relationships or luck. Use the RoomFeng planner for measurable dimensions; this guide does not perform a feng shui calculation.', measurable: ['Measure the outside bed frame, not only the mattress.', 'Mark the door swing, closet opening, windows, radiator and the route used to enter the room.', 'Check whether the bed leaves the requested side and foot clearances in the actual room.'], traditional: ['In traditional feng shui practice, a solid headboard or wall behind the head of the bed is often preferred as a sense of support.', 'Some traditions prefer the bed to have a view of the door without sitting directly in line with it. Interpret that as a placement preference, not a prediction.', 'Different schools and households may explain placement differently. RoomFeng does not rank one tradition as universally correct.'], steps: ['Draw the measured room and fixed openings in the RoomFeng Room Planner.', 'Place the bed using the outside frame dimensions and compare two or more orientations.', 'Read the traditional preference as a reflection prompt, then choose the option that also works for access, storage and daily comfort.', 'Recheck the arrangement if a door, window, heater or new furniture changes the geometry.'], mistakes: ['Presenting a traditional preference as a medical, financial or supernatural fact.', 'Using a mattress preset as the full bed footprint.', 'Ignoring a closet or door because the bed looks aligned in a blank rectangle.'], faq: [{ question: 'What is the basic feng shui idea for bed placement?', answer: 'Traditional feng shui discussions often focus on the bed’s relationship to support, the door and the surrounding room. These are cultural placement concepts, not guarantees about life outcomes.' }, { question: 'Does RoomFeng calculate feng shui?', answer: 'No. The English RoomFeng planner checks measurable room fit, openings and clearances. This page is a separate traditional feng shui reference guide.' }, { question: 'Should I prioritize feng shui or clearance?', answer: 'Keep measurable safety, access, ventilation, heating, doors and furniture operation as practical constraints. Use traditional concepts as an optional perspective within the layout you can actually use.' }], related: [{ href: '/en/bed-facing-door-feng-shui/', title: 'Bed facing door feng shui reference' }, { href: '/en/mirror-facing-bed-feng-shui/', title: 'Mirror facing bed feng shui reference' }, { href: '/en/room-layout-planner/', title: 'Use the measurable Room Planner' }],
  },
  {
    slug: 'bed-facing-door-feng-shui', path: '/en/bed-facing-door-feng-shui/', title: 'Bed Facing Door Feng Shui: Traditional Concepts and Room Checks', description: 'Read a careful traditional feng shui reference about a bed facing a door, alongside measurable door swing, route and privacy checks.', h1: 'Bed facing the door feng shui: check the line, then check the room', lead: 'The phrase “bed facing the door” can describe several different geometries. Traditional feng shui discussions may prefer avoiding a direct alignment, while practical planning asks where the door opens, how people walk and whether the bed frame leaves usable access.', quickAnswer: 'First define the actual line: does the door point toward the head, side or foot of the bed, and does its swing enter the bed footprint? In some traditional feng shui practices, a direct line is considered undesirable. That is a cultural concept, not a claim of bad health, bad luck or a guaranteed outcome. Measure the room separately.', measurable: ['Record the door opening width, swing arc and threshold.', 'Measure the bed frame and the line from the doorway to the bed’s head, side and foot.', 'Check whether a screen, dresser or alternative bed orientation would block a practical route or create a new pinch point.'], traditional: ['Some feng shui traditions prefer the bed not to sit directly in the door’s line of sight or swing.', 'A partial visual buffer may be considered by some practitioners, but it should not obstruct the route or create a hazard.', 'Traditions vary, so describe the preference as “some feng shui traditions prefer” rather than a universal rule.'], steps: ['Draw the door and its swing in the RoomFeng planner.', 'Try the current bed position, a rotated position and a position with a measured visual buffer.', 'Compare route width, closet access, light and ventilation before considering the traditional preference.', 'Keep any buffer removable and practical in a rental or changing room.'], mistakes: ['Calling the alignment a guaranteed source of misfortune.', 'Placing a screen in the doorway route.', 'Confusing visual alignment with a door actually colliding with the bed.', 'Ignoring the bed frame outside dimensions.'], faq: [{ question: 'What does bed facing door mean in feng shui?', answer: 'It usually refers to a bed aligned with a door or visible directly from it, but the exact geometry matters. Traditional interpretations vary and should not be presented as guaranteed outcomes.' }, { question: 'Should I move a bed that faces the door?', answer: 'Check the measurable door swing, route, privacy and bed access first. If you also want a traditional feng shui perspective, compare another orientation without creating a worse practical layout.' }, { question: 'Can a screen fix the layout?', answer: 'A screen can change a sightline, but it also takes floor space and may block a route. Measure it as furniture and keep the doorway clear.' }], related: [{ href: '/en/feng-shui-bed-placement/', title: 'Read the broader bed-placement guide' }, { href: '/en/mirror-facing-bed-feng-shui/', title: 'Mirror facing bed feng shui reference' }, { href: '/en/room-layout-planner/', title: 'Check the measurable door route' }],
  },
  {
    slug: 'mirror-facing-bed-feng-shui', path: '/en/mirror-facing-bed-feng-shui/', title: 'Mirror Facing Bed Feng Shui: Traditional Reference and Practical Checks', description: 'Explore traditional feng shui views about a mirror facing a bed while checking reflection, wall position, access and measurable room constraints.', h1: 'Mirror facing the bed feng shui: separate reflection from room fit', lead: 'A mirror facing a bed is discussed differently across feng shui traditions. RoomFeng treats those interpretations as cultural references and asks a separate practical question: where does the mirror sit, what reflects in it, and can people still use the route safely?', quickAnswer: 'Some traditional feng shui practices prefer not to place a mirror where it directly reflects the bed. That preference is not a scientific, health, financial or supernatural guarantee. Measure the mirror’s outside footprint, wall or door position, glare, cleaning access and the path beside the bed before choosing a change.', measurable: ['Measure the mirror, frame, stand or door-mounted footprint.', 'Check the reflected view, nighttime glare, window light and whether the mirror blocks a closet or door.', 'Keep the bed-side route and any dresser drawer operation usable after the mirror is added.'], traditional: ['Some traditions prefer a mirror not to reflect the bed directly, especially when it creates an uncomfortable nighttime sightline.', 'Other households may treat a mirror as a practical grooming or light-reflecting object. Traditions are not uniform.', 'Use the phrase “some feng shui traditions prefer” and avoid claiming that reflection causes a guaranteed result.'], steps: ['Mark the mirror and bed positions in a measured room plan.', 'Test a changed wall, an angled mirror or a cover as separate footprints or sightline options.', 'Check daylight glare, nighttime comfort, cleaning access and the route to the closet.', 'Keep the practical option that works for the room; the traditional perspective is optional.'], mistakes: ['Saying a mirror will cause bad health, bad luck or relationship problems.', 'Ignoring a standing mirror’s tip-over or walking footprint.', 'Moving the mirror into a door or closet operating zone.', 'Treating a reflection preference as a calculation performed by the planner.'], faq: [{ question: 'What does mirror facing bed mean in feng shui?', answer: 'It generally means the mirror reflects the bed from its current position. Some traditions prefer avoiding that arrangement, but interpretations vary and do not establish guaranteed outcomes.' }, { question: 'Where can I move the mirror?', answer: 'Compare a side wall, angled position or removable cover while preserving door, closet, cleaning and bed-side access. The best practical position depends on the measured room.' }, { question: 'Does the RoomFeng planner check mirror feng shui?', answer: 'No. The English planner can help you place a mirror and check measurable room fit, but it does not perform feng shui checks.' }], related: [{ href: '/en/feng-shui-bed-placement/', title: 'Read the broader bed-placement guide' }, { href: '/en/bed-facing-door-feng-shui/', title: 'Bed facing door feng shui reference' }, { href: '/en/room-layout-planner/', title: 'Check the measurable mirror footprint' }],
  },
];

export { livingPages };
