import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchLayouts, selectDiverseTopMatches } from '../src/small-space/matcher.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewDir = path.join(root, 'docs', 'product-002', 'review');
const layouts = JSON.parse(await readFile(path.join(reviewDir, 'approved-layouts.json'), 'utf8'));
const cases = [
  { id: 'U01', label: 'first-time renter', request: { width: 300, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'desk'], occupancy: 'single', priorities: ['work'], bedWidthMm: 1520, bedDepthMm: 1880, furnitureSizesMm: { desk: { widthMm: 800, depthMm: 500 } } } },
  { id: 'U02', label: 'exact furniture buyer', request: { width: 300, length: 400, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'wardrobe'], occupancy: 'single', priorities: ['storage'], bedWidthMm: 1524, bedDepthMm: 2032, furnitureSizesMm: { wardrobe: { widthMm: 900, depthMm: 600 } }, strictFurnitureSizes: true } },
  { id: 'U03', label: 'Taiwan 5 chi', request: { width: 330, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed'], occupancy: 'couple', priorities: ['couple'], bedWidthMm: 1520, bedDepthMm: 1880 } },
  { id: 'U04', label: 'US Queen', request: { width: 11, length: 12, unit: 'ft', shape: 'rectangle', requiredFurniture: ['bed', 'desk'], occupancy: 'single', priorities: ['work'], bedWidthMm: 1524, bedDepthMm: 2032, furnitureSizesMm: { desk: { widthMm: 800, depthMm: 500 } } } },
  { id: 'U05', label: 'metric 160x200', request: { width: 300, length: 400, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed'], occupancy: 'couple', priorities: ['larger-bed'], bedWidthMm: 1600, bedDepthMm: 2000 } },
  { id: 'U06', label: 'impossible combination', request: { width: 180, length: 180, unit: 'cm', shape: 'square', requiredFurniture: ['bed', 'desk', 'wardrobe'], occupancy: 'couple', priorities: ['work', 'storage'], bedWidthMm: 1930, bedDepthMm: 2032, furnitureSizesMm: { desk: { widthMm: 1400, depthMm: 700 }, wardrobe: { widthMm: 1200, depthMm: 650 } }, strictFurnitureSizes: true } },
  { id: 'U07', label: 'narrow room', request: { width: 240, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed', 'wardrobe'], occupancy: 'single', priorities: ['storage'], bedWidthMm: 990, bedDepthMm: 1905 } },
  { id: 'U08', label: 'couple', request: { width: 330, length: 360, unit: 'cm', shape: 'rectangle', requiredFurniture: ['bed'], occupancy: 'couple', priorities: ['couple'], bedWidthMm: 1524, bedDepthMm: 2032 } },
  { id: 'U09', label: 'WFH', request: { width: 11, length: 12, unit: 'ft', shape: 'rectangle', requiredFurniture: ['bed', 'desk', 'wardrobe'], occupancy: 'couple', priorities: ['work', 'storage'], bedWidthMm: 1524, bedDepthMm: 2032, furnitureSizesMm: { desk: { widthMm: 1000, depthMm: 600 }, wardrobe: { widthMm: 900, depthMm: 600 } } } },
  { id: 'U10', label: 'studio zoning', request: { width: 610, length: 610, unit: 'cm', shape: 'square', requiredFurniture: ['bed', 'sofa', 'dining-table'], occupancy: 'studio', priorities: ['hosting', 'privacy'], bedWidthMm: 1524, bedDepthMm: 2032, furnitureSizesMm: { sofa: { widthMm: 1500, depthMm: 800 }, 'dining-table': { widthMm: 900, depthMm: 650 } } } },
];

const rows = cases.map((item) => {
  const ranked = matchLayouts(layouts, item.request);
  const top3 = selectDiverseTopMatches(ranked, 3);
  const strategies = [...new Set(top3.map((match) => match.layout.strategyKey ?? match.layout.family))];
  return { id: item.id, label: item.label, matchCount: ranked.length, top3: top3.map((match) => ({ id: match.layout.id, family: match.layout.family, strategy: match.layout.strategyKey, score: match.score })), distinctStrategyCount: strategies.length, noMatch: ranked.length === 0 };
});
const report = { schema: 'roomfeng.product-002.phase2-ui-qa/v1', generatedOn: new Date().toISOString(), caseCount: rows.length, rows, checks: { impossibleIsHonestNoMatch: rows.find((row) => row.id === 'U06')?.noMatch === true, studioHasResults: (rows.find((row) => row.id === 'U10')?.matchCount ?? 0) > 0, flagshipHasThreeStrategies: (rows.find((row) => row.id === 'U04')?.distinctStrategyCount ?? 0) >= 3 } };
await writeFile(path.join(reviewDir, 'phase2-ui-qa.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
