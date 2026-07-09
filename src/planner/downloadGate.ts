// Email download gate for planner exports: the plan preview stays free on
// the page; exporting a PNG/PDF asks for an email and the backend mails the
// file. Falls back to the plain local download whenever email delivery is
// not possible, so the user never loses their export.

const ENDPOINT = 'https://roomfeng.win/api/download-gate';
const STORAGE_KEY = 'rf_gate_email';
const MAX_EMAIL_FILE_BYTES = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GateFile {
  blob: Blob;
  filename: string;
}

export interface GateRequest {
  tool: string;
  getFile: () => Promise<GateFile | null> | GateFile | null;
  fallback: () => void;
  anchor?: HTMLElement | null;
}

interface GateLabels {
  title: string;
  desc: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
  sentEmail: string;
  sentLocal: string;
  invalidEmail: string;
  privacyNote: string;
  changeEmail: string;
}

const labelsByLang: Record<'zh' | 'en', GateLabels> = {
  zh: {
    title: '把檔案寄到你的信箱',
    desc: '輸入 email，我們會把匯出的檔案寄給你，之後有新工具與風水指南也會通知你。',
    emailPlaceholder: 'email@example.com',
    submit: '寄給我',
    sending: '處理中…',
    sentEmail: '檔案已寄到 {email}，請留意收件匣（也看一下垃圾郵件夾）。',
    sentLocal: '這個檔案較大，已直接為你下載；之後的更新通知會寄到你的信箱。',
    invalidEmail: '請輸入有效的 email。',
    privacyNote: '我們只用這個 email 寄送檔案與站內更新，不會外流，可隨時退訂。詳見隱私權政策。',
    changeEmail: '不是你的信箱？換一個',
  },
  en: {
    title: 'Send the file to your inbox',
    desc: 'Enter your email and we will send you the exported file, plus updates when new tools and guides launch.',
    emailPlaceholder: 'email@example.com',
    submit: 'Email it to me',
    sending: 'Working…',
    sentEmail: 'Sent to {email} — check your inbox (and the spam folder, just in case).',
    sentLocal: 'This file is large, so we started the download for you directly; updates will go to your inbox.',
    invalidEmail: 'Please enter a valid email.',
    privacyNote: 'We only use this email to send your file and site updates. Never shared; unsubscribe anytime. See the privacy policy.',
    changeEmail: 'Not your email? Change it',
  },
};

let stylesInjected = false;

function currentLang(): 'zh' | 'en' {
  return (document.documentElement.lang || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function track(eventName: string, tool: string, reason?: string) {
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', eventName, { tool_id: tool, reason, page_path: window.location.pathname });
  }
}

function savedEmail(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveEmail(email: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, email);
  } catch {
    /* private mode */
  }
}

function clearEmail() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = [
    '.rf-gate{margin-top:14px;padding:16px;border:1px solid #d8d4c8;border-radius:10px;background:#fffdf8;display:grid;gap:10px;}',
    '.rf-gate p{margin:0;color:#24231f;}',
    '.rf-gate .rf-gate-note{color:#6b655c;font-size:0.85rem;line-height:1.5;}',
    '.rf-gate form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;}',
    '.rf-gate input[type=email]{min-height:44px;border:1px solid #d8d4c8;border-radius:8px;background:#fff;color:#24231f;padding:8px 12px;font:inherit;}',
    '.rf-gate button[type=submit]{min-height:44px;border:none;border-radius:8px;background:#7a6c53;color:#fff;padding:8px 18px;font:inherit;cursor:pointer;}',
    '.rf-gate button[type=submit]:disabled{opacity:0.6;cursor:default;}',
    '.rf-gate .rf-gate-change{background:none;border:none;padding:0;color:#7a6c53;cursor:pointer;font:inherit;text-decoration:underline;}',
    '@media (max-width:560px){.rf-gate form{grid-template-columns:1fr;}}',
  ].join('\n');
  document.head.appendChild(style);
}

async function resolveFile(request: GateRequest): Promise<GateFile | null> {
  try {
    return await request.getFile();
  } catch {
    return null;
  }
}

async function submitGate(
  email: string,
  request: GateRequest,
  labels: GateLabels,
  lang: string,
  setStatus: (text: string, busy?: boolean) => void,
): Promise<void> {
  setStatus(labels.sending, true);
  track('gate_submit', request.tool);

  const formData = new FormData();
  formData.set('email', email);
  formData.set('site', 'roomfeng');
  formData.set('tool', request.tool);
  formData.set('lang', lang);
  formData.set('toolUrl', window.location.origin + window.location.pathname);
  formData.set('website', '');

  const file = await resolveFile(request);
  if (file && file.blob.size > 0 && file.blob.size <= MAX_EMAIL_FILE_BYTES) {
    formData.set('file', file.blob, file.filename);
  }

  let payload: { ok?: boolean; delivery?: string; code?: string } | null = null;

  try {
    const response = await fetch(ENDPOINT, { method: 'POST', body: formData });
    payload = (await response.json()) as { ok?: boolean; delivery?: string; code?: string };
  } catch {
    payload = null;
  }

  if (!payload) {
    track('gate_fallback_local', request.tool, 'endpoint_unreachable');
    request.fallback();
    setStatus(labels.sentLocal);
    return;
  }

  if (!payload.ok) {
    if (payload.code === 'invalid_email') {
      setStatus(labels.invalidEmail);
      return;
    }
    track('gate_fallback_local', request.tool, payload.code || 'server_error');
    request.fallback();
    setStatus(labels.sentLocal);
    return;
  }

  saveEmail(email);

  if (payload.delivery === 'email') {
    track('gate_email_sent', request.tool);
    setStatus(labels.sentEmail.replace('{email}', email));
    return;
  }

  track('gate_fallback_local', request.tool, 'delivery_local');
  request.fallback();
  setStatus(labels.sentLocal);
}

function renderPanel(request: GateRequest, labels: GateLabels, lang: string, mount: HTMLElement, prefill: string): HTMLElement {
  injectStyles();

  const existing = mount.parentElement?.querySelector<HTMLElement>('.rf-gate[data-gate-tool="' + request.tool + '"]');
  if (existing) {
    existing.hidden = false;
    existing.querySelector<HTMLInputElement>('input[type=email]')?.focus();
    return existing;
  }

  const panel = document.createElement('div');
  panel.className = 'rf-gate';
  panel.setAttribute('data-gate-tool', request.tool);

  const title = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = labels.title;
  title.appendChild(strong);

  const desc = document.createElement('p');
  desc.className = 'rf-gate-note';
  desc.textContent = labels.desc;

  const form = document.createElement('form');
  form.noValidate = true;

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.required = true;
  emailInput.placeholder = labels.emailPlaceholder;
  emailInput.autocomplete = 'email';
  emailInput.value = prefill;

  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'website';
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.style.position = 'absolute';
  honeypot.style.left = '-9999px';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = labels.submit;

  const status = document.createElement('p');
  status.className = 'rf-gate-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  const note = document.createElement('p');
  note.className = 'rf-gate-note';
  note.textContent = labels.privacyNote;

  form.append(emailInput, honeypot, submitButton);
  panel.append(title, desc, form, status, note);
  mount.insertAdjacentElement('afterend', panel);

  const setStatus = (text: string, busy = false) => {
    status.textContent = text;
    status.hidden = !text;
    submitButton.disabled = busy;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (honeypot.value.trim()) return;

    const email = emailInput.value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setStatus(labels.invalidEmail);
      return;
    }

    void submitGate(email, request, labels, lang, setStatus);
  });

  emailInput.focus();
  return panel;
}

export function requestGatedDownload(request: GateRequest): void {
  const lang = currentLang();
  const labels = labelsByLang[lang];

  track('gate_view', request.tool);

  const mount = request.anchor || (document.querySelector('[data-planner-actions]') as HTMLElement | null);

  if (!mount) {
    request.fallback();
    return;
  }

  const known = savedEmail();

  if (known && EMAIL_PATTERN.test(known)) {
    const panel = renderPanel(request, labels, lang, mount, known);
    const status = panel.querySelector<HTMLElement>('.rf-gate-status');
    const form = panel.querySelector('form');
    const submitButton = panel.querySelector<HTMLButtonElement>('button[type=submit]');
    if (form) form.hidden = true;

    const setStatus = (text: string, busy = false) => {
      if (status) {
        status.textContent = text;
        status.hidden = !text;
      }
      if (submitButton) submitButton.disabled = busy;
    };

    void submitGate(known, request, labels, lang, setStatus).then(() => {
      if (!status || status.hidden) return;
      const change = document.createElement('button');
      change.type = 'button';
      change.className = 'rf-gate-change';
      change.textContent = labels.changeEmail;
      change.addEventListener('click', () => {
        clearEmail();
        change.remove();
        if (form) {
          form.hidden = false;
          panel.querySelector<HTMLInputElement>('input[type=email]')?.focus();
        }
      });
      status.append(' ');
      status.appendChild(change);
    });
    return;
  }

  renderPanel(request, labels, lang, mount, '');
}
