import { runFengShuiChecks, runStructuralChecks } from './checks';
import { exportPdf, exportPng } from './export';
import { defaultDesign, makeItem, templateDesigns } from './templates';
import type { Design, FurnitureItem, FurnitureType, PlannerOptions, PlannerStrings, Unit } from './types';
import { formatArea, fromCm, toCm } from './units';

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

function loadDesign(storageKey: string, strings: PlannerStrings): Design {
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

function createLabeledInput(label: string, input: HTMLInputElement | HTMLSelectElement): HTMLLabelElement {
  const wrapper = document.createElement('label');
  wrapper.className = 'planner-field';
  const text = document.createElement('span');
  text.textContent = label;
  wrapper.append(text, input);
  return wrapper;
}

function drawFurniture(parent: SVGGElement, item: FurnitureItem, strings: PlannerStrings, selected: boolean): void {
  const group = svgEl('g', {
    class: `planner-item ${selected ? 'is-selected' : ''}`,
    tabindex: '0',
    role: 'button',
    'data-id': item.id,
    transform: `rotate(${item.rotation} ${item.x + item.w / 2} ${item.y + item.h / 2})`,
  });
  const label = item.label ?? strings.furniture[item.type];

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
    group.append(svgEl('rect', { x: item.x - 4, y: item.y - 4, width: item.w + 8, height: item.h + 8, rx: 5, fill: 'none', stroke: '#2f6f62', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
    group.append(svgEl('rect', { x: item.x + item.w - 6, y: item.y + item.h - 6, width: 12, height: 12, rx: 2, fill: '#2f6f62', 'data-resize': item.id, style: 'cursor:nwse-resize' }));
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
  pattern.append(svgEl('path', { d: 'M 50 0 L 0 0 0 50', fill: 'none', stroke: '#d8d4c8', 'stroke-width': 1 }));
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
      <section class="planner-panel planner-controls" aria-label="Planner controls"></section>
      <section class="planner-canvas-wrap" aria-label="Room plan">
        <div class="planner-area-line"></div>
        <svg class="planner-svg" role="img" aria-label="Room floor plan"></svg>
      </section>
      <aside class="planner-panel planner-side" aria-label="Planner checks">
        <div class="planner-selection"></div>
        <div class="planner-structural"></div>
        <div class="planner-feng"></div>
      </aside>
    </div>
  `;

  const controls = container.querySelector<HTMLElement>('.planner-controls');
  const svg = container.querySelector<SVGSVGElement>('.planner-svg');
  const areaLine = container.querySelector<HTMLElement>('.planner-area-line');
  const selection = container.querySelector<HTMLElement>('.planner-selection');
  const structural = container.querySelector<HTMLElement>('.planner-structural');
  const feng = container.querySelector<HTMLElement>('.planner-feng');
  if (!controls || !svg || !areaLine || !selection || !structural || !feng) return;
  const selectionPanel = selection;

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
      renderEmptyHint(svg, state.design.room, strings.emptyHint ?? '← 左側新增家具，或選擇範例格局');
    }
    areaLine.textContent = `${strings.area}: ${formatArea(state.design.room.w, state.design.room.h, state.design.room.unit)}`;
    renderSelection();
    renderWarnings(structural, strings.checksTitle, runStructuralChecks(state.design, strings), strings.noWarnings);
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

  const renderControls = (): void => {
    controls.replaceChildren();
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

    const paletteTitle = document.createElement('h3');
    paletteTitle.textContent = strings.palette;
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

    const customTitle = document.createElement('h3');
    customTitle.textContent = strings.customItem.label;
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
    customSizeRow.append(
      createLabeledInput(strings.width, customWInput),
      createLabeledInput(strings.height, customHInput),
    );
    customForm.append(customNameInput, customSizeRow, customAddBtn);

    const templateTitle = document.createElement('h3');
    templateTitle.textContent = strings.templatesLabel;
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
    pngButton.addEventListener('click', () => void exportPng(svg));
    const pdfButton = document.createElement('button');
    pdfButton.type = 'button';
    pdfButton.className = 'button secondary planner-small-button';
    pdfButton.textContent = strings.actions.exportPdf;
    pdfButton.addEventListener('click', () => void exportPdf(svg, state.design, strings));
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
    actions.append(saveButton, pngButton, pdfButton, clearButton, status);

    controls.append(roomGrid, paletteTitle, palette, customTitle, customForm, templateTitle, templates, actions);
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
    grid.append(createLabeledInput(strings.width, width), createLabeledInput(strings.height, height), createLabeledInput(strings.rotation, rotation), createLabeledInput(strings.rotation, slider));

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
      item.w = clampItemWidth(item, resize.startW + pointerLocal.x - resize.pointerLocalX);
      item.h = clampItemHeight(item, resize.startH + pointerLocal.y - resize.pointerLocalY);
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

  renderControls();
  rerender();
}

export type { PlannerOptions, PlannerStrings } from './types';
