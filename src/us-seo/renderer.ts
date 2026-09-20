export interface DiagramItem {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: 'bed' | 'work' | 'storage' | 'fixed' | 'route' | 'feature';
}
export interface DiagramPlan {
  title: string;
  roomWidth: number;
  roomLength: number;
  unit: 'in' | 'ft';
  items: DiagramItem[];
  note?: string;
}

const fills: Record<NonNullable<DiagramItem['tone']>, string> = {
  bed: '#dce8e4',
  work: '#e8e0d4',
  storage: '#f1d8c7',
  fixed: '#d9dce8',
  route: '#eef4e8',
  feature: '#ece7d3',
};

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function overlaps(a: DiagramItem, b: DiagramItem): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function validateDiagram(plan: DiagramPlan): string[] {
  const errors: string[] = [];
  for (const item of plan.items) {
    if (item.width <= 0 || item.height <= 0) errors.push(`${plan.title}: ${item.label} has a non-positive footprint`);
    if (item.x < 0 || item.y < 0 || item.x + item.width > plan.roomWidth || item.y + item.height > plan.roomLength) {
      errors.push(`${plan.title}: ${item.label} extends outside the room`);
    }
  }
  for (let i = 0; i < plan.items.length; i += 1) {
    for (let j = i + 1; j < plan.items.length; j += 1) {
      if (overlaps(plan.items[i], plan.items[j])) errors.push(`${plan.title}: ${plan.items[i].label} overlaps ${plan.items[j].label}`);
    }
  }
  return errors;
}

export function renderFloorPlanSvg(plan: DiagramPlan): string {
  const validationErrors = validateDiagram(plan);
  if (validationErrors.length) throw new Error(validationErrors.join('; '));
  const labelSize = Math.max(Math.min(plan.roomWidth, plan.roomLength) / 18, plan.unit === 'ft' ? 0.55 : 3.2);
  const itemMarkup = plan.items.map((item) => {
    const tone = item.tone ?? 'feature';
    const textX = item.x + item.width / 2;
    const textY = item.y + item.height / 2;
    return `<g><rect x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" rx="${labelSize * 0.3}" fill="${fills[tone]}" stroke="#48655d" stroke-width="${labelSize * 0.12}"/><text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-size="${labelSize}" fill="#26352f" font-family="system-ui, sans-serif">${escapeXml(item.label)}</text></g>`;
  }).join('');
  const dimensionText = `${plan.roomWidth} × ${plan.roomLength} ${plan.unit}`;
  return `<svg class="us-seo-floor-plan" viewBox="0 0 ${plan.roomWidth} ${plan.roomLength}" role="img" aria-label="${escapeXml(`${plan.title}, ${dimensionText}`)}" xmlns="http://www.w3.org/2000/svg"><rect width="${plan.roomWidth}" height="${plan.roomLength}" fill="#fbfaf6" stroke="#26352f" stroke-width="${labelSize * 0.25}"/><text x="${plan.roomWidth / 2}" y="${labelSize * 1.1}" text-anchor="middle" font-size="${labelSize * 0.85}" fill="#69736b" font-family="system-ui, sans-serif">${escapeXml(dimensionText)}</text>${itemMarkup}</svg>`;
}
