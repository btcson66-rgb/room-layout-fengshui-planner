import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchLayouts } from '../src/small-space/matcher.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs', 'product-002', 'review');
const layouts = JSON.parse(await readFile(path.join(dir, 'approved-layouts.json'), 'utf8'));
const personas = [
  { id: 'P01', label: '10x10 Queen + desk WFH', request: { width: 300, length: 300, unit: 'cm', shape: 'square', requiredFurniture: ['bed', 'desk'], occupancy: 'couple', priorities: ['work'] }, expectedFamilies: ['square-small-bedroom'] },
  { id: 'P02', label: '240x300 single + desk student', request: { width: 240, length: 300, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'desk'], occupancy: 'single', priorities: ['study'] }, expectedFamilies: ['compact-single-bedroom'] },
  { id: 'P03', label: '240x360 narrow double storage', request: { width: 240, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'wardrobe'], occupancy: 'single', priorities: ['storage'] }, expectedFamilies: ['narrow-bedroom'] },
  { id: 'P04', label: '3048x3658 queen + desk + wardrobe', request: { width: 3048, length: 3658, unit: 'mm', shape: 'rectangle', requiredFurniture: ['bed', 'desk', 'wardrobe'], occupancy: 'couple', priorities: ['work', 'storage'] }, expectedFamilies: ['10x12-bedroom'] },
  { id: 'P05', label: '300x400 storage/open space', request: { width: 300, length: 400, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'wardrobe'], occupancy: 'single', priorities: ['storage', 'open-floor'] }, expectedFamilies: ['medium-bedroom'] },
  { id: 'P06', label: '330x360 balanced couple', request: { width: 330, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed'], occupancy: 'couple', priorities: ['couple'] }, expectedFamilies: ['wider-bedroom'] },
  { id: 'P07', label: 'Micro studio WFH', request: { width: 5600, length: 5000, unit: 'mm', shape: 'rectangle', requiredFurniture: ['bed', 'desk', 'sofa', 'dining-table'], occupancy: 'studio', priorities: ['work'] }, expectedFamilies: ['micro-studio'] },
  { id: 'P08', label: 'Small studio hosting', request: { width: 610, length: 610, unit: 'cm', shape: 'square', requiredFurniture: ['bed', 'sofa', 'dining-table'], occupancy: 'studio', priorities: ['hosting', 'dining'] }, expectedFamilies: ['small-studio'] },
  { id: 'P09', label: '270x300 larger bed compact desk', request: { width: 270, length: 300, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'desk'], occupancy: 'single', priorities: ['sleep'] }, expectedFamilies: ['compact-single-plus-bedroom'] },
  { id: 'P10', label: '270x360 desk-first couple', request: { width: 270, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'desk'], occupancy: 'couple', priorities: ['work'] }, expectedFamilies: ['medium-narrow-bedroom'] },
];

const rows = personas.map((persona) => {
  const matches = matchLayouts(layouts, persona.request);
  const top3 = matches.slice(0, 3).map((match) => ({ id: match.layout.id, family: match.layout.family, archetype: match.layout.archetype, score: match.score, breakdown: match.scoreBreakdown, whyItMatches: match.whyItMatches, tradeoffs: match.tradeoffs }));
  const top1Expected = top3.length > 0 && persona.expectedFamilies.includes(top3[0].family);
  return { ...persona, top3, top1ExpectedFamily: top1Expected, manualReviewRequired: true };
});
await writeFile(path.join(dir, 'matcher-persona-ranking.json'), JSON.stringify({ generatedOn: '2026-09-11', personaCount: rows.length, rows }, null, 2), 'utf8');
console.log(JSON.stringify(rows.map((row) => ({ id: row.id, label: row.label, top1: row.top3[0]?.id ?? null, top1Family: row.top3[0]?.family ?? null, top1ExpectedFamily: row.top1ExpectedFamily })), null, 2));
