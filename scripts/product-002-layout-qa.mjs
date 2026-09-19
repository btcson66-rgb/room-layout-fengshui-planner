import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs', 'product-002', 'review');
const approved = JSON.parse(await readFile(path.join(dir, 'approved-layouts.json'), 'utf8'));
const rejected = JSON.parse(await readFile(path.join(dir, 'rejected-layouts.json'), 'utf8'));
const report = JSON.parse(await readFile(path.join(dir, 'validation-report.json'), 'utf8'));
const personaReport = JSON.parse(await readFile(path.join(dir, 'matcher-persona-ranking.json'), 'utf8'));
const familyTargets = ['compact-single-bedroom', 'compact-single-plus-bedroom', 'square-small-bedroom', 'narrow-bedroom', 'medium-narrow-bedroom', '10x12-bedroom', 'medium-bedroom', 'wider-bedroom', 'micro-studio', 'small-studio'];
const errors = [];
if (report.candidateCount < 45) errors.push(`candidate pool ${report.candidateCount} < 45`);
if (approved.length < 30) errors.push(`approved ${approved.length} < 30`);
for (const family of familyTargets) {
  const count = approved.filter((layout) => layout.family === family).length;
  if (count < 3) errors.push(`${family} approved ${count} < 3`);
}
for (const layout of approved) {
  if (layout.qualityStatus !== 'approved') errors.push(`${layout.id} not approved`);
  if (!layout.visualReview?.pass || !layout.functionalReview?.pass || !layout.distinctivenessReview?.pass) errors.push(`${layout.id} missing review gates`);
  if (!layout.bestFor || !layout.tradeOff) errors.push(`${layout.id} missing bestFor/tradeOff`);
  if (!layout.validation?.valid) errors.push(`${layout.id} geometry invalid`);
  if (layout.furniture.some((item) => item.type === 'bed' && item.footprintBasis !== 'mattress')) errors.push(`${layout.id} bed footprint basis missing`);
}
if (rejected.length < 1) errors.push('reject registry empty');
if (personaReport.personaCount !== 10) errors.push(`persona count ${personaReport.personaCount} != 10`);
if (personaReport.rows.some((row) => !row.top3.length)) errors.push('persona has no top-three result');
if (personaReport.rows.some((row) => !row.top1ExpectedFamily)) errors.push('persona top-1 family requires matcher review');
console.log(JSON.stringify({ candidateCount: report.candidateCount, approvedCount: approved.length, rejectedCount: rejected.length, pass: errors.length === 0, errors }, null, 2));
if (errors.length) process.exitCode = 1;
