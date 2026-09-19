import type { MovingProject } from './types';
import { assessFurniture } from './decisionEngine';
import { sanitizeSpreadsheetCell } from './security';

function csvRow(values: unknown[]): string {
  return values.map((value) => `"${sanitizeSpreadsheetCell(value).replaceAll('"', '""')}"`).join(',');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBackup(project: MovingProject): void {
  downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), 'roomfeng-moving-project.json');
}

export function exportFurnitureCsv(project: MovingProject): void {
  const rows = [csvRow(['ID', 'Name', 'Category', 'Destination', 'Width mm', 'Depth mm', 'Height mm', 'Decision', 'Entry', 'Room fit', 'Usability', 'Recommendation', 'Notes'])];
  for (const item of project.furniture) {
    const assessment = assessFurniture(project, item);
    const room = project.rooms.find((candidate) => candidate.id === item.destinationRoomId)?.name ?? '';
    rows.push(csvRow([item.id, item.name, item.category, room, item.dimensions.width, item.dimensions.depth, item.dimensions.height, item.decision, assessment.entry, assessment.room, assessment.usability, assessment.recommendation, item.notes]));
  }
  downloadBlob(new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), 'roomfeng-furniture-inventory.csv');
}

const inputFill = 'FFF7F1E6';
const headingFill = 'FF183C36';
const accentFill = 'FFDDEBE5';

export async function exportWorkbook(project: MovingProject): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'RoomFeng';
  workbook.title = 'Moving & New Home OS';
  workbook.subject = 'Local-first moving project workbook';
  workbook.created = new Date();

  const addSheet = (name: string, headers: string[], rows: unknown[][]) => {
    const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.addRow(headers);
    rows.forEach((row) => sheet.addRow(row.map(sanitizeSpreadsheetCell)));
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: headers.length } };
    sheet.getRow(1).eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headingFill } }; cell.alignment = { vertical: 'middle', wrapText: true }; });
    sheet.columns.forEach((column) => { column.width = Math.min(34, Math.max(12, ...Array.from({ length: Math.min(sheet.rowCount, 100) }, (_, i) => String(sheet.getCell(i + 1, column.number).value ?? '').length + 2))); });
    sheet.eachRow((row, rowNumber) => { if (rowNumber > 1) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: inputFill } }; cell.alignment = { vertical: 'top', wrapText: true }; }); });
    sheet.pageSetup = { orientation: headers.length > 7 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
    sheet.pageSetup.printArea = `A1:${sheet.getColumn(headers.length).letter}${Math.max(sheet.rowCount, 2)}`;
    return sheet;
  };

  const dashboard = workbook.addWorksheet('Dashboard', { views: [{ state: 'frozen', ySplit: 4 }] });
  dashboard.mergeCells('A1:D1'); dashboard.getCell('A1').value = 'RoomFeng Moving & New Home OS';
  dashboard.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
  dashboard.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headingFill } };
  dashboard.addRows([
    ['Project', sanitizeSpreadsheetCell(project.project.name), 'Move date', project.project.moveDate],
    ['Current home', sanitizeSpreadsheetCell(project.project.currentHome), 'New home', sanitizeSpreadsheetCell(project.project.newHome)],
    [],
    ['Metric', 'Value', 'Metric', 'Value'],
    ['Furniture checked', { formula: `COUNTA('Furniture Inventory'!A2:A5000)` }, 'Boxes packed', { formula: `COUNTIF(Boxes!G2:G5000,"Yes")` }],
    ['Tasks completed', { formula: `COUNTIF('Move Timeline'!E2:E5000,"Yes")` }, 'Budget estimate', { formula: 'SUM(Budget!D2:D5000)' }],
    ['Actual spend', { formula: 'SUM(Budget!E2:E5000)' }, 'Remaining', { formula: 'SUM(Budget!D2:D5000)-SUM(Budget!E2:E5000)' }],
  ]);
  dashboard.getRow(5).eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headingFill } }; });
  dashboard.columns = [{ width: 24 }, { width: 24 }, { width: 24 }, { width: 24 }];
  dashboard.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };

  addSheet('Move Timeline', ['ID', 'Phase', 'Task', 'Due date', 'Completed'], project.timeline.map((task) => [task.id, task.phase, task.title, task.dueDate, task.completed ? 'Yes' : 'No']));
  addSheet('Furniture Inventory', ['ID', 'Name', 'Category', 'Current room', 'Destination room', 'Width mm', 'Depth mm', 'Height mm', 'Disassemble', 'Decision', 'Entry', 'Room fit', 'Usability', 'Recommendation', 'Why'], project.furniture.map((item) => {
    const result = assessFurniture(project, item); return [item.id, item.name, item.category, item.currentRoom, project.rooms.find((room) => room.id === item.destinationRoomId)?.name ?? '', item.dimensions.width, item.dimensions.depth, item.dimensions.height, item.canDisassemble ? 'Yes' : 'No', item.decision, result.entry, result.room, result.usability, result.recommendation, result.reasons.join(' ')];
  }));
  addSheet('Measurements', ['Room / route', 'Length mm', 'Width mm', 'Ceiling mm', 'Doors', 'Windows', 'Fixed objects / route details'], [
    ...project.rooms.map((room) => [room.name, room.lengthMm, room.widthMm, room.ceilingMm, room.doors.map((d) => `${d.name}: ${d.widthMm}×${d.heightMm}`).join('; '), room.windows.map((w) => `${w.name}: ${w.widthMm}×${w.heightMm}`).join('; '), room.fixedObjects.map((f) => `${f.type}: ${f.note}`).join('; ')]),
    ['Entry route', '', '', '', `Old exit ${project.entryRoute.oldHomeExitWidthMm}×${project.entryRoute.oldHomeExitHeightMm}; elevator door ${project.entryRoute.elevatorDoorWidthMm}; entrance ${project.entryRoute.entranceWidthMm}×${project.entryRoute.entranceHeightMm}; interior door ${project.entryRoute.interiorDoorWidthMm}×${project.entryRoute.interiorDoorHeightMm}`, '', `Elevator ${project.entryRoute.elevatorWidthMm}×${project.entryRoute.elevatorDepthMm}×${project.entryRoute.elevatorHeightMm}; corridor ${project.entryRoute.corridorWidthMm}; stair ${project.entryRoute.stairWidthMm}; landing ${project.entryRoute.landingWidthMm}×${project.entryRoute.landingDepthMm}`],
  ]);
  addSheet('Furniture Shopping', ['Group', 'Candidate', 'Product', 'Category', 'Store', 'URL', 'Price', 'Width mm', 'Depth mm', 'Height mm', 'Room', 'Fit', 'Status', 'Delivery', 'Rating', 'Notes'], project.shopping.map((item) => { const room=project.rooms.find((candidate)=>candidate.id===item.roomId); const fits=room&&item.dimensions.height<=room.ceilingMm&&((item.dimensions.width<=room.lengthMm&&item.dimensions.depth<=room.widthMm)||(item.dimensions.depth<=room.lengthMm&&item.dimensions.width<=room.widthMm)); return [item.group, item.candidate, item.product, item.category, item.store, item.url, item.price, item.dimensions.width, item.dimensions.depth, item.dimensions.height, room?.name ?? '', !room?'Choose room':!fits?'Fails current measurements':room.fixedObjects.length?'Layout review':'Preliminary pass', item.status, item.delivery, item.rating ?? '', item.notes]; }));
  addSheet('Boxes', ['Box ID', 'Destination', 'Contents', 'Fragile', 'Priority', 'First night', 'Packed', 'Loaded', 'Delivered', 'Unpacked'], project.boxes.map((box) => [box.id, project.rooms.find((room) => room.id === box.roomId)?.name ?? '', box.contents, box.fragile ? 'Yes' : 'No', box.priority, box.firstNight ? 'Yes' : 'No', box.packed ? 'Yes' : 'No', box.loaded ? 'Yes' : 'No', box.delivered ? 'Yes' : 'No', box.unpacked ? 'Yes' : 'No']));
  const budget = addSheet('Budget', ['ID', 'Category', 'Item', 'Estimated', 'Actual', 'Paid', 'Due date', 'Notes'], project.budget.map((item) => [item.id, item.category, item.label, item.estimated, item.actual, item.paid ? 'Yes' : 'No', item.dueDate, item.notes]));
  budget.getColumn(4).numFmt = '#,##0.00;[Red](#,##0.00);-'; budget.getColumn(5).numFmt = '#,##0.00;[Red](#,##0.00);-';
  addSheet('Move Day', ['Section', 'Details'], [['New home', project.project.newHome], ['Mover contact', project.moveDay.moverContact], ['Building contact', project.moveDay.buildingContact], ['Parking', project.moveDay.parking], ['Elevator reservation', project.moveDay.elevatorReservation], ...project.rooms.map((room,index)=>[`Room ${String(index+1).padStart(2,'0')} ${room.name}`,project.furniture.filter((item)=>item.destinationRoomId===room.id).map((item)=>item.name).join(', ')]), ['Sequence', '1. Large furniture  2. Furthest room  3. Smaller furniture  4. Boxes'], ['Notes', project.moveDay.notes]]);
  const instructions = addSheet('Instructions', ['Step', 'Action'], [[1, 'Set up the project and move date.'], [2, 'Measure the full entry route and each room.'], [3, 'Add the largest furniture first and review all three gates.'], [4, 'Plan tasks, boxes, budget, and shopping candidates.'], [5, 'Export a JSON backup before moving day.'], [6, 'This is a preliminary measurement check and does not replace an on-site mover assessment.']]);
  instructions.getColumn(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentFill } };
  workbook.worksheets.forEach((sheet) => {
    sheet.headerFooter.oddFooter = 'RoomFeng Moving & New Home OS | &P / &N';
  });
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'RoomFeng-Moving-New-Home-OS.xlsx');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

export function printPlanner(project: MovingProject, mode: 'planner' | 'move-day' | 'labels'): void {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Allow pop-ups to open the printable edition.');
  const title = mode === 'move-day' ? 'Move-Day Command Sheet' : mode === 'labels' ? 'Box Labels' : 'Printable Planner';
  const sections = mode === 'labels'
    ? `<div class="labels">${project.boxes.map((box) => `<article><strong>${escapeHtml(box.id)}</strong><span>${escapeHtml(project.rooms.find((room) => room.id === box.roomId)?.name ?? '')}</span><p>${escapeHtml(box.contents)}</p>${box.fragile ? '<b>FRAGILE</b>' : ''}${box.openFirst ? '<b>OPEN FIRST</b>' : ''}</article>`).join('')}</div>`
    : mode === 'move-day'
      ? `<section><h2>${escapeHtml(project.project.newHome)}</h2><dl><dt>Mover</dt><dd>${escapeHtml(project.moveDay.moverContact)}</dd><dt>Building</dt><dd>${escapeHtml(project.moveDay.buildingContact)}</dd><dt>Parking</dt><dd>${escapeHtml(project.moveDay.parking)}</dd><dt>Elevator</dt><dd>${escapeHtml(project.moveDay.elevatorReservation)}</dd></dl><h2>Room and furniture destinations</h2><ol>${project.rooms.map((room, i) => `<li><strong>${String(i + 1).padStart(2, '0')} ${escapeHtml(room.name)}</strong>${project.furniture.filter((item)=>item.destinationRoomId===room.id).map((item)=>` · ${escapeHtml(item.name)}`).join('')}</li>`).join('')}</ol><h2>Moving sequence</h2><ol><li>Large furniture</li><li>Furthest room</li><li>Smaller furniture</li><li>Boxes</li></ol><p>${escapeHtml(project.moveDay.notes)}</p></section>`
      : `<section><h2>Project</h2><p>${escapeHtml(project.project.name)} · ${escapeHtml(project.project.moveDate)}</p><h2>Measurements</h2>${project.rooms.map((room) => `<p><strong>${escapeHtml(room.name)}</strong> ${room.lengthMm} × ${room.widthMm} × ${room.ceilingMm} mm</p>`).join('')}<h2>Furniture decisions</h2><table><tr><th>ID</th><th>Item</th><th>Recommendation</th></tr>${project.furniture.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(assessFurniture(project, item).recommendation)}</td></tr>`).join('')}</table><h2>Timeline</h2>${project.timeline.map((task) => `<p>□ ${escapeHtml(task.dueDate)} — ${escapeHtml(task.title)}</p>`).join('')}<h2>Budget</h2><table><tr><th>Item</th><th>Estimate</th><th>Actual</th></tr>${project.budget.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.estimated}</td><td>${item.actual}</td></tr>`).join('')}</table><h2>First night</h2>${project.firstNight.map((item) => `<p>□ ${escapeHtml(item.label)}</p>`).join('')}`;
  const printableHtml = `<!doctype html><html lang="${project.locale}"><head><meta charset="utf-8"><title>${title}</title><style>@page{size:auto;margin:14mm}*{box-sizing:border-box}body{font:11pt/1.45 "Microsoft JhengHei","Noto Sans TC",Arial,sans-serif;color:#1b2d29}h1{font:700 25pt Georgia,serif;border-bottom:3px solid #244f46;padding-bottom:8mm}h2{font-size:15pt;margin-top:8mm}table{width:100%;border-collapse:collapse}th,td{border:1px solid #8d9b96;padding:2.5mm;text-align:left}dl{display:grid;grid-template-columns:35mm 1fr}dt{font-weight:700}.labels{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.labels article{min-height:58mm;border:2px solid #244f46;padding:6mm;break-inside:avoid}.labels strong{display:block;font:700 24pt Georgia,serif}.labels span{display:block;color:#546d66}.labels b{display:inline-block;margin:2mm 2mm 0 0;padding:1mm 2mm;border:1px solid}footer{position:fixed;bottom:0;font-size:8pt;color:#667}</style></head><body><h1>RoomFeng · ${title}</h1>${sections}<footer>Preliminary planning tool — verify critical dimensions on site.</footer><script>setTimeout(function(){document.documentElement.dataset.printRequested='true';window.print();},250);</script></body></html>`;
  const printableUrl = URL.createObjectURL(new Blob([printableHtml], { type: 'text/html' }));
  popup.location.replace(printableUrl);
  popup.opener = null;
  window.setTimeout(() => URL.revokeObjectURL(printableUrl), 60_000);
}

export function sendFurnitureToPlanner(project: MovingProject, roomId?: string): string {
  const room = project.rooms.find((candidate) => candidate.id === roomId) ?? project.rooms[0];
  if (!room) throw new Error('Add a room before opening the layout planner.');
  const furnitureItems = project.furniture.filter((item) => item.destinationRoomId === room.id).slice(0, 20).map((item, index) => ({
    id: item.id, type: item.category === 'dining-table' ? 'diningTable' : ['bed', 'desk', 'wardrobe', 'sofa'].includes(item.category) ? item.category : 'custom',
    x: 20 + (index % 4) * 70, y: 20 + Math.floor(index / 4) * 80,
    w: Math.max(20, Math.round(item.dimensions.width / 10)), h: Math.max(20, Math.round(item.dimensions.depth / 10)), rotation: 0, label: item.name,
  }));
  const structuralItems = [
    ...room.doors.map((opening, index) => ({ id: opening.id, type: 'door', x: 10 + index * 100, y: 0, w: Math.max(20, Math.round(opening.widthMm / 10)), h: 10, rotation: 0, label: opening.name })),
    ...room.windows.map((opening, index) => ({ id: opening.id, type: 'window', x: 120 + index * 110, y: 0, w: Math.max(20, Math.round(opening.widthMm / 10)), h: 10, rotation: 0, label: opening.name })),
  ];
  const design = {
    room: { w: Math.round(room.lengthMm / 10), h: Math.round(room.widthMm / 10), unit: 'cm' },
    items: [...furnitureItems, ...structuralItems],
  };
  localStorage.setItem(plannerStorageKey(project), JSON.stringify(design));
  return project.locale === 'zh-TW' ? '/zh/room-layout-planner/' : '/en/room-layout-planner/';
}

export function plannerStorageKey(project: MovingProject): string {
  return project.locale === 'zh-TW' ? 'room-layout-planner:zh' : 'room-layout-planner:en';
}
