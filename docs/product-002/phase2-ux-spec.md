# PRODUCT-002 Phase 2 UX Specification

## Scope

Phase 2 turns the approved 30-layout dataset into a paid decision-support experience. It does not add Moving OS features, a new checkout, a public sales page, an SEO route, or a production deployment.

## Core promise

`Room → Sleep setup → Must fit → Priorities → Top 3 validated strategies → Compare → Planner handoff`

The first screen asks `What are you trying to fit?` / `你的房間需要放下什麼？`. Quick Match requires room dimensions, bed region/preset, must-fit furniture, and up to two priorities. Door/window data is an optional refine step and is shown as a template assumption until supplied.

## Paid value boundary

The shared product identity is `roomfeng-layout-vault-v1` (phase2, US$17.99 planning value). The UI exposes the paid decision-support surface: all validated matches, diverse Top 3, detailed clearance/trade-offs, compare (maximum three), local favorites, and Planner handoff. The free preview contract is documented as Top 1 + basic reason + basic SVG; the paid boundary is not enabled as a public SEO route in this phase.

## Implemented UX contracts

- Canonical geometry remains millimetres; metric and imperial inputs are formatted for humans.
- Mattress preset and frame allowance are separate. Custom bed/furniture sizes use strict dimensions and explain a no-match honestly.
- Top 3 selection reranks by strategy signature/archetype before score fill, so the result set represents different decisions rather than three near-duplicates.
- Cards share one viewBox-based renderer across Matcher, Browse, Compare, Detail, and handoff preview. Each SVG has a textual summary for assistive technology.
- Detail view includes Best for, Why it matches (at most three deterministic reasons), Trade-off, assumptions, clearances, warnings/alternatives, and `Customize in RoomFeng Planner`.
- Browse starts with Bedroom/Studio filters and supports exact/closest size search. Saved layouts are browser-local and contain only layout IDs and matcher state.
- Planner handoff is versioned (`roomfeng.layout-vault.handoff/v1`), canonical-mm, `create-new`, and one-way. Existing Planner projects are not overwritten.
- Analytics wiring is opt-in (`window.__RF_PRODUCT_002_ANALYTICS_ENABLED__ === true`); payloads contain only product/locale/family/strategy/count/placement buckets and never exact room data, furniture data, license, email, or project data.

## Responsive/accessibility contract

The UI uses a measured-editorial visual system (Fraunces/IBM Plex fallback, cream/moss/clay), semantic fieldsets/radios/labels, keyboard-visible focus, live summary regions, reduced-motion support, 44px touch targets, forced-colors support, and a stacked mobile result/compare layout.

## Deliberate non-goals

No AI claim, no blank-planner replacement, no account system, no live sync back from Planner, no PDF/ZIP catalog, no listing graphics, no public SEO pages, no product-001 changes, no commit/push/PR/deploy.
