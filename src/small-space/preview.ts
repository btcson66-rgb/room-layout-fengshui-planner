import { findBedPreset, BED_PRESETS } from './presets.ts';
import { FURNITURE_PRESETS } from './furniture-presets.ts';
import { matchLayouts, selectDiverseTopMatches } from './matcher.ts';
import { layoutTextSummary, renderLayoutSvg } from './renderer.ts';
import type { FurnitureType, LayoutRecord, LayoutUnit } from './types.ts';
import { trackProductEvent } from '../moving-os/productAnalytics.ts';

type Locale = 'en' | 'zh';
const PRODUCT_ID = 'roomfeng-layout-vault-v1';

const copy = {
  en: {
    room: 'Room size', width: 'Width', length: 'Length', unit: 'Unit', sleep: 'Sleep setup', region: 'Region', bed: 'Bed', furniture: 'Must fit', priority: 'Priority', match: 'Find my starting point', work: 'Work from home', storage: 'Storage', open: 'Open space', circulation: 'Easy circulation', result: 'Your complete preview result', noMatch: 'No sample layout matches this combination yet.', noMatchHelp: 'Try a slightly larger room or fewer required pieces.', strong: 'Validated starting point', why: 'Why it fits', tradeoff: 'Trade-off', more: 'See the full Layout Vault', privacy: 'Your room inputs stay in this browser; analytics receives only product and broad interaction context.', desk: 'Desk', wardrobe: 'Wardrobe', studio: 'Studio', bedroom: 'Bedroom', us: 'United States', tw: 'Taiwan', eu: 'Metric / Europe', selected: 'selected', dimensions: 'dimensions', placeholder: 'e.g. 10', none: 'None', bedHint: 'Bed presets are regional planning references. Check the actual frame before buying.',
  },
  zh: {
    room: '房間尺寸', width: '寬度', length: '長度', unit: '單位', sleep: '睡眠設定', region: '地區', bed: '床型', furniture: '一定要放', priority: '優先順序', match: '配對我的起點', work: '在家工作', storage: '收納', open: '開闊空間', circulation: '好走動', result: '你的完整預覽結果', noMatch: '目前沒有符合這組條件的範例格局。', noMatchHelp: '試著放大房間，或先移除一件必要家具。', strong: '已驗證的可靠起點', why: '為什麼符合', tradeoff: '取捨', more: '查看完整小空間格局庫', privacy: '房間輸入留在這個瀏覽器；分析只接收產品與寬泛互動情境。', desk: '書桌', wardrobe: '衣櫃', studio: '套房', bedroom: '臥室', us: '美國', tw: '台灣', eu: '公制／歐洲', selected: '已選', dimensions: '尺寸', placeholder: '例如 300', none: '無', bedHint: '床墊尺寸是地區規劃參考，購買前請核對實際床架。',
  },
} as const;

const bedOptions = (region: string) => BED_PRESETS.filter((preset) => region === 'us' ? preset.region === 'us' : region === 'tw' ? preset.region === 'tw' : ['eu', 'uk'].includes(preset.region));
const preset = (id: string) => FURNITURE_PRESETS.find((item) => item.id === id);
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

export function initLayoutVaultPreview(formHost: HTMLElement, resultHost: HTMLElement, layouts: LayoutRecord[], locale: Locale, salesHref: string): void {
  const t = copy[locale];
  const initialRegion = locale === 'zh' ? 'tw' : 'us';
  const initialUnit: LayoutUnit = locale === 'zh' ? 'cm' : 'ft';
  const renderForm = (region = initialRegion): void => {
    const options = bedOptions(region);
    formHost.innerHTML = `<form class="layout-preview-form" data-preview-form>
      <fieldset><legend>${t.room}</legend><div class="preview-grid"><label>${t.width}<input name="width" type="number" min="1" step="any" value="${locale === 'zh' ? '300' : '10'}" required></label><label>${t.length}<input name="length" type="number" min="1" step="any" value="${locale === 'zh' ? '360' : '12'}" required></label><label>${t.unit}<select name="unit"><option value="cm" ${initialUnit === 'cm' ? 'selected' : ''}>cm</option><option value="m">m</option><option value="mm">mm</option><option value="ft" ${initialUnit === 'ft' ? 'selected' : ''}>ft / in</option><option value="in">in</option></select></label><label>${t.room}<select name="roomKind"><option value="bedroom">${t.bedroom}</option><option value="studio">${t.studio}</option></select></label></div></fieldset>
      <fieldset><legend>${t.sleep}</legend><label>${t.region}<select name="region"><option value="us" ${region === 'us' ? 'selected' : ''}>${t.us}</option><option value="tw" ${region === 'tw' ? 'selected' : ''}>${t.tw}</option><option value="eu" ${region === 'eu' ? 'selected' : ''}>${t.eu}</option></select></label><label>${t.bed}<select name="bed">${options.map((item) => `<option value="${item.id}">${esc(item.label)} · ${item.widthMm} × ${item.depthMm} mm</option>`).join('')}</select></label><p class="preview-note">${t.bedHint}</p></fieldset>
      <fieldset><legend>${t.furniture}</legend><div class="preview-choice"><label><input type="checkbox" name="furniture" value="desk" checked> ${t.desk}</label><label><input type="checkbox" name="furniture" value="wardrobe"> ${t.wardrobe}</label></div></fieldset>
      <fieldset><legend>${t.priority}</legend><div class="preview-choice"><label><input type="radio" name="priority" value="work" checked> ${t.work}</label><label><input type="radio" name="priority" value="storage"> ${t.storage}</label><label><input type="radio" name="priority" value="open"> ${t.open}</label><label><input type="radio" name="priority" value="circulation"> ${t.circulation}</label></div></fieldset>
      <button type="submit">${t.match}</button><p class="preview-note">${t.privacy}</p>
    </form>`;
    formHost.querySelector<HTMLSelectElement>('select[name="region"]')?.addEventListener('change', (event) => renderForm((event.currentTarget as HTMLSelectElement).value));
    formHost.querySelector<HTMLFormElement>('[data-preview-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const width = Number(data.get('width')); const length = Number(data.get('length')); const unit = String(data.get('unit')) as LayoutUnit;
      const bedId = String(data.get('bed')); const roomKind = String(data.get('roomKind'));
      const required: FurnitureType[] = ['bed'];
      form.querySelectorAll<HTMLInputElement>('input[name="furniture"]:checked').forEach((input) => required.push(input.value as FurnitureType));
      const furnitureSizesMm: Partial<Record<FurnitureType, { widthMm: number; depthMm: number }>> = {};
      for (const type of required.filter((value) => value !== 'bed')) {
        const chosen = type === 'desk' ? preset('desk-standard') : preset('wardrobe-standard-hinged');
        if (chosen) furnitureSizesMm[type] = { widthMm: chosen.widthMm, depthMm: chosen.depthMm };
      }
      const bed = findBedPreset(bedId);
      const matches = matchLayouts(layouts, { width, length, unit, shape: 'rectangle', occupancy: roomKind === 'studio' ? 'single' : 'single', requiredFurniture: required, priorities: [String(data.get('priority') ?? 'work')], locale: locale === 'en' ? 'en-US' : 'zh-TW', bedWidthMm: bed?.widthMm, bedDepthMm: bed?.depthMm, furnitureSizesMm });
      trackProductEvent('product_preview_view', 'free_match_result', locale, { product_id: PRODUCT_ID });
      const top = selectDiverseTopMatches(matches, 1)[0];
      if (!top) { resultHost.innerHTML = `<div class="preview-empty" role="status"><h3>${t.noMatch}</h3><p>${t.noMatchHelp}</p><a class="preview-upgrade" href="${salesHref}">${t.more}</a></div>`; return; }
      const reasons = top.whyItMatches.slice(0, 2).map((item) => `<li>${esc(item)}</li>`).join('');
      const tradeoff = esc(top.tradeoffs[0] ?? top.layout.tradeOff ?? 'Check the actual furniture and fixed elements before buying.');
      resultHost.innerHTML = `<div class="preview-match"><div class="preview-plan">${renderLayoutSvg(top.layout, { locale, mode: 'simple' })}</div><div class="preview-meta"><span class="preview-badge">${t.strong} · ${Math.round(top.score)}%</span><h3>${esc(top.layout.archetype ?? top.layout.id)}</h3><p>${esc(layoutTextSummary(top.layout, locale))}</p><h4>${t.why}</h4><ul>${reasons || `<li>${locale === 'en' ? 'Fits the sample room dimensions and required furniture.' : '符合範例房間尺寸與必要家具。'}</li>`}</ul><h4>${t.tradeoff}</h4><p>${tradeoff}</p><a class="preview-upgrade" href="${salesHref}" data-preview-upgrade>${t.more}</a></div></div>`;
      trackProductEvent('product_cta_view', 'preview_upgrade', locale, { product_id: PRODUCT_ID });
      resultHost.querySelector('[data-preview-upgrade]')?.addEventListener('click', () => trackProductEvent('product_cta_click', 'preview_upgrade', locale, { product_id: PRODUCT_ID }));
    });
  };
  renderForm();
}
