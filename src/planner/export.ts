import { jsPDF } from 'jspdf';
import type { Design, PlannerStrings } from './types';
import { formatArea, formatLength } from './units';

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

export async function exportPdf(svg: SVGSVGElement, design: Design, strings: PlannerStrings): Promise<void> {
  const blob = await svgToPngBlob(svg);
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.setFontSize(16);
  pdf.text('Room layout plan', 14, 16);
  pdf.setFontSize(10);
  pdf.text(`${strings.roomLength}: ${formatLength(design.room.h, design.room.unit)}  ${strings.roomWidth}: ${formatLength(design.room.w, design.room.unit)}`, 14, 24);
  pdf.text(`${strings.area}: ${formatArea(design.room.w, design.room.h, design.room.unit)}`, 14, 30);
  pdf.addImage(dataUrl, 'PNG', 14, 36, 180, 125);
  const itemLines = design.items.map((item) => `${item.label ?? strings.furniture[item.type]} ${formatLength(item.w, design.room.unit)} x ${formatLength(item.h, design.room.unit)}`);
  pdf.text(strings.itemList, 205, 38);
  pdf.text(itemLines.length ? itemLines : ['-'], 205, 46, { maxWidth: 72 });
  pdf.save('room-layout-plan.pdf');
}
