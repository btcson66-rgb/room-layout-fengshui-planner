import { assessFurniture } from './decisionEngine';
import { exportBackup, exportFurnitureCsv, exportWorkbook, plannerStorageKey, printPlanner, sendFurnitureToPlanner } from './exports';
import { createEmptyProject, createSampleProject } from './sampleData';
import { loadProject, saveProject, STORAGE_KEY, validateProject } from './storage';
import type { BudgetCategory, Currency, FurnitureCategory, FurnitureDecision, Locale, MoveType, MovingProject, ShoppingItem } from './types';
import { fromMm, toMm, validateMeasurement } from './units';

const q = <T extends Element>(root: ParentNode, selector: string): T => {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Missing Moving OS element: ${selector}`);
  return found;
};
const qa = <T extends Element>(root: ParentNode, selector: string): T[] => Array.from(root.querySelectorAll<T>(selector));
const field = (form: HTMLFormElement, name: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => q(form, `[name="${name}"]`);
const uid = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const numeric = (form: HTMLFormElement, name: string): number => Number(field(form, name).value || 0);
const entryFields = ['oldHomeExitWidthMm','oldHomeExitHeightMm','elevatorWidthMm','elevatorDepthMm','elevatorHeightMm','elevatorDoorWidthMm','corridorWidthMm','stairWidthMm','landingWidthMm','landingDepthMm','entranceWidthMm','entranceHeightMm','interiorDoorWidthMm','interiorDoorHeightMm'] as const;

function defaultTimeline(moveDate: string, zh: boolean): MovingProject['timeline'] {
  if (!moveDate) return [];
  const items: Array<[number, string, string]> = [
    [-56, '8 weeks before', zh ? '盤點家具與初步預算' : 'Inventory furniture and set a starting budget'],
    [-42, '6 weeks before', zh ? '預約搬家公司' : 'Book movers'],
    [-28, '4 weeks before', zh ? '量電梯、轉角與新家房間' : 'Measure elevator, turns, and new-home rooms'],
    [-14, '2 weeks before', zh ? '安排網路與公用服務' : 'Arrange internet and utilities'],
    [-7, '1 week before', zh ? '確認停車與電梯預約' : 'Confirm parking and elevator reservation'],
    [-3, '3 days before', zh ? '準備第一晚紙箱' : 'Prepare the first-night box'],
    [0, 'Move day', zh ? '依房間代碼指揮搬入' : 'Direct move-in using room codes'],
    [1, 'First night', zh ? '開啟第一晚必需品' : 'Open first-night essentials'],
    [7, 'First week after', zh ? '檢查損壞與未完成事項' : 'Review damage and unfinished tasks'],
  ];
  const base = new Date(`${moveDate}T12:00:00`);
  return items.map(([offset, phase, title], index) => { const due = new Date(base); due.setDate(due.getDate() + offset); return { id: `TASK-${String(index + 1).padStart(2, '0')}`, title, dueDate: due.toISOString().slice(0, 10), phase, completed: false }; });
}

function setText(element: Element, value: unknown): void { element.textContent = String(value ?? ''); }
function option(value: string, label: string): HTMLOptionElement { const node = document.createElement('option'); node.value = value; node.textContent = label; return node; }
function button(label: string, action: () => void): HTMLButtonElement { const node = document.createElement('button'); node.type = 'button'; node.className = 'os-icon-button'; node.textContent = label; node.setAttribute('aria-label', label); node.addEventListener('click', action); return node; }

function currency(project: MovingProject, value: number): string {
  try { return new Intl.NumberFormat(project.locale, { style: 'currency', currency: project.project.currency, maximumFractionDigits: ['JPY', 'KRW'].includes(project.project.currency) ? 0 : 2 }).format(value); }
  catch { return `${project.project.currency} ${value.toLocaleString()}`; }
}

function makeCell(value: unknown): HTMLTableCellElement { const cell = document.createElement('td'); setText(cell, value); return cell; }
function emptyRow(message: string, columns: number): HTMLTableRowElement { const row = document.createElement('tr'); const cell = makeCell(message); cell.colSpan = columns; cell.className = 'os-empty-cell'; row.append(cell); return row; }
function statusBadge(label: string, status: 'pass' | 'review' | 'fail'): HTMLSpanElement {
  const badge = document.createElement('span'); badge.className = `os-status ${status}`;
  const icon = status === 'pass' ? '✓' : status === 'review' ? '!' : '×'; badge.textContent = `${icon} ${label}`; return badge;
}

export function initMovingOs(root: HTMLElement): void {
  const locale = (root.dataset.locale === 'zh-TW' ? 'zh-TW' : 'en') as Locale;
  const zh = locale === 'zh-TW';
  let project = loadProject(createSampleProject(locale));
  const live = q<HTMLElement>(root, '[data-live]');
  const announce = (message: string, error = false): void => { live.textContent = message; live.style.color = error ? '#7b2520' : ''; live.style.background = error ? '#f9e1df' : ''; };
  const persist = (message = zh ? '已儲存在這個瀏覽器。' : 'Saved in this browser.'): void => { saveProject(project); announce(message); render(); };

  qa<HTMLButtonElement>(root, '[data-module-target]').forEach((navButton) => navButton.addEventListener('click', () => {
    qa(root, '[data-module-target]').forEach((item) => item.classList.toggle('active', item === navButton));
    qa(root, '[data-module]').forEach((section) => section.classList.toggle('active', section.getAttribute('data-module') === navButton.dataset.moduleTarget));
    q<HTMLElement>(root, '.os-workspace').focus({ preventScroll: true });
  }));

  function renderRoomOptions(): void {
    qa<HTMLSelectElement>(root, '[data-room-options]').forEach((select) => {
      const selected = select.value; select.replaceChildren(option('', zh ? '選擇房間' : 'Choose a room'));
      project.rooms.forEach((room) => select.append(option(room.id, room.name)));
      if (project.rooms.some((room) => room.id === selected)) select.value = selected;
    });
  }

  function renderProjectForm(): void {
    const form = q<HTMLFormElement>(root, '[data-form="project"]');
    for (const name of ['name', 'moveDate', 'currentHome', 'newHome', 'currency', 'unit', 'householdSize', 'bedrooms', 'moveType']) field(form, name).value = String(project.project[name as keyof typeof project.project] ?? '');
  }

  function renderDashboard(): void {
    setText(q(root, '[data-project-subtitle]'), [project.project.currentHome, project.project.newHome, project.project.moveDate].filter(Boolean).join(' → '));
    const tasksDone = project.timeline.filter((task) => task.completed).length;
    const boxesDone = project.boxes.filter((box) => box.packed).length;
    const furnitureChecked = project.furniture.filter((item) => project.rooms.some((room) => room.id === item.destinationRoomId)).length;
    const denominators = project.timeline.length + project.boxes.length + project.furniture.length;
    const progress = denominators ? Math.round(((tasksDone + boxesDone + furnitureChecked) / denominators) * 100) : 0;
    q<HTMLProgressElement>(root, '[data-progress]').value = progress; setText(q(root, '[data-progress-label]'), `${progress}% ${zh ? '就緒' : 'Ready'}`);
    const estimated = project.budget.reduce((sum, item) => sum + item.estimated, 0); const actual = project.budget.reduce((sum, item) => sum + item.actual, 0);
    const needsReview = project.furniture.filter((item) => { const a = assessFurniture(project, item); return a.entry !== 'likely' || a.room !== 'pass' || a.usability !== 'comfortable'; }).length;
    const metrics: Array<[string, string]> = [[zh ? '家具已檢查' : 'Furniture checked', `${furnitureChecked} / ${project.furniture.length}`], [zh ? '紙箱已打包' : 'Boxes packed', `${boxesDone} / ${project.boxes.length}`], [zh ? '工作完成' : 'Tasks completed', `${tasksDone} / ${project.timeline.length}`], [zh ? '預算' : 'Budget', `${currency(project, actual)} / ${currency(project, estimated)}`], [zh ? '需確認家具' : 'Furniture needing review', String(needsReview)]];
    const container = q(root, '[data-dashboard-metrics]'); container.replaceChildren(...metrics.map(([label, value]) => { const card = document.createElement('div'); card.className = 'os-metric'; const strong = document.createElement('strong'); strong.textContent = value; const span = document.createElement('span'); span.textContent = label; card.append(strong, span); return card; }));
    const next = q<HTMLOListElement>(root, '[data-next-actions]'); next.replaceChildren();
    const actions: string[] = [];
    if (!project.project.moveDate) actions.push(zh ? '設定搬家日期。' : 'Set the move date.');
    if (!project.rooms.length) actions.push(zh ? '先量新家與最窄入口。' : 'Measure the new home and narrowest entry.');
    if (!project.furniture.length) actions.push(zh ? '加入最大件家具，通常是床、衣櫃或沙發。' : 'Add the largest item first — usually a bed, wardrobe, or sofa.');
    const reviewItem = project.furniture.find((item) => assessFurniture(project, item).entry !== 'likely'); if (reviewItem) actions.push(`${zh ? '確認搬運路線：' : 'Review entry route for '}${reviewItem.name}`);
    const dueTask = [...project.timeline].filter((task) => !task.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]; if (dueTask) actions.push(`${dueTask.dueDate}: ${dueTask.title}`);
    const openFirst = project.boxes.find((box) => box.openFirst && !box.packed); if (openFirst) actions.push(`${zh ? '打包第一晚紙箱：' : 'Pack first-night box '}${openFirst.id}`);
    if (!actions.length) actions.push(zh ? '檢查匯出備份，並與搬家公司再次確認大型家具。' : 'Export a backup and confirm large items with the mover.');
    actions.slice(0, 5).forEach((text) => { const li = document.createElement('li'); li.textContent = text; next.append(li); });
  }

  function renderRooms(): void {
    const body = q<HTMLTableSectionElement>(root, '[data-room-rows]'); body.replaceChildren();
    if (!project.rooms.length) body.append(emptyRow(zh ? '還沒有房間。先加入新家的第一個房間。' : 'No rooms yet. Add the first room in the new home.', 6));
    project.rooms.forEach((room) => { const row = document.createElement('tr'); row.append(makeCell(room.name), makeCell(fromMm(room.lengthMm, project.project.unit)), makeCell(fromMm(room.widthMm, project.project.unit)), makeCell(fromMm(room.ceilingMm, project.project.unit)), makeCell(room.doors[0] ? `${fromMm(room.doors[0].widthMm, project.project.unit)} × ${fromMm(room.doors[0].heightMm, project.project.unit)}` : '—')); const actions = makeCell(''); actions.append(button(zh ? `刪除 ${room.name}` : `Delete ${room.name}`, () => { project.rooms = project.rooms.filter((candidate) => candidate.id !== room.id); persist(); })); row.append(actions); body.append(row); });
    const entry = q<HTMLFormElement>(root, '[data-form="entry"]');
    for (const name of entryFields) field(entry, name).value = String(fromMm(project.entryRoute[name], project.project.unit) || '');
  }

  function renderFurniture(): void {
    const list = q(root, '[data-furniture-list]'); list.replaceChildren();
    if (!project.furniture.length) { const empty = document.createElement('p'); empty.textContent = zh ? '還沒有家具。先加入床、衣櫃或沙發。' : 'No furniture yet. Add the bed, wardrobe, or sofa first.'; list.append(empty); return; }
    project.furniture.forEach((item) => {
      const assessment = assessFurniture(project, item); const card = document.createElement('article'); card.className = 'os-furniture-card';
      const heading = document.createElement('div'); const title = document.createElement('h3'); title.textContent = item.name; const meta = document.createElement('p'); meta.textContent = `${item.id} · ${fromMm(item.dimensions.width, project.project.unit)} × ${fromMm(item.dimensions.depth, project.project.unit)} × ${fromMm(item.dimensions.height, project.project.unit)} ${project.project.unit}`; heading.append(title, meta, button(zh ? `刪除 ${item.name}` : `Delete ${item.name}`, () => { project.furniture = project.furniture.filter((candidate) => candidate.id !== item.id); persist(); }));
      const result = document.createElement('div'); const statuses = document.createElement('div'); statuses.className = 'os-status-row'; statuses.append(statusBadge(`${zh ? '入口' : 'Entry'}: ${assessment.entry}`, assessment.entry === 'likely' ? 'pass' : assessment.entry === 'review' ? 'review' : 'fail'), statusBadge(`${zh ? '房間' : 'Room'}: ${assessment.room}`, assessment.room === 'pass' ? 'pass' : assessment.room === 'tight' ? 'review' : 'fail'), statusBadge(`${zh ? '使用' : 'Use'}: ${assessment.usability}`, assessment.usability === 'comfortable' ? 'pass' : assessment.usability === 'tight' ? 'review' : 'fail'));
      const recommendation = document.createElement('p'); recommendation.innerHTML = `<strong>${zh ? '建議' : 'Recommendation'}:</strong> `; recommendation.append(document.createTextNode(assessment.recommendation.toUpperCase()));
      const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = zh ? '為什麼？' : 'Why?'; const reasons = document.createElement('ul'); assessment.reasons.forEach((reason) => { const li = document.createElement('li'); li.textContent = reason; reasons.append(li); }); details.append(summary, reasons); result.append(statuses, recommendation, details); card.append(heading, result); list.append(card);
    });
  }

  function readPlannerData(): Record<string, unknown> {
    const raw = localStorage.getItem(plannerStorageKey(project));
    if (!raw) throw new Error(zh ? '尚未找到 Room Planner 方案。請先送入家具並在 Room Planner 完成配置。' : 'No Room Planner plan found. Send furniture first and arrange it in Room Planner.');
    if (raw.length > 500_000) throw new Error(zh ? 'Room Planner 方案超過 500 KB。' : 'The Room Planner plan exceeds 500 KB.');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(zh ? 'Room Planner 方案格式無效。' : 'The Room Planner plan is invalid.');
    return parsed as Record<string, unknown>;
  }

  function renderLayouts(): void {
    const list = q(root, '[data-layout-list]'); list.replaceChildren();
    for (const slot of ['A', 'B', 'C'] as const) {
      const saved = project.layouts.find((layout) => layout.slot === slot);
      const card = document.createElement('article'); card.className = 'os-layout-slot';
      const title = document.createElement('h3'); title.textContent = `Layout ${slot}`;
      const status = document.createElement('p'); status.textContent = saved ? `${zh ? '已儲存' : 'Saved'}${saved.roomName ? ` · ${saved.roomName}` : ''} · ${new Date(saved.savedAt).toLocaleString(project.locale)}` : (zh ? '尚未儲存' : 'Not saved');
      card.append(title, status, button(saved ? (zh ? `覆寫 Layout ${slot}` : `Replace Layout ${slot}`) : (zh ? `儲存 Layout ${slot}` : `Save Layout ${slot}`), () => {
        try {
          const plannerData = readPlannerData();
          const roomSelect = q<HTMLSelectElement>(root, '[data-layout-room]');
          const room = project.rooms.find((candidate) => candidate.id === roomSelect.value) ?? project.rooms[0];
          project.layouts = [...project.layouts.filter((layout) => layout.slot !== slot), { slot, savedAt: new Date().toISOString(), roomId: room?.id, roomName: room?.name, plannerData }].sort((a, b) => a.slot.localeCompare(b.slot));
          persist(zh ? `Layout ${slot} 已儲存在這個瀏覽器。` : `Layout ${slot} saved in this browser.`);
        } catch (error) { announce(error instanceof Error ? error.message : String(error), true); }
      }));
      if (saved) card.append(button(zh ? `在 Room Planner 還原 ${slot}` : `Restore ${slot} to Room Planner`, () => { localStorage.setItem(plannerStorageKey(project), JSON.stringify(saved.plannerData)); window.location.href = project.locale === 'zh-TW' ? '/zh/room-layout-planner/' : '/en/room-layout-planner/'; }));
      list.append(card);
    }
  }

  function renderTimeline(): void {
    const list = q(root, '[data-timeline-list]'); list.replaceChildren();
    if (!project.timeline.length) { const empty=document.createElement('p'); empty.className='os-empty-state'; empty.textContent=zh?'設定搬家日期即可建立實用時間軸，或先新增自己的工作。':'Set a move date to generate a practical timeline, or add your own task.'; list.append(empty); }
    project.timeline.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).forEach((task) => { const row = document.createElement('div'); row.className = `os-check-row ${task.completed ? 'done' : ''}`; const check = document.createElement('input'); check.type = 'checkbox'; check.checked = task.completed; check.setAttribute('aria-label', `${zh ? '完成' : 'Complete'} ${task.title}`); check.addEventListener('change', () => { task.completed = check.checked; persist(); }); const date = document.createElement('input'); date.type = 'date'; date.value = task.dueDate; date.setAttribute('aria-label', `${zh ? '到期日' : 'Due date'} ${task.title}`); date.addEventListener('change', () => { task.dueDate = date.value; persist(); }); const text = document.createElement('input'); text.value = task.title; text.maxLength = 140; text.setAttribute('aria-label', `${zh ? '工作' : 'Task'} ${task.title}`); text.addEventListener('change', () => { task.title = text.value.trim() || task.title; persist(); }); row.append(check, date, text, button(zh ? `刪除 ${task.title}` : `Delete ${task.title}`, () => { project.timeline = project.timeline.filter((candidate) => candidate.id !== task.id); persist(); })); list.append(row); });
  }

  function renderBoxes(): void {
    const body = q<HTMLTableSectionElement>(root, '[data-box-rows]'); body.replaceChildren();
    if (!project.boxes.length) body.append(emptyRow(zh ? '還沒有紙箱。從第一晚要開的箱子開始。' : 'No boxes yet. Start with the box you will open on the first night.', 9));
    project.boxes.forEach((box) => { const row = document.createElement('tr'); const flags = [box.fragile ? (zh ? '⚠ 易碎' : '⚠ Fragile') : '', box.priority === 'high' ? (zh ? '高優先' : 'High') : '', box.firstNight ? (zh ? '第一晚' : 'First night') : '', box.openFirst ? (zh ? '優先開箱' : 'Open first') : ''].filter(Boolean).join(' · ') || '—'; row.append(makeCell(box.id), makeCell(project.rooms.find((room) => room.id === box.roomId)?.name ?? ''), makeCell(box.contents), makeCell(flags)); for (const [key, label] of [['packed', zh ? '已打包' : 'Packed'], ['loaded', zh ? '已裝車' : 'Loaded'], ['delivered', zh ? '已送達' : 'Delivered'], ['unpacked', zh ? '已拆箱' : 'Unpacked']] as const) { const cell = makeCell(''); const check = document.createElement('input'); check.type = 'checkbox'; check.checked = box[key]; check.setAttribute('aria-label', `${label} ${box.id}`); check.addEventListener('change', () => { box[key] = check.checked; persist(); }); cell.append(check); row.append(cell); } const actions = makeCell(''); actions.append(button(zh ? `刪除 ${box.id}` : `Delete ${box.id}`, () => { project.boxes = project.boxes.filter((candidate) => candidate.id !== box.id); persist(); })); row.append(actions); body.append(row); });
  }

  function renderBudget(): void {
    const estimated = project.budget.reduce((sum, item) => sum + item.estimated, 0); const actual = project.budget.reduce((sum, item) => sum + item.actual, 0);
    const container = q(root, '[data-budget-metrics]'); container.replaceChildren(...([[zh ? '預估總額' : 'Estimated total', currency(project, estimated)], [zh ? '實際總額' : 'Actual total', currency(project, actual)], [zh ? '預算差異' : 'Budget variance', currency(project, actual - estimated)], [zh ? '剩餘預算' : 'Remaining budget', currency(project, estimated - actual)]] as Array<[string,string]>).map(([label,value]) => { const card=document.createElement('div');card.className='os-metric';const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=label;card.append(strong,span);return card; }));
    const body = q<HTMLTableSectionElement>(root, '[data-budget-rows]'); body.replaceChildren(); if(!project.budget.length)body.append(emptyRow(zh?'還沒有預算項目。先加入搬家公司或押金。':'No budget items yet. Start with movers or the deposit.',6)); project.budget.forEach((item) => { const row=document.createElement('tr');row.append(makeCell(item.label),makeCell(currency(project,item.estimated)),makeCell(currency(project,item.actual)),makeCell(item.dueDate || '—'));const paid=makeCell('');const check=document.createElement('input');check.type='checkbox';check.checked=item.paid;check.setAttribute('aria-label',`${zh ? '已付款' : 'Paid'} ${item.label}`);check.addEventListener('change',()=>{item.paid=check.checked;persist();});paid.append(check);const actions=makeCell('');actions.append(button(zh?`刪除 ${item.label}`:`Delete ${item.label}`,()=>{project.budget=project.budget.filter((candidate)=>candidate.id!==item.id);persist();}));row.append(paid,actions);body.append(row); });
  }

  function renderShopping(): void {
    const list=q(root,'[data-shopping-list]');list.replaceChildren(); if(!project.shopping.length){const empty=document.createElement('p');empty.textContent=zh?'還沒有候選商品。新增 A、B、C 並用尺寸與價格比較。':'No candidates yet. Add A, B, and C to compare dimensions and price.';list.append(empty);return;}
    project.shopping.forEach((item)=>{const card=document.createElement('article');card.className='os-shopping-card';const candidate=document.createElement('span');candidate.className='candidate';candidate.textContent=item.candidate;const title=document.createElement('h3');title.textContent=item.product;const room=project.rooms.find((candidate)=>candidate.id===item.roomId);const fits=room&&item.dimensions.height<=room.ceilingMm&&((item.dimensions.width<=room.lengthMm&&item.dimensions.depth<=room.widthMm)||(item.dimensions.depth<=room.lengthMm&&item.dimensions.width<=room.widthMm));const fit=!room?(zh?'需選房間':'Choose room'):!fits?(zh?'不通過目前尺寸':'Fails current measurements'):room.fixedObjects.length?(zh?'需配置確認':'Layout review'):(zh?'初步通過':'Preliminary pass');const dl=document.createElement('dl');for(const [key,value] of [[zh?'價格':'Price',currency(project,item.price)],[zh?'尺寸':'Size',`${fromMm(item.dimensions.width,project.project.unit)} × ${fromMm(item.dimensions.depth,project.project.unit)} × ${fromMm(item.dimensions.height,project.project.unit)} ${project.project.unit}`],[zh?'空間檢查':'Fit',fit],[zh?'配送':'Delivery',item.delivery||'—'],[zh?'評分':'Rating',item.rating?`${item.rating} / 5`:'—'],[zh?'狀態':'Status',item.status],[zh?'備註':'Notes',item.notes||'—']]){const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');dd.textContent=value;dl.append(dt,dd);}card.append(candidate,title,dl,button(zh?`刪除 ${item.product}`:`Delete ${item.product}`,()=>{project.shopping=project.shopping.filter((candidate)=>candidate.id!==item.id);persist();}));list.append(card);});
  }

  function renderMoveDay(): void {
    const form=q<HTMLFormElement>(root,'[data-form="move-day"]');for(const name of ['moverContact','buildingContact','parking','elevatorReservation','notes'])field(form,name).value=project.moveDay[name as keyof typeof project.moveDay];
    const preview=q(root,'[data-move-day-preview]');preview.replaceChildren();const title=document.createElement('h3');title.textContent=project.project.newHome|| (zh?'新家':'New home');const dl=document.createElement('dl');for(const [key,value] of [[zh?'搬家公司':'Mover',project.moveDay.moverContact],[zh?'大樓聯絡':'Building',project.moveDay.buildingContact],[zh?'停車':'Parking',project.moveDay.parking],[zh?'電梯':'Elevator',project.moveDay.elevatorReservation]]){const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');dd.textContent=value||'—';dl.append(dt,dd);}const roomHeading=document.createElement('h3');roomHeading.textContent=zh?'房間與家具目的地':'Room and furniture destinations';const destinations=document.createElement('ol');project.rooms.forEach((room,index)=>{const li=document.createElement('li');const items=project.furniture.filter((item)=>item.destinationRoomId===room.id).map((item)=>item.name);li.textContent=`${String(index+1).padStart(2,'0')} ${room.name}${items.length?` — ${items.join(', ')}`:''}`;destinations.append(li);});const sequence=document.createElement('p');sequence.textContent=zh?'順序：大型家具 → 最遠房間 → 小型家具 → 紙箱':'Sequence: large furniture → furthest room → smaller furniture → boxes';preview.append(title,dl,roomHeading,destinations,sequence);
  }

  function renderFirstNight(): void { const list=q(root,'[data-first-night-list]');list.replaceChildren();if(!project.firstNight.length){const empty=document.createElement('p');empty.className='os-empty-state';empty.textContent=zh?'還沒有第一晚物品。先加入藥品、充電器或寢具。':'No first-night items yet. Start with medication, chargers, or bedding.';list.append(empty);}project.firstNight.forEach((item)=>{const row=document.createElement('label');row.className=`os-check-row ${item.packed?'done':''}`;const check=document.createElement('input');check.type='checkbox';check.checked=item.packed;check.addEventListener('change',()=>{item.packed=check.checked;persist();});const text=document.createElement('span');text.textContent=item.label;row.append(check,text,button(zh?`刪除 ${item.label}`:`Delete ${item.label}`,()=>{project.firstNight=project.firstNight.filter((candidate)=>candidate.id!==item.id);persist();}));list.append(row);}); }

  function render(): void { renderRoomOptions(); renderProjectForm(); renderDashboard(); renderRooms(); renderFurniture(); renderLayouts(); renderTimeline(); renderBoxes(); renderBudget(); renderShopping(); renderMoveDay(); renderFirstNight(); }

  q<HTMLFormElement>(root,'[data-form="project"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;project.project={ name:field(form,'name').value.trim(),currentHome:field(form,'currentHome').value.trim(),newHome:field(form,'newHome').value.trim(),moveDate:field(form,'moveDate').value,currency:field(form,'currency').value as Currency,unit:field(form,'unit').value as any,householdSize:numeric(form,'householdSize'),bedrooms:numeric(form,'bedrooms'),moveType:field(form,'moveType').value as MoveType};if(!project.timeline.length)project.timeline=defaultTimeline(project.project.moveDate,zh);persist();});
  q<HTMLFormElement>(root,'[data-form="room"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;const values=['length','width','ceiling','doorWidth','doorHeight','windowWidth','windowHeight','windowSill'].map((name)=>toMm(numeric(form,name),project.project.unit));const error=values.slice(0,3).map((value,index)=>validateMeasurement(value,['Length','Width','Ceiling'][index])).find(Boolean);if(error){announce(error,true);return;}project.rooms.push({id:uid('ROOM'),name:field(form,'name').value.trim(),lengthMm:values[0],widthMm:values[1],ceilingMm:values[2],doors:values[3]&&values[4]?[{id:uid('DOOR'),name:zh?'房門':'Door',widthMm:values[3],heightMm:values[4],swing:field(form,'doorSwing').value as 'left'|'right'|'sliding'|'none'}]:[],windows:values[5]&&values[6]?[{id:uid('WINDOW'),name:zh?'窗戶':'Window',widthMm:values[5],heightMm:values[6],sillHeightMm:values[7]}]:[],fixedObjects:field(form,'fixed').value.trim()?[{id:uid('FIXED'),type:field(form,'fixedType').value as any,note:field(form,'fixed').value.trim()}]:[]});form.reset();persist();});
  q<HTMLFormElement>(root,'[data-form="entry"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;for(const name of entryFields)project.entryRoute[name]=toMm(numeric(form,name),project.project.unit);persist();});
  q<HTMLFormElement>(root,'[data-form="furniture"]').addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;const dims={width:toMm(numeric(form,'width'),project.project.unit),depth:toMm(numeric(form,'depth'),project.project.unit),height:toMm(numeric(form,'height'),project.project.unit)};const error=Object.entries(dims).map(([name,value])=>validateMeasurement(value,name)).find(Boolean);if(error){announce(error,true);return;}const photo=(field(form,'photo') as HTMLInputElement).files?.[0];if(photo&&photo.size>1_000_000){announce(zh?'照片超過 1 MB，請先縮小檔案。':'Photo exceeds 1 MB. Resize it before adding.',true);return;}const photoDataUrl=photo?await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Unable to read photo.'));reader.readAsDataURL(photo);}):undefined;const canDisassemble=(field(form,'canDisassemble') as HTMLInputElement).checked;const disassembledDimensions=canDisassemble?{width:toMm(numeric(form,'disassembledWidth'),project.project.unit),depth:toMm(numeric(form,'disassembledDepth'),project.project.unit),height:toMm(numeric(form,'disassembledHeight'),project.project.unit)}:undefined;if(disassembledDimensions){const disassembledError=Object.entries(disassembledDimensions).map(([name,value])=>validateMeasurement(value,`Disassembled ${name}`)).find(Boolean);if(disassembledError){announce(zh?'勾選可拆解後，請填寫三個有效的拆解後尺寸。':disassembledError,true);return;}}project.furniture.push({id:`FUR-${String(project.furniture.length+1).padStart(3,'0')}`,name:field(form,'name').value.trim(),category:field(form,'category').value as FurnitureCategory,currentRoom:field(form,'currentRoom').value.trim(),destinationRoomId:field(form,'destinationRoomId').value,dimensions:dims,weightKg:numeric(form,'weightKg')||undefined,canDisassemble,disassembledDimensions,fragile:(field(form,'fragile') as HTMLInputElement).checked,expensive:(field(form,'expensive') as HTMLInputElement).checked,requiresMovers:(field(form,'requiresMovers') as HTMLInputElement).checked,decision:field(form,'decision').value as FurnitureDecision,photoDataUrl,purchaseValue:numeric(form,'purchaseValue')||undefined,notes:field(form,'notes').value.trim()});form.reset();persist();});
  q<HTMLFormElement>(root,'[data-form="timeline"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;project.timeline.push({id:uid('TASK'),title:field(form,'title').value.trim(),dueDate:field(form,'dueDate').value,phase:'Custom',completed:false});form.reset();persist();});
  q<HTMLFormElement>(root,'[data-form="box"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;const id=field(form,'id').value.trim().toUpperCase();if(project.boxes.some((box)=>box.id===id)){announce(zh?'紙箱 ID 不可重複。':'Box ID must be unique.',true);return;}project.boxes.push({id,roomId:field(form,'roomId').value,contents:field(form,'contents').value.trim(),fragile:(field(form,'fragile') as HTMLInputElement).checked,priority:field(form,'priority').value as 'low'|'normal'|'high',firstNight:(field(form,'firstNight') as HTMLInputElement).checked,openFirst:(field(form,'openFirst') as HTMLInputElement).checked,packed:false,loaded:false,delivered:false,unpacked:false});form.reset();persist();});
  q<HTMLFormElement>(root,'[data-form="budget"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;project.budget.push({id:uid('BUD'),category:field(form,'category').value as BudgetCategory,label:field(form,'label').value.trim(),estimated:numeric(form,'estimated'),actual:numeric(form,'actual'),paid:false,dueDate:field(form,'dueDate').value,notes:field(form,'notes').value.trim()});form.reset();persist();});
  q<HTMLFormElement>(root,'[data-form="move-day"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;project.moveDay={moverContact:field(form,'moverContact').value.trim(),buildingContact:field(form,'buildingContact').value.trim(),parking:field(form,'parking').value.trim(),elevatorReservation:field(form,'elevatorReservation').value.trim(),notes:field(form,'notes').value.trim()};persist();});
  q<HTMLFormElement>(root,'[data-form="first-night"]').addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;project.firstNight.push({id:uid('NIGHT'),label:field(form,'label').value.trim(),packed:false});form.reset();persist();});
  const shoppingForm=root.querySelector<HTMLFormElement>('[data-form="shopping"]');shoppingForm?.addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;const url=field(form,'url').value.trim();if(url&&!/^https?:\/\//i.test(url)){announce(zh?'商品網址只能使用 http 或 https。':'Product URL must use http or https.',true);return;}const item:ShoppingItem={id:uid('SHOP'),group:field(form,'group').value.trim(),candidate:field(form,'candidate').value as 'A'|'B'|'C',product:field(form,'product').value.trim(),category:field(form,'category').value as FurnitureCategory,store:field(form,'store').value.trim(),url,price:numeric(form,'price'),dimensions:{width:toMm(numeric(form,'width'),project.project.unit),depth:toMm(numeric(form,'depth'),project.project.unit),height:toMm(numeric(form,'height'),project.project.unit)},roomId:field(form,'roomId').value,priority:field(form,'priority').value as 'low'|'normal'|'high',status:field(form,'status').value as ShoppingItem['status'],delivery:field(form,'delivery').value.trim(),rating:numeric(form,'rating')||undefined,notes:field(form,'notes').value.trim()};project.shopping.push(item);form.reset();persist();});

  q<HTMLInputElement>(root,'[data-import-json]').addEventListener('change',async(event)=>{const input=event.currentTarget as HTMLInputElement;const file=input.files?.[0];if(!file)return;if(file.size>5_000_000){announce(zh?'備份檔超過 5 MB。':'Backup exceeds 5 MB.',true);return;}try{project=validateProject(JSON.parse(await file.text()) as unknown);persist(zh?'備份已驗證並還原。':'Backup validated and restored.');}catch(error){announce(error instanceof Error?error.message:String(error),true);}finally{input.value='';}});
  qa<HTMLElement>(root,'[data-action]').forEach((control)=>control.addEventListener('click',async()=>{try{switch(control.dataset.action){case'load-sample':project=createSampleProject(locale);persist(zh?'已載入明確標示的範例資料。':'Clearly labelled example data loaded.');break;case'new-project':project=createEmptyProject(locale);persist();break;case'export-json':exportBackup(project);announce(zh?'JSON 備份已建立。':'JSON backup created.');break;case'export-csv':exportFurnitureCsv(project);announce(zh?'家具 CSV 已建立。':'Furniture CSV created.');break;case'export-xlsx':announce(zh?'正在建立 XLSX…':'Building XLSX…');await exportWorkbook(project);announce(zh?'XLSX 已建立。':'XLSX created.');break;case'print-planner':printPlanner(project,'planner');break;case'print-move-day':printPlanner(project,'move-day');break;case'print-labels':printPlanner(project,'labels');break;case'open-planner':window.location.href=sendFurnitureToPlanner(project,q<HTMLSelectElement>(root,'[data-layout-room]').value);break;case'clear':if(window.confirm(zh?'清除這個瀏覽器中的 Moving OS 資料？請先匯出備份。':'Clear Moving OS data from this browser? Export a backup first.')){localStorage.removeItem(STORAGE_KEY);project=createEmptyProject(locale);render();announce(zh?'本機資料已清除。':'Local data cleared.');}break;}}catch(error){announce(error instanceof Error?error.message:String(error),true);}}));
  render();
}
