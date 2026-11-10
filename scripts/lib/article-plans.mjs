// 文章內平面示意圖（frontmatter `plans`）的稽核。
// 圖是資料驅動的：房間與家具座標都在 frontmatter，內文要自己把同一組尺寸寫出來，
// 圖才不是憑空捏造的情境。這裡只做「可機器驗證」的部分：
//   1. 錨點：`after` 必須對應內文裡一個完全相符的 H2；
//   2. 渲染：build 後的 HTML 必須在該 H2 與下一個 H2 之間有對應的 <figure data-plan-id>；
//   3. 幾何：家具、區域、門窗、牆面物件、視線都在房間內，家具之間不重疊；
//   4. 尺寸一致：房間尺寸與每件家具的「寬 × 深」都必須在內文出現（任一方向）。
import { parse } from 'yaml';

export function parsePlans(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return [];
  const data = parse(match[1]) ?? {};
  return Array.isArray(data.plans) ? data.plans : [];
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const num = (value) => escapeRegExp(String(value));
const SEP = '\\s*[×xX*＊]\\s*';

export function sizeMentioned(body, a, b) {
  const forward = new RegExp(`(?<![\\d.])${num(a)}${SEP}${num(b)}(?![\\d])`);
  const backward = new RegExp(`(?<![\\d.])${num(b)}${SEP}${num(a)}(?![\\d])`);
  return forward.test(body) || backward.test(body);
}

const overlaps = (a, b) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.depth - 0.5 && b.y < a.y + a.depth - 0.5;

export function geometryProblems(plan) {
  const problems = [];
  const { roomWidthCm: W, roomLengthCm: L } = plan;
  const inside = (x, y, width, depth) => x >= 0 && y >= 0 && x + width <= W && y + depth <= L;
  const furniture = plan.furniture ?? [];
  for (const item of furniture) {
    if (!inside(item.x, item.y, item.width, item.depth)) {
      problems.push(`furniture "${item.label}" (${item.x},${item.y} ${item.width}×${item.depth}) is outside the ${W}×${L} room`);
    }
  }
  for (let i = 0; i < furniture.length; i += 1) {
    for (let j = i + 1; j < furniture.length; j += 1) {
      if (overlaps(furniture[i], furniture[j])) problems.push(`furniture "${furniture[i].label}" overlaps "${furniture[j].label}"`);
    }
  }
  for (const zone of plan.zones ?? []) {
    if (!inside(zone.x, zone.y, zone.width, zone.depth)) problems.push(`zone "${zone.label}" is outside the room`);
  }
  for (const entry of [...(plan.openings ?? []), ...(plan.wallItems ?? [])]) {
    const wallLength = entry.wall === 'top' || entry.wall === 'bottom' ? W : L;
    const name = entry.label ?? entry.kind ?? 'item';
    if (entry.offset < 0 || entry.offset + entry.width > wallLength) {
      problems.push(`${name} on the ${entry.wall} wall (offset ${entry.offset}, width ${entry.width}) runs past the ${wallLength} cm wall`);
    }
  }
  for (const line of plan.sightLines ?? []) {
    for (const [x, y] of line.points) {
      if (x < 0 || y < 0 || x > W || y > L) problems.push(`sight line point (${x},${y}) is outside the room`);
    }
  }
  return problems;
}

export function textProblems(plan, body) {
  const problems = [];
  if (!sizeMentioned(body, plan.roomWidthCm, plan.roomLengthCm)) {
    problems.push(`room ${plan.roomWidthCm} × ${plan.roomLengthCm} is not stated in the article text`);
  }
  for (const item of plan.furniture ?? []) {
    if (!sizeMentioned(body, item.width, item.depth)) {
      problems.push(`"${item.label}" ${item.width} × ${item.depth} is not stated in the article text`);
    }
  }
  return problems;
}

export function anchorProblems(plan, body) {
  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
  const count = headings.filter((heading) => heading === plan.after.trim()).length;
  return count === 1 ? [] : [`anchor H2 "${plan.after}" matched ${count} headings (need exactly 1)`];
}

/** html: the built page. Returns problems if the figure is missing or not between the anchor H2 and the next H2. */
export function renderProblems(plan, body, html) {
  const problems = [];
  const figureMatches = [...html.matchAll(new RegExp(`<figure[^>]*data-plan-id="${escapeRegExp(plan.id)}"`, 'g'))];
  if (figureMatches.length !== 1) return [`built page has ${figureMatches.length} figures for plan "${plan.id}" (need exactly 1)`];
  const figureIndex = figureMatches[0].index;
  const h2s = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((match) => ({
    index: match.index,
    end: match.index + match[0].length,
    text: match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(),
  }));
  const anchorIndex = h2s.findIndex((heading) => heading.text === plan.after.trim());
  if (anchorIndex === -1) return [`built page has no H2 "${plan.after}"`];
  const next = h2s[anchorIndex + 1]?.index ?? Infinity;
  if (!(figureIndex > h2s[anchorIndex].end && figureIndex < next)) problems.push(`figure "${plan.id}" is not rendered right after H2 "${plan.after}"`);
  if (!/<figcaption\b[\s\S]*?<\/figcaption>/.test(html.slice(figureIndex, figureIndex + 20000))) problems.push(`figure "${plan.id}" has no figcaption`);
  return problems;
}
