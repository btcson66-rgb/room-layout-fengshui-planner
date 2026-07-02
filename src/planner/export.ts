import type { Design, PlannerStrings } from './types';

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

export async function exportPdf(svg: SVGSVGElement, _design: Design, _strings: PlannerStrings): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const blob = await svgToPngBlob(svg);
  const dataUrl = await blobToDataUrl(blob);
  const size = await imageSize(dataUrl);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const scale = Math.min(pageWidth / size.width, pageHeight / size.height);
  const width = size.width * scale;
  const height = size.height * scale;
  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;
  pdf.addImage(dataUrl, 'PNG', x, y, width, height);
  pdf.save('room-layout-plan.pdf');
}
