import type { LayoutItem, LayoutRecord } from './types.ts';

export type LayoutRenderMode = 'simple' | 'measurements';

const itemFill: Record<string, string> = {
  bed: '#c9d9ce',
  desk: '#ead3bd',
  wardrobe: '#d9cfbb',
  dresser: '#dfd0c4',
  shelving: '#d8d2c0',
  'storage-cabinet': '#d8d2c0',
  chair: '#ead9c7',
  sofa: '#cbdbe1',
  loveseat: '#cbdbe1',
  'dining-table': '#e6d9ae',
  nightstand: '#d8d2c0',
  custom: '#deddd7',
};

const itemLabel: Record<string, string> = {
  bed: 'Bed', desk: 'Desk', wardrobe: 'Wardrobe', dresser: 'Dresser', shelving: 'Shelving',
  'storage-cabinet': 'Storage', chair: 'Chair', sofa: 'Sofa', loveseat: 'Loveseat',
  'dining-table': 'Dining', nightstand: 'Nightstand', custom: 'Item', door: 'Door', window: 'Window',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character));
}

function rotatedRect(item: LayoutItem): { x: number; y: number; width: number; height: number; transform: string } {
  const width = item.widthMm;
  const height = item.depthMm;
  const cx = item.xMm + width / 2;
  const cy = item.yMm + height / 2;
  return { x: item.xMm, y: item.yMm, width, height, transform: `rotate(${item.rotationDeg} ${cx} ${cy})` };
}

function renderItem(item: LayoutItem, mode: LayoutRenderMode): string {
  const rect = rotatedRect(item);
  const label = escapeHtml(item.label ?? itemLabel[item.type] ?? item.type);
  if (item.type === 'door') {
    const swing = item.swingMm ?? Math.max(item.widthMm, item.depthMm);
    return `<g class="rf-layout-fixture" transform="${rect.transform}"><line x1="${rect.x}" y1="${rect.y}" x2="${rect.x + rect.width}" y2="${rect.y}" stroke="#b86b3d" stroke-width="22"/><path d="M ${rect.x} ${rect.y} A ${swing} ${swing} 0 0 1 ${rect.x + swing} ${rect.y + swing}" fill="none" stroke="#b86b3d" stroke-width="7" stroke-dasharray="24 18"/><title>${label}</title></g>`;
  }
  if (item.type === 'window') {
    return `<g class="rf-layout-fixture" transform="${rect.transform}"><line x1="${rect.x}" y1="${rect.y}" x2="${rect.x + rect.width}" y2="${rect.y}" stroke="#1d5168" stroke-width="24"/><line x1="${rect.x}" y1="${rect.y + rect.height}" x2="${rect.x + rect.width}" y2="${rect.y + rect.height}" stroke="#1d5168" stroke-width="8"/><title>${label}</title></g>`;
  }
  const fill = itemFill[item.type] ?? itemFill.custom;
  const textY = rect.y + rect.height / 2 + 24;
  const measurement = mode === 'measurements'
    ? `<text x="${rect.x + rect.width / 2}" y="${rect.y + rect.height + 34}" text-anchor="middle" class="rf-layout-measure">${Math.round(rect.width)} × ${Math.round(rect.height)} mm</text>`
    : '';
  return `<g class="rf-layout-item" transform="${rect.transform}"><rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="22" fill="${fill}" stroke="#4a554c" stroke-width="10"/><text x="${rect.x + rect.width / 2}" y="${textY}" text-anchor="middle" class="rf-layout-label">${label}</text>${measurement}<title>${label}, ${Math.round(rect.width)} by ${Math.round(rect.height)} millimetres</title></g>`;
}

export function layoutTextSummary(layout: LayoutRecord, locale: 'en' | 'zh' = 'en'): string {
  const furniture = layout.furniture.filter((item) => item.type !== 'door' && item.type !== 'window');
  const bed = furniture.find((item) => item.type === 'bed');
  const desk = furniture.find((item) => item.type === 'desk');
  const wardrobe = furniture.find((item) => item.type === 'wardrobe');
  if (locale === 'zh') {
    const parts = [bed ? `床位在${bed.yMm < layout.roomLengthMm / 2 ? '北側' : '南側'}` : '', desk ? `書桌沿${desk.xMm < layout.roomWidthMm / 2 ? '西側' : '東側'}` : '', wardrobe ? '衣櫃靠近收納牆' : ''];
    return parts.filter(Boolean).join('，') || '家具依比例配置於房間內。';
  }
  const parts = [bed ? `Bed on the ${bed.yMm < layout.roomLengthMm / 2 ? 'north' : 'south'} wall` : '', desk ? `desk along the ${desk.xMm < layout.roomWidthMm / 2 ? 'west' : 'east'} side` : '', wardrobe ? 'wardrobe near the storage wall' : ''];
  return parts.filter(Boolean).join(', ') || 'Furniture is arranged to scale within the room.';
}

export function renderLayoutSvg(layout: LayoutRecord, options: { mode?: LayoutRenderMode; locale?: 'en' | 'zh'; labelledBy?: string } = {}): string {
  const mode = options.mode ?? 'simple';
  const locale = options.locale ?? 'en';
  const width = layout.roomWidthMm;
  const height = layout.roomLengthMm;
  const pad = Math.max(80, Math.round(Math.min(width, height) * 0.055));
  const title = escapeHtml(layout.archetype ?? layout.id);
  const description = escapeHtml(layoutTextSummary(layout, locale));
  const dimensions = mode === 'measurements'
    ? `<text x="${width / 2}" y="${height + pad * 0.7}" text-anchor="middle" class="rf-layout-dimension">${width} × ${height} mm</text>`
    : '';
  const items = layout.furniture.map((item) => renderItem(item, mode)).join('');
  return `<svg class="rf-layout-svg" viewBox="${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}" role="img" aria-labelledby="${options.labelledBy ?? ''}"><title>${title}</title><desc>${description}</desc><rect x="0" y="0" width="${width}" height="${height}" fill="#fbfaf6" stroke="#26352f" stroke-width="18"/><path d="M 0 ${height / 2} H ${width}" stroke="#e6e2d8" stroke-width="4" stroke-dasharray="18 18"/>${items}${dimensions}</svg>`;
}

export { escapeHtml };
