import { runFengShuiChecks, runStructuralChecks } from './checks';
import { buildPdfBlob, exportPdf, exportPng, svgToPngBlob } from './export';
import { defaultDesign, makeItem, templateDesigns } from './templates';
import type { Design, FurnitureItem, FurnitureType, PlannerOptions, PlannerStrings, Unit } from './types';
import { formatArea, fromCm, toCm } from './units';
import { readPlannerHandoff } from '../small-space/handoff';
import { readQuickPlannerHandoff } from './quick-handoff';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_STORAGE_KEY = 'room-layout-planner:draft';
const MIN_ITEM_SIZE = 10;
const PAD = 24;
const FURNITURE_TYPES: FurnitureType[] = ['bed', 'desk', 'wardrobe', 'sofa', 'diningTable', 'door', 'window', 'mirror'];

interface PlannerState {
  design: Design;
  selectedId: string | null;
  dragging: {
    id: string;
    offsetX: number;
    offsetY: number;
  } | null;
  resizing: {
    id: string;
    startW: number;
    startH: number;
    centerX: number;
    centerY: number;
    rotation: number;
    pointerLocalX: number;
    pointerLocalY: number;
  } | null;
  saveTimer: number | undefined;
}

function cloneDesign(design: Design): Design {
  return JSON.parse(JSON.stringify(design)) as Design;
}

function isDesign(value: unknown): value is Design {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Design>;
  return Boolean(candidate.room && Array.isArray(candidate.items));
}

/**
 * 文章與 Hub 頁的 CTA 用 `?preset=<key>` deep-link 進來，直接載入對應的範例格局。
 * 這讓「用 Room Planner 模擬你的床、書桌與門」變成一次點擊就到位的動作，
 * 而不是進到工具後還要自己找範例按鈕。
 *
 * 只有網址真的帶了合法 preset 時才覆蓋草稿；沒帶或帶了不存在的 key 一律
 * 回到既有行為（讀 localStorage 草稿），避免不小心洗掉讀者畫到一半的房間。
 */
function presetFromLocation(strings: PlannerStrings): Design | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('preset');
  if (!requested) return null;
  const presets = templateDesigns(strings.furniture);
  const match = Object.prototype.hasOwnProperty.call(presets, requested) ? presets[requested] : null;
  return match ? cloneDesign(match) : null;
}

function loadDesign(storageKey: string, strings: PlannerStrings): Design {
  const handoff = readPlannerHandoff();
  if (handoff) return cloneDesign(handoff);
  const quickHandoff = readQuickPlannerHandoff(strings);
  if (quickHandoff) return cloneDesign(quickHandoff);
  const preset = presetFromLocation(strings);
  if (preset) return preset;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return defaultDesign(strings.furniture);
  try {
    const parsed: unknown = JSON.parse(stored);
    if (isDesign(parsed)) return parsed;
  } catch {
    localStorage.removeItem(storageKey);
  }
  return defaultDesign(strings.furniture);
}

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function localPoint(svg: SVGSVGElement, event: PointerEvent): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x - PAD, y: transformed.y - PAD };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function rotatePoint(x: number, y: number, centerX: number, centerY: number, angleDeg: number): { x: number; y: number } {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

function createLabeledInput(label: string, input: HTMLInputElement | HTMLSelectElement, options: { hiddenLabel?: boolean } = {}): HTMLLabelElement {
  const wrapper = document.createElement('label');
  wrapper.className = 'planner-field';
  const text = document.createElement('span');
  if (options.hiddenLabel) text.className = 'planner-sr-only';
  text.textContent = label;
  wrapper.append(text, input);
  return wrapper;
}

function drawFurniture(parent: SVGGElement, item: FurnitureItem, strings: PlannerStrings, selected: boolean): void {
  const label = item.label ?? strings.furniture[item.type];
  const group = svgEl('g', {
    class: `planner-item ${selected ? 'is-selected' : ''}`,
    tabindex: '0',
    role: 'button',
    'aria-label': `${label}${selected ? strings.accessibility.selectedSuffix : ''}`,
    'aria-pressed': selected ? 'true' : 'false',
    'data-id': item.id,
    transform: `rotate(${item.rotation} ${item.x + item.w / 2} ${item.y + item.h / 2})`,
  });

  if (item.type === 'door') {
    group.append(svgEl('path', {
      d: `M ${item.x} ${item.y + item.h} A ${item.w} ${item.w} 0 0 1 ${item.x + item.w} ${item.y + item.w + item.h}`,
      fill: 'none',
      stroke: '#b86b3d',
      'stroke-width': 3,
    }));
    group.append(svgEl('line', { x1: item.x, y1: item.y + item.h, x2: item.x + item.w, y2: item.y + item.h, stroke: '#7b4a2d', 'stroke-width': 5 }));
  } else if (item.type === 'window') {
    group.append(svgEl('line', { x1: item.x, y1: item.y, x2: item.x + item.w, y2: item.y, stroke: '#1d5168', 'stroke-width': 4 }));
    group.append(svgEl('line', { x1: item.x, y1: item.y + item.h, x2: item.x + item.w, y2: item.y + item.h, stroke: '#1d5168', 'stroke-width': 4 }));
  } else if (item.type === 'mirror') {
    group.append(svgEl('rect', { x: item.x, y: item.y, width: item.w, height: Math.max(item.h, 18), rx: 2, fill: '#e7f0f5', stroke: '#1d5168', 'stroke-width': 2 }));
    for (let offset = 6; offset < item.w; offset += 14) {
      group.append(svgEl('line', { x1: item.x + offset, y1: item.y + 2, x2: item.x + offset - 8, y2: item.y + Math.max(item.h, 18) - 2, stroke: '#8ab0c1', 'stroke-width': 1 }));
    }
  } else {
    const fillByType: Record<string, string> = {
      bed: '#dfeadf',
      desk: '#f1e2d5',
      wardrobe: '#e8e0cf',
      sofa: '#dce7ee',
      diningTable: '#efe5c8',
      custom: '#e8e5e0',
    };
    group.append(svgEl('rect', { x: item.x, y: item.y, width: item.w, height: item.h, rx: 4, fill: fillByType[item.type], stroke: '#646158', 'stroke-width': 2 }));
    if (item.type === 'bed') {
      group.append(svgEl('rect', { x: item.x + 8, y: item.y + 8, width: item.w - 16, height: 30, rx: 3, fill: '#ffffff', stroke: '#9da795', 'stroke-width': 1 }));
    }
  }

  const text = svgEl('text', { x: item.x + item.w / 2, y: item.y + Math.max(22, item.h / 2), 'text-anchor': 'middle', 'font-size': 13, 'pointer-events': 'none' });
  text.textContent = label;
  group.append(text);

  if (selected) {
    group.append(svgEl('rect', { x: item.x - 4, y: item.y - 4, width: item.w + 8, height: item.h + 8, rx: 5, fill: 'none', stroke: '#526a5d', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
    group.append(svgEl('rect', { x: item.x + item.w - 6, y: item.y + item.h - 6, width: 12, height: 12, rx: 2, fill: '#526a5d', 'data-resize': item.id, style: 'cursor:nwse-resize' }));
  }

  parent.append(group);
}

function renderEmptyHint(svg: SVGSVGElement, room: Design['room'], message: string): void {
  const cx = room.w / 2 + PAD;
  const cy = room.h / 2 + PAD;
  const hint = svgEl('text', {
    x: cx, y: cy,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    'font-size': 14,
    fill: '#a09e98',
    'pointer-events': 'none',
  });
  hint.textContent = message;
  svg.append(hint);
}

function renderGrid(svg: SVGSVGElement, room: Design['room']): void {
  const defs = svgEl('defs');
  const pattern = svgEl('pattern', { id: 'planner-grid', width: 50, height: 50, patternUnits: 'userSpaceOnUse' });
  pattern.append(svgEl('path', { d: 'M 50 0 L 0 0 0 50', fill: 'none', stroke: '#ded8ca', 'stroke-width': 1 }));
  defs.append(pattern);
  svg.append(defs);
  svg.append(svgEl('rect', { x: PAD, y: PAD, width: room.w, height: room.h, fill: 'url(#planner-grid)' }));
}

function appendRoomOutline(group: SVGGElement, design: Design): void {
  const door = design.items.find((item) => item.type === 'door');
  const stroke = '#24231f';
  const width = 3;
  const addLine = (x1: number, y1: number, x2: number, y2: number): void => {
    group.append(svgEl('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'square' }));
  };

  if (!door) {
    group.append(svgEl('rect', { x: 0, y: 0, width: design.room.w, height: design.room.h, fill: 'none', stroke, 'stroke-width': width }));
    return;
  }

  const gap = Math.max(50, door.w);
  const onLeft = door.x <= 8;
  const onRight = Math.abs(door.x + door.h - design.room.w) <= 16 || Math.abs(door.x + door.w - design.room.w) <= 16;
  const onTop = door.y <= 8;
  const onBottom = Math.abs(door.y + door.h - design.room.h) <= 16 || Math.abs(door.y + door.w - design.room.h) <= 16;

  if (onLeft) {
    const start = Math.max(0, Math.min(design.room.h, door.y));
    const end = Math.max(0, Math.min(design.room.h, start + gap));
    addLine(0, 0, design.room.w, 0);
    addLine(design.room.w, 0, design.room.w, design.room.h);
    addLine(design.room.w, design.room.h, 0, design.room.h);
    addLine(0, 0, 0, start);
    addLine(0, end, 0, design.room.h);
    return;
  }

  if (onTop) {
    const start = Math.max(0, Math.min(design.room.w, door.x));
    const end = Math.max(0, Math.min(design.room.w, start + gap));
    addLine(0, 0, start, 0);
    addLine(end, 0, design.room.w, 0);
    addLine(design.room.w, 0, design.room.w, design.room.h);
    addLine(design.room.w, design.room.h, 0, design.room.h);
    addLine(0, design.room.h, 0, 0);
    return;
  }

  if (onRight) {
    const start = Math.max(0, Math.min(design.room.h, door.y));
    const end = Math.max(0, Math.min(design.room.h, start + gap));
    addLine(0, 0, design.room.w, 0);
    addLine(0, design.room.h, 0, 0);
    addLine(design.room.w, design.room.h, 0, design.room.h);
    addLine(design.room.w, 0, design.room.w, start);
    addLine(design.room.w, end, design.room.w, design.room.h);
    return;
  }

  if (onBottom) {
    const start = Math.max(0, Math.min(design.room.w, door.x));
    const end = Math.max(0, Math.min(design.room.w, start + gap));
    addLine(0, 0, design.room.w, 0);
    addLine(design.room.w, 0, design.room.w, design.room.h);
    addLine(design.room.w, design.room.h, end, design.room.h);
    addLine(start, design.room.h, 0, design.room.h);
    addLine(0, design.room.h, 0, 0);
    return;
  }

  group.append(svgEl('rect', { x: 0, y: 0, width: design.room.w, height: design.room.h, fill: 'none', stroke, 'stroke-width': width }));
}

function renderSvg(svg: SVGSVGElement, state: PlannerState, strings: PlannerStrings): void {
  const { room, items } = state.design;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${room.w + PAD * 2} ${room.h + PAD * 2}`);
  renderGrid(svg, room);
  const roomGroup = svgEl('g', { transform: `translate(${PAD} ${PAD})` });
  appendRoomOutline(roomGroup, state.design);
  items.forEach((item) => drawFurniture(roomGroup, item, strings, item.id === state.selectedId));
  svg.append(roomGroup);
}

function renderWarnings(container: HTMLElement, title: string, warnings: ReturnType<typeof runStructuralChecks>, empty: string, disclaimer?: string): void {
  container.replaceChildren();
  const heading = document.createElement('h3');
  heading.textContent = title;
  container.append(heading);
  if (warnings.length === 0) {
    const ok = document.createElement('p');
    ok.className = 'planner-muted';
    ok.textContent = empty;
    container.append(ok);
    return;
  }
  const list = document.createElement('ul');
  list.className = 'planner-warning-list';
  warnings.forEach((warning) => {
    const item = document.createElement('li');
    const badge = document.createElement('span');
    badge.className = `warning-badge ${warning.severity === 'info' ? 'info' : ''}`;
    badge.textContent = warning.severity;
    const message = document.createElement('span');
    message.textContent = warning.message;
    item.append(badge, message);
    if (disclaimer) {
      const link = document.createElement('a');
      link.href = '/disclaimer/';
      link.textContent = disclaimer;
      item.append(' ', link);
    }
    list.append(item);
  });
  container.append(list);
}

function renderReportPreview(container: HTMLElement, state: PlannerState, strings: PlannerStrings): void {
  const checks = runStructuralChecks(state.design, strings);
  const { room, items } = state.design;
  container.replaceChildren();
  const heading = document.createElement('div');
  heading.className = 'planner-report-heading';
  heading.innerHTML = `<div><p class="eyebrow">${strings.report.eyebrow}</p><h3>${strings.report.title}</h3></div><span class="planner-report-status">${strings.report.status}</span>`;
  const summary = document.createElement('div');
  summary.className = 'planner-report-summary';
  summary.innerHTML = `<div><span>${strings.report.room}</span><strong>${Math.round(room.w)} × ${Math.round(room.h)} ${room.unit}</strong></div><div><span>${strings.report.area}</span><strong>${formatArea(room.w, room.h, room.unit)}</strong></div><div><span>${strings.report.furniture}</span><strong>${items.length}</strong></div><div><span>${strings.report.checks}</span><strong>${checks.length === 0 ? strings.report.checksPass : strings.report.checksNeedsReview(checks.length)}</strong></div>`;
  const list = document.createElement('ul');
  list.className = 'planner-report-items';
  items.slice(0, 5).forEach((item) => {
    const row = document.createElement('li');
    row.textContent = `${item.label ?? strings.furniture[item.type]} · ${Math.round(item.w)} × ${Math.round(item.h)} ${room.unit}`;
    list.append(row);
  });
  if (items.length > 5) {
    const more = document.createElement('li');
    more.textContent = strings.report.moreItems(items.length - 5);
    list.append(more);
  }
  const note = document.createElement('p');
  note.className = 'planner-muted';
  note.textContent = strings.report.note;
  container.append(heading, summary, list, note);
}

function createNumberInput(value: number, step: number): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = String(step);
  input.value = String(value);
  return input;
}

export function initPlanner(container: HTMLElement, options: PlannerOptions): void {
  const strings = options.strings;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const state: PlannerState = {
    design: loadDesign(storageKey, strings),
    selectedId: null,
    dragging: null,
    resizing: null,
    saveTimer: undefined,
  };

  container.classList.add('planner-tool');
  container.innerHTML = `
    <div class="planner-shell">
      <nav class="planner-rail" aria-label="${strings.navigation.toolsLabel}">
        <button type="button" class="planner-rail-button is-active" data-planner-open="room" aria-controls="planner-drawer" aria-expanded="false"><span aria-hidden="true">▦</span><span>${strings.navigation.room}</span></button>
        <button type="button" class="planner-rail-button" data-planner-open="furniture" aria-controls="planner-drawer" aria-expanded="false"><span aria-hidden="true">＋</span><span>${strings.navigation.furniture}</span></button>
        <button type="button" class="planner-rail-button" data-planner-open="templates" aria-controls="planner-drawer" aria-expanded="false"><span aria-hidden="true">◇</span><span>${strings.navigation.templates}</span></button>
        <button type="button" class="planner-rail-button" data-planner-open="checks" aria-controls="planner-inspector" aria-expanded="false"><span aria-hidden="true">✓</span><span>${strings.navigation.checks}</span></button>
      </nav>
      <section class="planner-drawer" id="planner-drawer" hidden aria-label="${strings.navigation.toolsLabel}">
        <div class="planner-drawer-header"><div><p class="eyebrow">${strings.navigation.setupEyebrow}</p><h2 data-planner-drawer-title>${strings.drawer.roomTitle}</h2></div><button type="button" class="planner-drawer-close" data-planner-close aria-label="${strings.navigation.closeDrawer}">×</button></div>
        <section class="planner-panel planner-controls" aria-label="Planner controls"></section>
        <section class="planner-panel planner-drawer-checks" data-planner-panel="checks" hidden aria-label="Planner checks"></section>
        <section class="planner-panel planner-drawer-report" data-planner-panel="report" hidden aria-label="Export report"></section>
      </section>
      <section class="planner-canvas-wrap" aria-label="${strings.navigation.canvasLabel}">
        <div class="planner-canvas-header"><div class="planner-area-line"></div><span class="planner-canvas-hint">${strings.navigation.canvasHint}</span></div>
        <svg class="planner-svg" role="group" aria-label="${strings.navigation.canvasLabel}"></svg>
        <div class="planner-report-preview" aria-label="Export report preview"></div>
        <div class="planner-mobile-actions" aria-label="${strings.navigation.mobileActionsLabel}">
          <button type="button" class="planner-mobile-action" data-planner-open="room">${strings.navigation.room}</button>
          <button type="button" class="planner-mobile-action" data-planner-open="furniture">${strings.navigation.furniture}</button>
          <button type="button" class="planner-mobile-action" data-planner-open="checks">${strings.navigation.checks}</button>
          <button type="button" class="planner-mobile-action" data-planner-open="report">${strings.navigation.report}</button>
        </div>
      </section>
      <aside class="planner-panel planner-side" id="planner-inspector" aria-label="Planner checks">
        <div class="planner-selection"></div>
        <div class="planner-structural"></div>
        <div class="planner-feng"></div>
      </aside>
    </div>
  `;

  const controls = container.querySelector<HTMLElement>('.planner-controls');
  const svg = container.querySelector<SVGSVGElement>('.planner-svg');
  const areaLine = container.querySelector<HTMLElement>('.planner-area-line');
  const reportPreview = container.querySelector<HTMLElement>('.planner-report-preview');
  const selection = container.querySelector<HTMLElement>('.planner-selection');
  const structural = container.querySelector<HTMLElement>('.planner-structural');
  const feng = container.querySelector<HTMLElement>('.planner-feng');
  const drawer = container.querySelector<HTMLElement>('.planner-drawer');
  const drawerChecks = container.querySelector<HTMLElement>('.planner-drawer-checks');
  const drawerReport = container.querySelector<HTMLElement>('.planner-drawer-report');
  const drawerTitle = container.querySelector<HTMLElement>('[data-planner-drawer-title]');
  if (!controls || !svg || !areaLine || !reportPreview || !selection || !structural || !feng || !drawer || !drawerChecks || !drawerReport || !drawerTitle) return;
  if (import.meta.env.DEV || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    const testWindow = window as typeof window & { __roomfengExportTest?: { png: () => Promise<Blob>; pdf: () => Promise<Blob> } };
    testWindow.__roomfengExportTest = {
      png: () => svgToPngBlob(svg, state.design, strings),
      pdf: () => buildPdfBlob(svg, state.design, strings),
    };
  }
  const selectionPanel = selection;
  let lastTrigger: HTMLButtonElement | null = null;
  const panelTitles: Record<string, string> = {
    room: strings.drawer.roomTitle,
    furniture: strings.drawer.furnitureTitle,
    templates: strings.drawer.templatesTitle,
    checks: strings.drawer.checksTitle,
    report: strings.drawer.reportTitle,
  };

  const closeDrawer = (): void => {
    drawer.hidden = true;
    drawer.dataset.panel = '';
    container.querySelectorAll<HTMLButtonElement>('[data-planner-open]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    lastTrigger?.focus({ preventScroll: true });
  };

  const openDrawer = (panel: string): void => {
    drawer.hidden = false;
    drawer.dataset.panel = panel;
    drawerTitle.textContent = panelTitles[panel] ?? 'Planner';
    controls.querySelectorAll<HTMLElement>('[data-planner-panel]').forEach((section) => {
      section.hidden = section.dataset.plannerPanel !== panel;
    });
    drawerChecks.hidden = panel !== 'checks';
    drawerReport.hidden = panel !== 'report';
    container.querySelectorAll<HTMLButtonElement>('[data-planner-open]').forEach((button) => button.setAttribute('aria-expanded', button.dataset.plannerOpen === panel ? 'true' : 'false'));
    const focusTarget = panel === 'checks' ? drawerChecks.querySelector<HTMLElement>('a, button, input, select') : panel === 'report' ? drawerReport.querySelector<HTMLElement>('a, button, input, select') : controls.querySelector<HTMLElement>(`[data-planner-panel="${panel}"] input, [data-planner-panel="${panel}"] select, [data-planner-panel="${panel}"] button`);
    focusTarget?.focus({ preventScroll: true });
  };

  container.querySelectorAll<HTMLButtonElement>('[data-planner-open]').forEach((button) => {
    button.addEventListener('click', () => {
      lastTrigger = button;
      if (!drawer.hidden && drawer.dataset.panel === button.dataset.plannerOpen) closeDrawer();
      else openDrawer(button.dataset.plannerOpen ?? 'room');
    });
  });
  container.querySelector<HTMLButtonElement>('[data-planner-close]')?.addEventListener('click', closeDrawer);
  drawer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer();
    }
  });

  const saveNow = (): void => {
    localStorage.setItem(storageKey, JSON.stringify(state.design));
    const status = controls.querySelector<HTMLElement>('.planner-save-status');
    if (status) status.textContent = strings.saveStatus;
  };

  const scheduleSave = (): void => {
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(saveNow, 250);
  };

  const rerender = (): void => {
    renderSvg(svg, state, strings);
    if (state.design.items.length === 0) {
      renderEmptyHint(svg, state.design.room, strings.emptyHint ?? strings.navigation.furniture);
    }
    areaLine.textContent = `${strings.area}: ${formatArea(state.design.room.w, state.design.room.h, state.design.room.unit)}`;
    renderReportPreview(reportPreview, state, strings);
    renderReportPreview(drawerReport, state, strings);
    renderSelection();
    const structuralWarnings = runStructuralChecks(state.design, strings);
    renderWarnings(structural, strings.checksTitle, structuralWarnings, strings.noWarnings);
    renderWarnings(drawerChecks, strings.checksTitle, structuralWarnings, strings.noWarnings);
    if (options.fengShui) {
      renderWarnings(feng, strings.fengShui.sectionTitle, runFengShuiChecks(state.design, strings), strings.fengShui.noWarnings, strings.disclaimerLink);
    } else {
      feng.replaceChildren();
    }
    scheduleSave();
  };

  const updateRoomDimension = (field: 'w' | 'h', value: number): void => {
    state.design.room[field] = Math.max(100, toCm(value, state.design.room.unit));
    rerender();
  };

  const clampItemWidth = (item: FurnitureItem, value: number): number =>
    clamp(Math.round(value), MIN_ITEM_SIZE, Math.max(MIN_ITEM_SIZE, state.design.room.w - item.x));

  const clampItemHeight = (item: FurnitureItem, value: number): number =>
    clamp(Math.round(value), MIN_ITEM_SIZE, Math.max(MIN_ITEM_SIZE, state.design.room.h - item.y));

  const clampCenteredSize = (value: number, center: number, roomSize: number): number => {
    const centeredMax = Math.min(roomSize, center * 2, (roomSize - center) * 2);
    return clamp(Math.round(value), MIN_ITEM_SIZE, Math.max(MIN_ITEM_SIZE, centeredMax));
  };

  const renderControls = (): void => {
    controls.replaceChildren();
    const makePanel = (key: string, title: string): HTMLElement => {
      const panel = document.createElement('section');
      panel.dataset.plannerPanel = key;
      panel.className = 'planner-control-section';
      const heading = document.createElement('h3');
      heading.textContent = title;
      panel.append(heading);
      return panel;
    };
    const roomPanel = makePanel('room', strings.drawer.roomTitle);
    const furniturePanel = makePanel('furniture', strings.drawer.furnitureTitle);
    const templatesPanel = makePanel('templates', strings.templatesLabel);

    const roomGrid = document.createElement('div');
    roomGrid.className = 'planner-control-grid';
    const lengthInput = createNumberInput(fromCm(state.design.room.h, state.design.room.unit), state.design.room.unit === 'cm' ? 1 : 0.1);
    const widthInput = createNumberInput(fromCm(state.design.room.w, state.design.room.unit), state.design.room.unit === 'cm' ? 1 : 0.1);
    const unitSelect = document.createElement('select');
    (['cm', 'm', 'ft'] as Unit[]).forEach((unit) => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = strings.units[unit];
      option.selected = unit === state.design.room.unit;
      unitSelect.append(option);
    });
    lengthInput.addEventListener('change', () => updateRoomDimension('h', Number(lengthInput.value)));
    widthInput.addEventListener('change', () => updateRoomDimension('w', Number(widthInput.value)));
    unitSelect.addEventListener('change', () => {
      state.design.room.unit = unitSelect.value as Unit;
      renderControls();
      rerender();
    });
    roomGrid.append(createLabeledInput(strings.roomLength, lengthInput), createLabeledInput(strings.roomWidth, widthInput), createLabeledInput(strings.unit, unitSelect));
    roomPanel.append(roomGrid);

    const palette = document.createElement('div');
    palette.className = 'planner-button-row';
    FURNITURE_TYPES.forEach((type) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button secondary planner-small-button';
      button.textContent = `${strings.actions.add} ${strings.furniture[type]}`;
      button.addEventListener('click', () => {
        const item = makeItem(type, strings.furniture[type], 35, 35);
        state.design.items.push(item);
        state.selectedId = item.id;
        rerender();
      });
      palette.append(button);
    });
    furniturePanel.append(palette);

    const customForm = document.createElement('div');
    customForm.className = 'planner-custom-form';
    const customNameInput = document.createElement('input');
    customNameInput.type = 'text';
    customNameInput.placeholder = strings.customItem.namePlaceholder;
    customNameInput.className = 'planner-custom-name';
    const customWInput = createNumberInput(80, 1);
    const customHInput = createNumberInput(60, 1);
    const customAddBtn = document.createElement('button');
    customAddBtn.type = 'button';
    customAddBtn.className = 'button secondary planner-small-button';
    customAddBtn.textContent = strings.customItem.addButton;
    customAddBtn.addEventListener('click', () => {
      const name = customNameInput.value.trim() || strings.customItem.namePlaceholder;
      const w = Math.max(MIN_ITEM_SIZE, toCm(Number(customWInput.value) || 80, state.design.room.unit));
      const h = Math.max(MIN_ITEM_SIZE, toCm(Number(customHInput.value) || 60, state.design.room.unit));
      const item = makeItem('custom', name, 40, 40);
      item.w = w;
      item.h = h;
      item.label = name;
      state.design.items.push(item);
      state.selectedId = item.id;
      customNameInput.value = '';
      rerender();
    });
    const customSizeRow = document.createElement('div');
    customSizeRow.className = 'planner-custom-size-row';
    customSizeRow.append(createLabeledInput(strings.width, customWInput), createLabeledInput(strings.height, customHInput));
    customForm.append(customNameInput, customSizeRow, customAddBtn);
    furniturePanel.append(customForm);

    const templates = document.createElement('div');
    templates.className = 'planner-button-row';
    const presetMap = templateDesigns(strings.furniture);
    (Object.keys(presetMap) as Array<keyof typeof presetMap>).forEach((key) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button secondary planner-small-button';
      button.textContent = strings.templates[key as keyof PlannerStrings['templates']];
      button.addEventListener('click', () => {
        state.design = cloneDesign(presetMap[key]);
        state.selectedId = null;
        renderControls();
        rerender();
      });
      templates.append(button);
    });
    templatesPanel.append(templates);

    const actions = document.createElement('div');
    actions.className = 'planner-button-row';
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button planner-small-button';
    saveButton.textContent = strings.actions.save;
    saveButton.addEventListener('click', saveNow);
    const pngButton = document.createElement('button');
    pngButton.type = 'button';
    pngButton.className = 'button secondary planner-small-button';
    pngButton.textContent = strings.actions.exportPng;
    pngButton.addEventListener('click', () => void exportPng(svg, actions, state.design, strings));
    const pdfButton = document.createElement('button');
    pdfButton.type = 'button';
    pdfButton.className = 'button secondary planner-small-button';
    pdfButton.textContent = strings.actions.exportPdf;
    pdfButton.addEventListener('click', () => void exportPdf(svg, state.design, strings, actions));
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'button secondary planner-small-button';
    clearButton.textContent = strings.actions.clear;
    clearButton.addEventListener('click', () => {
      if (window.confirm(strings.confirmClear)) {
        localStorage.removeItem(storageKey);
        state.design = defaultDesign(strings.furniture);
        state.selectedId = null;
        renderControls();
        rerender();
      }
    });
    const status = document.createElement('span');
    status.className = 'planner-save-status planner-muted';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    actions.append(saveButton, pngButton, pdfButton, clearButton, status);
    const actionHeading = document.createElement('h3');
    actionHeading.textContent = strings.actions.saveExport;
    roomPanel.append(actionHeading, actions);
    controls.append(roomPanel, furniturePanel, templatesPanel);
    if (!drawer.hidden && drawer.dataset.panel) {
      const activePanel = drawer.dataset.panel;
      controls.querySelectorAll<HTMLElement>('[data-planner-panel]').forEach((section) => {
        section.hidden = section.dataset.plannerPanel !== activePanel;
      });
      drawerChecks.hidden = activePanel !== 'checks';
      drawerReport.hidden = activePanel !== 'report';
    }
  };

  function renderSelection(): void {
    selectionPanel.replaceChildren();
    const item = state.design.items.find((candidate) => candidate.id === state.selectedId);
    const heading = document.createElement('h3');
    heading.textContent = strings.selectedItem;
    selectionPanel.append(heading);
    if (!item) {
      const empty = document.createElement('p');
      empty.className = 'planner-muted';
      empty.textContent = strings.noSelection;
      selectionPanel.append(empty);
      return;
    }

    if (item.type === 'custom') {
      const nameLabel = document.createElement('label');
      nameLabel.className = 'planner-field';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = strings.customItem.editNameLabel;
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = item.label ?? '';
      nameInput.addEventListener('input', () => {
        item.label = nameInput.value || strings.furniture.custom;
        rerender();
      });
      nameLabel.append(nameSpan, nameInput);
      selectionPanel.append(nameLabel);
    }

    const grid = document.createElement('div');
    grid.className = 'planner-control-grid';
    const width = createNumberInput(fromCm(item.w, state.design.room.unit), state.design.room.unit === 'cm' ? 1 : 0.1);
    const height = createNumberInput(fromCm(item.h, state.design.room.unit), state.design.room.unit === 'cm' ? 1 : 0.1);
    const rotation = createNumberInput(item.rotation, 1);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '359';
    slider.value = String(item.rotation);
    slider.setAttribute('aria-label', strings.rotationSliderLabel ?? strings.rotation);
    width.addEventListener('change', () => {
      item.w = clampItemWidth(item, toCm(Number(width.value), state.design.room.unit));
      rerender();
    });
    height.addEventListener('change', () => {
      item.h = clampItemHeight(item, toCm(Number(height.value), state.design.room.unit));
      rerender();
    });
    rotation.addEventListener('change', () => {
      item.rotation = Number(rotation.value) % 360;
      rerender();
    });
    slider.addEventListener('input', () => {
      item.rotation = Number(slider.value);
      rerender();
    });
    grid.append(
      createLabeledInput(strings.width, width),
      createLabeledInput(strings.height, height),
      createLabeledInput(strings.rotation, rotation),
      createLabeledInput(strings.rotation, slider, { hiddenLabel: true }),
    );

    const actions = document.createElement('div');
    actions.className = 'planner-button-row';
    const rotateButton = document.createElement('button');
    rotateButton.type = 'button';
    rotateButton.className = 'button secondary planner-small-button';
    rotateButton.textContent = strings.actions.rotate90;
    rotateButton.addEventListener('click', () => {
      item.rotation = (item.rotation + 90) % 360;
      rerender();
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button secondary planner-small-button';
    deleteButton.textContent = strings.actions.delete;
    deleteButton.addEventListener('click', () => {
      state.design.items = state.design.items.filter((candidate) => candidate.id !== item.id);
      state.selectedId = null;
      rerender();
    });
    actions.append(rotateButton, deleteButton);
    selectionPanel.append(grid, actions);
  }

  svg.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = (event.target as Element).closest<SVGGElement>('.planner-item');
    const id = target?.dataset.id;
    if (!id) return;
    event.preventDefault();
    state.selectedId = id;
    state.dragging = null;
    state.resizing = null;
    rerender();
  });

  svg.addEventListener('pointerdown', (event) => {
    const target = event.target as Element;
    const resizeTarget = target.closest<SVGElement>('[data-resize]');
    if (resizeTarget) {
      event.preventDefault();
      const id = resizeTarget.getAttribute('data-resize');
      const item = state.design.items.find((candidate) => candidate.id === id);
      if (!item) return;
      const point = localPoint(svg, event);
      const centerX = item.x + item.w / 2;
      const centerY = item.y + item.h / 2;
      const pointerLocal = rotatePoint(point.x, point.y, centerX, centerY, -item.rotation);
      state.selectedId = item.id;
      state.dragging = null;
      state.resizing = {
        id: item.id,
        startW: item.w,
        startH: item.h,
        centerX,
        centerY,
        rotation: item.rotation,
        pointerLocalX: pointerLocal.x,
        pointerLocalY: pointerLocal.y,
      };
      svg.setPointerCapture(event.pointerId);
      rerender();
      return;
    }
    const group = target.closest<SVGGElement>('.planner-item');
    if (!group) {
      state.selectedId = null;
      rerender();
      return;
    }
    event.preventDefault();
    const id = group.dataset.id;
    const item = state.design.items.find((candidate) => candidate.id === id);
    if (!item) return;
    state.selectedId = item.id;
    const point = localPoint(svg, event);
    state.dragging = { id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y };
    state.resizing = null;
    svg.setPointerCapture(event.pointerId);
    rerender();
  });

  svg.addEventListener('pointermove', (event) => {
    if (state.resizing) {
      event.preventDefault();
      const resize = state.resizing;
      const item = state.design.items.find((candidate) => candidate.id === resize.id);
      if (!item) return;
      const point = localPoint(svg, event);
      const pointerLocal = rotatePoint(point.x, point.y, resize.centerX, resize.centerY, -resize.rotation);
      const prevW = item.w;
      const prevH = item.h;
      const newW = clampCenteredSize(resize.startW + pointerLocal.x - resize.pointerLocalX, resize.centerX, state.design.room.w);
      const newH = clampCenteredSize(resize.startH + pointerLocal.y - resize.pointerLocalY, resize.centerY, state.design.room.h);
      item.x -= (newW - prevW) / 2;
      item.y -= (newH - prevH) / 2;
      item.w = newW;
      item.h = newH;
      item.x = clamp(item.x, 0, Math.max(0, state.design.room.w - item.w));
      item.y = clamp(item.y, 0, Math.max(0, state.design.room.h - item.h));
      rerender();
      return;
    }
    if (!state.dragging) return;
    event.preventDefault();
    const item = state.design.items.find((candidate) => candidate.id === state.dragging?.id);
    if (!item) return;
    const point = localPoint(svg, event);
    item.x = Math.round(point.x - state.dragging.offsetX);
    item.y = Math.round(point.y - state.dragging.offsetY);
    rerender();
  }, { passive: false });

  const finishPointerInteraction = (event: PointerEvent): void => {
    const hadInteraction = Boolean(state.dragging || state.resizing);
    state.dragging = null;
    state.resizing = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (hadInteraction) saveNow();
  };

  svg.addEventListener('pointerup', finishPointerInteraction);
  svg.addEventListener('pointercancel', finishPointerInteraction);

  svg.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as Element;
    const group = target.closest<SVGGElement>('.planner-item');
    const id = group?.dataset.id;
    if (!group || !id) return;
    event.preventDefault();
    if (state.selectedId === id) return;
    state.selectedId = id;
    rerender();
    window.requestAnimationFrame(() => {
      const selected = Array.from(svg.querySelectorAll<SVGGElement>('.planner-item'))
        .find((candidate) => candidate.dataset.id === id);
      selected?.focus();
    });
  });

  renderControls();
  rerender();
  container.dataset.plannerReady = 'true';
  window.dispatchEvent(new CustomEvent('roomfeng:planner-ready'));
}

export type { PlannerOptions, PlannerStrings } from './types';
