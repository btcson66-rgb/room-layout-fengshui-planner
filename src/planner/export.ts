import type { Design, PlannerStrings } from './types';
import { formatArea, formatLength } from './units';

const PDF_MARGIN_MM = 12;
const PDF_GAP_MM = 6;
const PDF_PLAN_HEIGHT_RATIO = 0.56;
const TEXT_CANVAS_WIDTH = 1400;
const TEXT_PADDING_X = 56;
const TEXT_PADDING_Y = 42;
const TEXT_LINE_HEIGHT = 34;
const TEXT_HEADING_HEIGHT = 46;
const TEXT_FONT_STACK = '"Microsoft JhengHei", "Noto Sans TC", "PingFang TC", Arial, sans-serif';

interface PdfTextRow {
  text: string;
  strong?: boolean;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function svgToPngBlob(svg: SVGSVGElement): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.decoding = 'async';
  const viewBox = svg.viewBox.baseVal;
  const width = Math.max(900, viewBox.width * 2);
  const height = Math.max(650, viewBox.height * 2);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error('Canvas is unavailable.');
  }

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to render SVG.'));
    image.src = url;
  });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(url);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to export PNG.'));
    }, 'image/png');
  });
}

export async function exportPng(svg: SVGSVGElement): Promise<void> {
  const blob = await svgToPngBlob(svg);
  triggerDownload(blob, 'room-layout-plan.png');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read exported image.'));
    reader.readAsDataURL(blob);
  });
}

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Unable to measure exported image.'));
    image.src = dataUrl;
  });
}

function buildPdfRows(design: Design, strings: PlannerStrings): PdfTextRow[] {
  const { room, items } = design;
  const rows: PdfTextRow[] = [
    { text: `${strings.roomLength}: ${formatLength(room.h, room.unit)}` },
    { text: `${strings.roomWidth}: ${formatLength(room.w, room.unit)}` },
    { text: `${strings.area}: ${formatArea(room.w, room.h, room.unit)}` },
    { text: strings.itemList, strong: true },
  ];

  if (items.length === 0) {
    rows.push({ text: '0' });
    return rows;
  }

  items.forEach((item, index) => {
    const label = item.label?.trim() || strings.furniture[item.type];
    rows.push({
      text: `${index + 1}. ${label} - ${formatLength(item.w, room.unit)} x ${formatLength(item.h, room.unit)}`,
    });
  });
  return rows;
}

function rowsForHeight(availableMm: number, contentWidthMm: number): number {
  const pxPerMm = TEXT_CANVAS_WIDTH / contentWidthMm;
  const availablePx = Math.max(0, availableMm * pxPerMm);
  const rowSpace = availablePx - TEXT_PADDING_Y * 2 - TEXT_HEADING_HEIGHT;
  return Math.max(1, Math.floor(rowSpace / TEXT_LINE_HEIGHT));
}

function drawPdfTextPanel(heading: string, rows: PdfTextRow[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TEXT_CANVAS_WIDTH;
  canvas.height = TEXT_PADDING_Y * 2 + TEXT_HEADING_HEIGHT + rows.length * TEXT_LINE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d8d4c8';
  context.lineWidth = 2;
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  context.fillStyle = '#24231f';
  context.font = `700 28px ${TEXT_FONT_STACK}`;
  context.textBaseline = 'top';
  context.fillText(heading, TEXT_PADDING_X, TEXT_PADDING_Y, canvas.width - TEXT_PADDING_X * 2);

  let y = TEXT_PADDING_Y + TEXT_HEADING_HEIGHT;
  rows.forEach((row) => {
    context.fillStyle = row.strong ? '#24231f' : '#4f4a43';
    context.font = `${row.strong ? '700' : '400'} 22px ${TEXT_FONT_STACK}`;
    context.fillText(row.text, TEXT_PADDING_X, y, canvas.width - TEXT_PADDING_X * 2);
    y += TEXT_LINE_HEIGHT;
  });

  return canvas;
}

function buildTextPanels(rows: PdfTextRow[], heading: string, firstRows: number, fullRows: number): HTMLCanvasElement[] {
  const panels: HTMLCanvasElement[] = [];
  let index = 0;

  while (index < rows.length) {
    const rowsPerPage = panels.length === 0 ? firstRows : fullRows;
    const chunk = rows.slice(index, index + rowsPerPage);
    panels.push(drawPdfTextPanel(heading, chunk));
    index += chunk.length;
  }

  return panels;
}

export async function exportPdf(svg: SVGSVGElement, design: Design, strings: PlannerStrings): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const blob = await svgToPngBlob(svg);
  const dataUrl = await blobToDataUrl(blob);
  const size = await imageSize(dataUrl);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGIN_MM * 2;
  const contentHeight = pageHeight - PDF_MARGIN_MM * 2;
  const maxPlanHeight = contentHeight * PDF_PLAN_HEIGHT_RATIO;
  const scale = Math.min(contentWidth / size.width, maxPlanHeight / size.height);
  const width = size.width * scale;
  const height = size.height * scale;
  const x = PDF_MARGIN_MM + (contentWidth - width) / 2;
  const y = PDF_MARGIN_MM;
  pdf.addImage(dataUrl, 'PNG', x, y, width, height);

  const textRows = buildPdfRows(design, strings);
  const textStartY = y + height + PDF_GAP_MM;
  const firstTextHeight = pageHeight - PDF_MARGIN_MM - textStartY;
  const firstRows = rowsForHeight(firstTextHeight, contentWidth);
  const fullRows = rowsForHeight(contentHeight, contentWidth);
  const heading = `${strings.roomLength} / ${strings.roomWidth}`;
  const textPanels = buildTextPanels(textRows, heading, firstRows, fullRows);

  textPanels.forEach((panel, index) => {
    if (index > 0) pdf.addPage('a4', 'landscape');
    const panelY = index === 0 ? textStartY : PDF_MARGIN_MM;
    const panelHeight = panel.height * (contentWidth / panel.width);
    pdf.addImage(panel.toDataURL('image/png'), 'PNG', PDF_MARGIN_MM, panelY, contentWidth, panelHeight);
  });

  pdf.save('room-layout-plan.pdf');
}
