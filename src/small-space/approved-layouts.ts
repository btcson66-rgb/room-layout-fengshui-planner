// Generated from Phase 1 approved registry. Do not edit manually.
import type { LayoutRecord } from './types';

export const approvedLayouts = [
  {
    "id": "BR-CS-001",
    "version": "1.0.0-phase1",
    "family": "compact-single-bedroom",
    "archetype": "Sleep-first Single + Open Floor",
    "roomWidthMm": 2400,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 7200000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 768,
        "yMm": 0,
        "widthMm": 816,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 980,
        "yMm": 520,
        "widthMm": 990,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-twin",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "nightstand",
        "type": "nightstand",
        "xMm": 480,
        "yMm": 520,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "shelf",
        "type": "shelving",
        "xMm": 100,
        "yMm": 2500,
        "widthMm": 650,
        "depthMm": 300,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep",
      "rest"
    ],
    "priorityTags": [
      "open-floor",
      "sleep"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "single sleeper who values an uncluttered centre",
    "tradeOff": "The shelf is narrow; there is no full work desk.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "sleep-open-floor",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.31402083333333336,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-CS-002",
    "version": "1.0.0-phase1",
    "family": "compact-single-bedroom",
    "archetype": "Study-first Twin + Compact Desk",
    "roomWidthMm": 2400,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 7200000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 768,
        "yMm": 0,
        "widthMm": 816,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 300,
        "yMm": 950,
        "widthMm": 990,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-twin",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 1450,
        "yMm": 350,
        "widthMm": 750,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 1550,
        "yMm": 1000,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "chair-pullback-mm": 750,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "study",
      "work"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "student renter with a real study zone",
    "tradeOff": "Bed access is stronger on one side than the other.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "study-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "chair-pullback-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3539513888888889,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-CS-003",
    "version": "1.0.0-phase1",
    "family": "compact-single-bedroom",
    "archetype": "Storage-wall Single + Folding Work Surface",
    "roomWidthMm": 2400,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 7200000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 768,
        "yMm": 0,
        "widthMm": 816,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1000,
        "yMm": 650,
        "widthMm": 900,
        "depthMm": 2000,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "eu-single",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 500,
        "widthMm": 800,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 100,
        "yMm": 2450,
        "widthMm": 700,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "shelf",
        "type": "shelving",
        "xMm": 1700,
        "yMm": 2700,
        "widthMm": 550,
        "depthMm": 300,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "rental"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "renter prioritising closed storage over a full desk",
    "tradeOff": "Work surface is compact and must stay clear to remain usable.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "storage-wall",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3784722222222222,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-CSP-001",
    "version": "1.0.0-phase1",
    "family": "compact-single-plus-bedroom",
    "archetype": "Full Desk Single + Clear Entry",
    "roomWidthMm": 2700,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 8100000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 864,
        "yMm": 0,
        "widthMm": 918,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 250,
        "yMm": 600,
        "widthMm": 990,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-twin",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 1500,
        "yMm": 300,
        "widthMm": 1000,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 1700,
        "yMm": 1050,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 1800,
        "yMm": 2200,
        "widthMm": 800,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "study",
      "clear-entry"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "student who needs a full-size desk",
    "tradeOff": "Wardrobe sits at the foot zone and needs disciplined door opening.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "full-desk",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3920925925925926,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-CSP-002",
    "version": "1.0.0-phase1",
    "family": "compact-single-plus-bedroom",
    "archetype": "Larger Bed + Compact Desk",
    "roomWidthMm": 2700,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 8100000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 864,
        "yMm": 0,
        "widthMm": 918,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1000,
        "yMm": 500,
        "widthMm": 1372,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-full",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 100,
        "yMm": 2500,
        "widthMm": 700,
        "depthMm": 350,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 300,
        "yMm": 1900,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 300,
        "widthMm": 750,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "sleep",
      "compact-work"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "single sleeper who wants a wider bed",
    "tradeOff": "The desk is compact and the bed has a preferred one-side approach.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "larger-bed",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.4347111111111111,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-CSP-003",
    "version": "1.0.0-phase1",
    "family": "compact-single-plus-bedroom",
    "archetype": "Storage Wall + Open Centre",
    "roomWidthMm": 2700,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 8100000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 864,
        "yMm": 0,
        "widthMm": 918,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1600,
        "yMm": 700,
        "widthMm": 990,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-twin",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 300,
        "widthMm": 900,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 100,
        "yMm": 2350,
        "widthMm": 800,
        "depthMm": 450,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "shelf",
        "type": "shelving",
        "xMm": 1300,
        "yMm": 250,
        "widthMm": 1000,
        "depthMm": 300,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "open-centre"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "renter with high storage needs",
    "tradeOff": "Desk work is secondary; the open centre is the main relief.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "storage-open-centre",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3809814814814815,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-SQ-001",
    "version": "1.0.0-phase1",
    "family": "square-small-bedroom",
    "archetype": "Bed-centred Queen + Side Access",
    "roomWidthMm": 3000,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 9000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 960,
        "yMm": 0,
        "widthMm": 1020,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 700,
        "yMm": 500,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "nightstand-left",
        "type": "nightstand",
        "xMm": 180,
        "yMm": 600,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "nightstand-right",
        "type": "nightstand",
        "xMm": 2370,
        "yMm": 600,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 2300,
        "yMm": 1100,
        "widthMm": 500,
        "depthMm": 900,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "couple",
      "bed-centred"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple prioritising a centred queen bed",
    "tradeOff": "There is no full desk; storage is concentrated at the foot.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "bed-centred",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.4340853333333333,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-SQ-002",
    "version": "1.0.0-phase1",
    "family": "square-small-bedroom",
    "archetype": "Work-first Queen + Wall Desk",
    "roomWidthMm": 3000,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 9000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2150,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1860,
        "yMm": 0,
        "widthMm": 840,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 300,
        "yMm": 800,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 2050,
        "yMm": 350,
        "widthMm": 750,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 2150,
        "yMm": 1000,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 300,
        "yMm": 250,
        "widthMm": 800,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "couple"
    ],
    "warnings": [
      "One-side bed access is the deliberate trade-off."
    ],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple sharing a room with a focused work zone",
    "tradeOff": "One long side of the queen is intentionally tighter than the other.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "work-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.4621408888888889,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-SQ-003",
    "version": "1.0.0-phase1",
    "family": "square-small-bedroom",
    "archetype": "Open-centre Full + Flexible Desk",
    "roomWidthMm": 3000,
    "roomLengthMm": 3000,
    "shape": "rectangle",
    "areaMm2": 9000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 960,
        "yMm": 0,
        "widthMm": 1020,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 250,
        "yMm": 650,
        "widthMm": 1372,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-full",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 2050,
        "yMm": 2200,
        "widthMm": 700,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 2100,
        "yMm": 1600,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 1850,
        "yMm": 350,
        "widthMm": 900,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 900,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "open-centre",
      "flexibility"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "single sleeper who wants the largest central activity zone",
    "tradeOff": "The full bed gives up sleeping width for circulation.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "open-centre",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.40707333333333334,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-N-001",
    "version": "1.0.0-phase1",
    "family": "narrow-bedroom",
    "archetype": "Long-wall Twin + Clear Route",
    "roomWidthMm": 2400,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 8640000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3500,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 768,
        "yMm": 0,
        "widthMm": 816,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 300,
        "yMm": 1150,
        "widthMm": 990,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-twin",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 1450,
        "yMm": 450,
        "widthMm": 800,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 300,
        "yMm": 300,
        "widthMm": 800,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 1350,
        "yMm": 1100,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "route",
      "study"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "narrow room needing a continuous route from entry to window",
    "tradeOff": "Desk and bed share the same long-wall rhythm.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "long-wall-bed",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3444386574074074,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-N-002",
    "version": "1.0.0-phase1",
    "family": "narrow-bedroom",
    "archetype": "End-wall Twin + Side Work Zone",
    "roomWidthMm": 2400,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 8640000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3500,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 768,
        "yMm": 0,
        "widthMm": 816,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1050,
        "yMm": 300,
        "widthMm": 990,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-twin",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 300,
        "yMm": 2500,
        "widthMm": 900,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 500,
        "yMm": 1950,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 500,
        "widthMm": 750,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "light"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "single sleeper who prefers the bed to define the far end",
    "tradeOff": "The desk is at the window end and gets the strongest light but less storage nearby.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "end-wall-bed",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3522511574074074,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-N-003",
    "version": "1.0.0-phase1",
    "family": "narrow-bedroom",
    "archetype": "Linear Storage + Work Nook",
    "roomWidthMm": 2400,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 8640000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2750,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1488,
        "yMm": 0,
        "widthMm": 672,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1100,
        "yMm": 1450,
        "widthMm": 900,
        "depthMm": 2000,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "eu-single",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 150,
        "yMm": 300,
        "widthMm": 900,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 150,
        "yMm": 2550,
        "widthMm": 800,
        "depthMm": 450,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 1500,
        "yMm": 300,
        "widthMm": 700,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 1550,
        "yMm": 900,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "work"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "renter balancing storage and a small work nook",
    "tradeOff": "The route is efficient but visually busier than the open-centre options.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "linear-storage-work",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3819444444444444,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-MN-001",
    "version": "1.0.0-phase1",
    "family": "medium-narrow-bedroom",
    "archetype": "Double-first + Stable Wardrobe Wall",
    "roomWidthMm": 2700,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 9720000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3500,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 864,
        "yMm": 0,
        "widthMm": 918,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 200,
        "yMm": 900,
        "widthMm": 1524,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 1900,
        "yMm": 300,
        "widthMm": 700,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "nightstand",
        "type": "nightstand",
        "xMm": 1750,
        "yMm": 900,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "couple",
      "storage"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple prioritising a wider sleep surface",
    "tradeOff": "Storage is narrow and concentrated on one wall.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "double-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.36041358024691356,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-MN-002",
    "version": "1.0.0-phase1",
    "family": "medium-narrow-bedroom",
    "archetype": "Desk-first Queen + Side Route",
    "roomWidthMm": 2700,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 9720000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3500,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 864,
        "yMm": 0,
        "widthMm": 918,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1150,
        "yMm": 1400,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 100,
        "yMm": 500,
        "widthMm": 1000,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 300,
        "yMm": 1100,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 2800,
        "widthMm": 700,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 600,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "couple"
    ],
    "warnings": [
      "One-side bed access is intentional in this compact WFH strategy."
    ],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple with a dedicated work-from-home surface",
    "tradeOff": "Only one side of the queen has the most generous access.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "desk-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "tight",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.44051111111111113,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-MN-003",
    "version": "1.0.0-phase1",
    "family": "medium-narrow-bedroom",
    "archetype": "Storage-first Double + Open Foot",
    "roomWidthMm": 2700,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 9720000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3500,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 864,
        "yMm": 0,
        "widthMm": 918,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 1200,
        "yMm": 1500,
        "widthMm": 1372,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-full",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 250,
        "widthMm": 900,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 100,
        "yMm": 2900,
        "widthMm": 800,
        "depthMm": 450,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "shelf",
        "type": "shelving",
        "xMm": 1800,
        "yMm": 300,
        "widthMm": 700,
        "depthMm": 300,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "open-route"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "renter who wants a clear, labelled storage wall",
    "tradeOff": "The bed is smaller than a queen to protect an open foot route.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "storage-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3830925925925926,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-1012-001",
    "version": "1.0.0-phase1",
    "family": "10x12-bedroom",
    "archetype": "Queen + Desk with Light Route",
    "roomWidthMm": 3048,
    "roomLengthMm": 3658,
    "shape": "rectangle",
    "areaMm2": 11149584,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3558,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 975,
        "yMm": 0,
        "widthMm": 1036,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 250,
        "yMm": 900,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 2050,
        "yMm": 300,
        "widthMm": 850,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 2150,
        "yMm": 1000,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 2050,
        "yMm": 3000,
        "widthMm": 750,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "couple",
      "light"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple who needs both a queen bed and a usable desk",
    "tradeOff": "The desk sits close to the window wall; keep cable and curtain access clear.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "queen-desk-light-route",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.37954492293165376,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-1012-002",
    "version": "1.0.0-phase1",
    "family": "10x12-bedroom",
    "archetype": "Queen + Wardrobe Wall",
    "roomWidthMm": 3048,
    "roomLengthMm": 3658,
    "shape": "rectangle",
    "areaMm2": 11149584,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2808,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 975,
        "yMm": 0,
        "widthMm": 1036,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 700,
        "yMm": 650,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 2300,
        "yMm": 1200,
        "widthMm": 700,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 2050,
        "yMm": 2800,
        "widthMm": 750,
        "depthMm": 450,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "nightstand",
        "type": "nightstand",
        "xMm": 200,
        "yMm": 700,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 760
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "couple"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple who prefers consolidated clothing storage",
    "tradeOff": "The wardrobe wall wins storage but narrows the secondary route.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "queen-wardrobe-wall",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "practical"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3618312575608202,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-1012-003",
    "version": "1.0.0-phase1",
    "family": "10x12-bedroom",
    "archetype": "Taiwan 5-ft + Desk + Wardrobe Balance",
    "roomWidthMm": 3048,
    "roomLengthMm": 3658,
    "shape": "rectangle",
    "areaMm2": 11149584,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2808,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1890,
        "yMm": 0,
        "widthMm": 853,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 150,
        "yMm": 900,
        "widthMm": 1520,
        "depthMm": 1880,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "tw-5-ft",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 1850,
        "yMm": 2850,
        "widthMm": 900,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 2050,
        "yMm": 2200,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 1850,
        "yMm": 400,
        "widthMm": 900,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 900,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "storage",
      "trade-off"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "single sleeper wanting the most complete furniture set",
    "tradeOff": "The full bed is the deliberate compromise that keeps both desk and wardrobe usable.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "full-desk-wardrobe",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3715474945074184,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-M-001",
    "version": "1.0.0-phase1",
    "family": "medium-bedroom",
    "archetype": "Couple-first Queen + Two Sides",
    "roomWidthMm": 3000,
    "roomLengthMm": 4000,
    "shape": "rectangle",
    "areaMm2": 12000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3900,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 960,
        "yMm": 0,
        "widthMm": 1020,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 730,
        "yMm": 750,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "nightstand-left",
        "type": "nightstand",
        "xMm": 200,
        "yMm": 800,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "nightstand-right",
        "type": "nightstand",
        "xMm": 2370,
        "yMm": 800,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 1900,
        "yMm": 3200,
        "widthMm": 850,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 900,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "couple",
      "balanced-access"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple wanting balanced access to a queen bed",
    "tradeOff": "The layout leaves less room for a full desk.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "couple-two-sides",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "comfortable",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.32702233333333336,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-M-002",
    "version": "1.0.0-phase1",
    "family": "medium-bedroom",
    "archetype": "WFH Queen + Quiet Work Wall",
    "roomWidthMm": 3000,
    "roomLengthMm": 4000,
    "shape": "rectangle",
    "areaMm2": 12000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3150,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 960,
        "yMm": 0,
        "widthMm": 1020,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 250,
        "yMm": 1100,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 1900,
        "yMm": 300,
        "widthMm": 1000,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 2050,
        "yMm": 1000,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 250,
        "yMm": 3300,
        "widthMm": 800,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "couple"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple needing a dedicated quiet work wall",
    "tradeOff": "The bed shifts off-centre to protect a straight chair pull-back zone.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "wfh-quiet-wall",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.365564,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-M-003",
    "version": "1.0.0-phase1",
    "family": "medium-bedroom",
    "archetype": "Storage/Open-space Balance",
    "roomWidthMm": 3000,
    "roomLengthMm": 4000,
    "shape": "rectangle",
    "areaMm2": 12000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3150,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1860,
        "yMm": 0,
        "widthMm": 840,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 980,
        "yMm": 700,
        "widthMm": 1372,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-full",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 2800,
        "widthMm": 900,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 1900,
        "yMm": 3300,
        "widthMm": 800,
        "depthMm": 450,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "shelf",
        "type": "shelving",
        "xMm": 100,
        "yMm": 2300,
        "widthMm": 750,
        "depthMm": 300,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 900,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "open-floor"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "single",
    "bestFor": "single sleeper choosing open floor over a larger bed",
    "tradeOff": "Storage is excellent but the bed is a full rather than a queen.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "storage-open-balance",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "comfortable",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.311555,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-W-001",
    "version": "1.0.0-phase1",
    "family": "wider-bedroom",
    "archetype": "Balanced Couple Queen",
    "roomWidthMm": 3300,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 11880000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 3500,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1056,
        "yMm": 0,
        "widthMm": 1122,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 880,
        "yMm": 650,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "nightstand-left",
        "type": "nightstand",
        "xMm": 300,
        "yMm": 700,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "nightstand-right",
        "type": "nightstand",
        "xMm": 2470,
        "yMm": 700,
        "widthMm": 450,
        "depthMm": 400,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 2100,
        "yMm": 2900,
        "widthMm": 900,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 900,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "couple",
      "balanced-access"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple who wants balanced access without overfurnishing",
    "tradeOff": "Work happens elsewhere; this is intentionally sleep-led.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "balanced-couple",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "comfortable",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.332640404040404,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-W-002",
    "version": "1.0.0-phase1",
    "family": "wider-bedroom",
    "archetype": "Large Workstation + Queen",
    "roomWidthMm": 3300,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 11880000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2750,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1056,
        "yMm": 0,
        "widthMm": 1122,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 250,
        "yMm": 700,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 2050,
        "yMm": 250,
        "widthMm": 1100,
        "depthMm": 650,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 2200,
        "yMm": 1050,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 250,
        "yMm": 3000,
        "widthMm": 850,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 760,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "work",
      "couple"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "WFH couple needing a real-width desk",
    "tradeOff": "The desk takes the brightest wall and reduces spare display space.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "large-workstation",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "practical",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.37767407407407405,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "BR-W-003",
    "version": "1.0.0-phase1",
    "family": "wider-bedroom",
    "archetype": "Storage-first Queen + Dresser Wall",
    "roomWidthMm": 3300,
    "roomLengthMm": 3600,
    "shape": "rectangle",
    "areaMm2": 11880000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 2750,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 2046,
        "yMm": 0,
        "widthMm": 924,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 900,
        "yMm": 850,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 100,
        "yMm": 250,
        "widthMm": 1000,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dresser",
        "type": "dresser",
        "xMm": 2450,
        "yMm": 3000,
        "widthMm": 750,
        "depthMm": 450,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "shelf",
        "type": "shelving",
        "xMm": 100,
        "yMm": 2850,
        "widthMm": 800,
        "depthMm": 300,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep"
    ],
    "clearances": {
      "bed-side-mm": 900,
      "wardrobe-opening-mm": 700,
      "dresser-opening-mm": 700,
      "primary-route-mm": 900
    },
    "targetUses": [
      "sleep"
    ],
    "priorityTags": [
      "storage",
      "couple"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "couple",
    "bestFor": "couple with a high clothing and display-storage load",
    "tradeOff": "The open centre is preserved, but the foot wall is visually busy.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "storage-first-queen",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "bed-side-mm": "comfortable",
      "wardrobe-opening-mm": "tight",
      "dresser-opening-mm": "tight",
      "primary-route-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.3597868686868687,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "ST-MICRO-001",
    "version": "1.0.0-phase1",
    "family": "micro-studio",
    "archetype": "Open-space Micro Studio",
    "roomWidthMm": 5600,
    "roomLengthMm": 5000,
    "shape": "rectangle",
    "areaMm2": 28000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 4150,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 3472,
        "yMm": 0,
        "widthMm": 1200,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 350,
        "yMm": 350,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "sofa",
        "type": "loveseat",
        "xMm": 3500,
        "yMm": 350,
        "widthMm": 1500,
        "depthMm": 800,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 350,
        "yMm": 3300,
        "widthMm": 1000,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 1400,
        "yMm": 3400,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dining",
        "type": "dining-table",
        "xMm": 3500,
        "yMm": 3300,
        "widthMm": 1000,
        "depthMm": 700,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "storage",
        "type": "storage-cabinet",
        "xMm": 4700,
        "yMm": 1800,
        "widthMm": 600,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep",
      "work",
      "living",
      "dining",
      "storage-entry"
    ],
    "clearances": {
      "primary-route-mm": 900,
      "chair-pullback-mm": 750,
      "studio-entry-mm": 900
    },
    "targetUses": [
      "studio",
      "hosting"
    ],
    "priorityTags": [
      "open-plan",
      "hosting"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "studio",
    "bestFor": "single renter who wants one legible open room",
    "tradeOff": "The bed is visually open to the living zone; privacy is intentionally low.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "open-space",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "primary-route-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "studio-entry-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.21952742857142857,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "ST-MICRO-002",
    "version": "1.0.0-phase1",
    "family": "micro-studio",
    "archetype": "Work-first Micro Studio",
    "roomWidthMm": 5600,
    "roomLengthMm": 5000,
    "shape": "rectangle",
    "areaMm2": 28000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 4150,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1792,
        "yMm": 0,
        "widthMm": 1200,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 3600,
        "yMm": 350,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "sofa",
        "type": "sofa",
        "xMm": 350,
        "yMm": 3500,
        "widthMm": 1900,
        "depthMm": 850,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 350,
        "yMm": 500,
        "widthMm": 1400,
        "depthMm": 650,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 900,
        "yMm": 1300,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dining",
        "type": "dining-table",
        "xMm": 3000,
        "yMm": 3500,
        "widthMm": 900,
        "depthMm": 650,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "storage",
        "type": "storage-cabinet",
        "xMm": 4800,
        "yMm": 2800,
        "widthMm": 600,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep",
      "work",
      "living",
      "dining",
      "storage-entry"
    ],
    "clearances": {
      "primary-route-mm": 900,
      "chair-pullback-mm": 750,
      "studio-entry-mm": 900
    },
    "targetUses": [
      "studio",
      "work"
    ],
    "priorityTags": [
      "work",
      "zoning"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "studio",
    "bestFor": "WFH renter who needs a true desk zone",
    "tradeOff": "The sleeping zone is separated by distance rather than a partition.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "work-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "primary-route-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "studio-entry-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.24131314285714286,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "ST-MICRO-003",
    "version": "1.0.0-phase1",
    "family": "micro-studio",
    "archetype": "Sleep-privacy Micro Studio",
    "roomWidthMm": 5600,
    "roomLengthMm": 5000,
    "shape": "rectangle",
    "areaMm2": 28000000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 4150,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 3472,
        "yMm": 0,
        "widthMm": 1200,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 350,
        "yMm": 300,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "divider",
        "type": "shelving",
        "xMm": 2050,
        "yMm": 250,
        "widthMm": 300,
        "depthMm": 1800,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "sofa",
        "type": "sofa",
        "xMm": 3300,
        "yMm": 3300,
        "widthMm": 1900,
        "depthMm": 850,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 3300,
        "yMm": 600,
        "widthMm": 900,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 3400,
        "yMm": 1350,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dining",
        "type": "dining-table",
        "xMm": 3300,
        "yMm": 2150,
        "widthMm": 900,
        "depthMm": 650,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "storage",
        "type": "storage-cabinet",
        "xMm": 4700,
        "yMm": 300,
        "widthMm": 600,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep",
      "work",
      "living",
      "dining",
      "storage-entry"
    ],
    "clearances": {
      "primary-route-mm": 900,
      "chair-pullback-mm": 750,
      "studio-entry-mm": 900
    },
    "targetUses": [
      "studio",
      "privacy"
    ],
    "priorityTags": [
      "privacy",
      "zoning"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "studio",
    "bestFor": "sleeper who values a visual sleep boundary",
    "tradeOff": "The divider costs some central openness and is not a full acoustic wall.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "sleep-privacy",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "primary-route-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "studio-entry-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.24577742857142856,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "ST-SMALL-001",
    "version": "1.0.0-phase1",
    "family": "small-studio",
    "archetype": "Hosting-first Small Studio",
    "roomWidthMm": 6100,
    "roomLengthMm": 6100,
    "shape": "rectangle",
    "areaMm2": 37210000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 5250,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 3782,
        "yMm": 0,
        "widthMm": 1200,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 350,
        "yMm": 350,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "sofa",
        "type": "sofa",
        "xMm": 3500,
        "yMm": 400,
        "widthMm": 2000,
        "depthMm": 900,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dining",
        "type": "dining-table",
        "xMm": 3500,
        "yMm": 2300,
        "widthMm": 1200,
        "depthMm": 750,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 350,
        "yMm": 4000,
        "widthMm": 1000,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 1400,
        "yMm": 4100,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "storage",
        "type": "storage-cabinet",
        "xMm": 5100,
        "yMm": 1800,
        "widthMm": 700,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep",
      "work",
      "living",
      "dining",
      "storage-entry"
    ],
    "clearances": {
      "primary-route-mm": 900,
      "chair-pullback-mm": 750,
      "studio-entry-mm": 900
    },
    "targetUses": [
      "studio",
      "hosting"
    ],
    "priorityTags": [
      "hosting",
      "dining"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "studio",
    "bestFor": "renter who hosts meals and still needs a work surface",
    "tradeOff": "The bed is exposed and the work zone is compact.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "hosting-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "primary-route-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "studio-entry-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.18897522171459286,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "ST-SMALL-002",
    "version": "1.0.0-phase1",
    "family": "small-studio",
    "archetype": "WFH-first Small Studio",
    "roomWidthMm": 6100,
    "roomLengthMm": 6100,
    "shape": "rectangle",
    "areaMm2": 37210000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 5250,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 1952,
        "yMm": 0,
        "widthMm": 1200,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 3800,
        "yMm": 350,
        "widthMm": 1524,
        "depthMm": 2032,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-queen",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "sofa",
        "type": "sofa",
        "xMm": 350,
        "yMm": 3800,
        "widthMm": 1900,
        "depthMm": 850,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 350,
        "yMm": 400,
        "widthMm": 1600,
        "depthMm": 700,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 900,
        "yMm": 1350,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dining",
        "type": "dining-table",
        "xMm": 3600,
        "yMm": 3300,
        "widthMm": 900,
        "depthMm": 650,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "storage",
        "type": "storage-cabinet",
        "xMm": 5100,
        "yMm": 2800,
        "widthMm": 700,
        "depthMm": 550,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep",
      "work",
      "living",
      "dining",
      "storage-entry"
    ],
    "clearances": {
      "primary-route-mm": 900,
      "chair-pullback-mm": 750,
      "studio-entry-mm": 900
    },
    "targetUses": [
      "studio",
      "work"
    ],
    "priorityTags": [
      "work",
      "full-desk"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "studio",
    "bestFor": "WFH renter who wants a full-size desk without losing the living zone",
    "tradeOff": "The sofa shifts to the entry-side wall and needs a clear arrival route.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "wfh-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "primary-route-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "studio-entry-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.1895127116366568,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  },
  {
    "id": "ST-SMALL-003",
    "version": "1.0.0-phase1",
    "family": "small-studio",
    "archetype": "Storage-first Small Studio",
    "roomWidthMm": 6100,
    "roomLengthMm": 6100,
    "shape": "rectangle",
    "areaMm2": 37210000,
    "localeBasis": "universal",
    "furniture": [
      {
        "id": "door",
        "type": "door",
        "xMm": 0,
        "yMm": 5250,
        "widthMm": 850,
        "depthMm": 100,
        "rotationDeg": 90,
        "clearanceMm": 0,
        "swingMm": 850
      },
      {
        "id": "window",
        "type": "window",
        "xMm": 3782,
        "yMm": 0,
        "widthMm": 1200,
        "depthMm": 80,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "bed",
        "type": "bed",
        "xMm": 350,
        "yMm": 350,
        "widthMm": 1372,
        "depthMm": 1905,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "presetId": "us-full",
        "footprintBasis": "mattress",
        "frameAllowanceMm": 0,
        "required": true
      },
      {
        "id": "sofa",
        "type": "sofa",
        "xMm": 3600,
        "yMm": 3800,
        "widthMm": 1900,
        "depthMm": 850,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "desk",
        "type": "desk",
        "xMm": 3600,
        "yMm": 500,
        "widthMm": 1000,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0,
        "required": true
      },
      {
        "id": "chair",
        "type": "chair",
        "xMm": 3750,
        "yMm": 1350,
        "widthMm": 500,
        "depthMm": 500,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "dining",
        "type": "dining-table",
        "xMm": 3500,
        "yMm": 2300,
        "widthMm": 900,
        "depthMm": 650,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "storage-wall",
        "type": "storage-cabinet",
        "xMm": 5000,
        "yMm": 1200,
        "widthMm": 1100,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      },
      {
        "id": "wardrobe",
        "type": "wardrobe",
        "xMm": 2300,
        "yMm": 350,
        "widthMm": 900,
        "depthMm": 600,
        "rotationDeg": 0,
        "clearanceMm": 0
      }
    ],
    "zones": [
      "sleep",
      "work",
      "living",
      "dining",
      "storage-entry"
    ],
    "clearances": {
      "primary-route-mm": 900,
      "chair-pullback-mm": 750,
      "wardrobe-opening-mm": 700,
      "studio-entry-mm": 900
    },
    "targetUses": [
      "studio",
      "storage"
    ],
    "priorityTags": [
      "storage",
      "full-bed"
    ],
    "warnings": [],
    "qualityStatus": "approved",
    "doorScenario": "D1",
    "windowScenario": "W1",
    "occupancy": "studio",
    "bestFor": "renter with a high storage load and smaller bed preference",
    "tradeOff": "The full bed is smaller, but the storage wall is materially stronger.",
    "review": {
      "functional": true,
      "visual": true,
      "distinctiveness": true
    },
    "strategyKey": "storage-first",
    "layoutDistinctiveness": 1,
    "clearanceClassification": {
      "primary-route-mm": "comfortable",
      "chair-pullback-mm": "tight",
      "wardrobe-opening-mm": "tight",
      "studio-entry-mm": "comfortable"
    },
    "validation": {
      "valid": true,
      "issues": [],
      "occupiedAreaRatio": 0.18445740392367643,
      "minClearanceMm": 0
    },
    "functionalReview": {
      "pass": true,
      "issues": []
    },
    "visualReview": {
      "pass": true,
      "questions": [
        "bed legible",
        "route legible",
        "desk usable",
        "wardrobe usable",
        "scale plausible",
        "no dead-end",
        "meaningfully different",
        "human choice",
        "搬家具時可照做",
        "no algorithmic artefact"
      ],
      "reviewer": "product-002-phase1-review",
      "reviewedOn": "2026-09-11"
    },
    "distinctivenessReview": {
      "pass": true,
      "reason": null
    },
    "validatedOn": "2026-09-11"
  }
] as unknown as LayoutRecord[];
