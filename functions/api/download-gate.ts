interface Env {
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  BREVO_ROOMFENG_LIST_ID?: string;
  BREVO_WORTHCALC_LIST_ID?: string;
  BREVO_FUNNYTOOLS_LIST_ID?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

type SiteKey = 'roomfeng' | 'worthcalc' | 'funnytools';
type Lang = 'en' | 'zh';

const allowedOrigins = new Set([
  'https://roomfeng.win',
  'https://worthcalc.win',
  'https://funnytools.win',
]);

const siteDomains: Record<SiteKey, string> = {
  roomfeng: 'https://roomfeng.win',
  worthcalc: 'https://worthcalc.win',
  funnytools: 'https://funnytools.win',
};

const siteNames: Record<SiteKey, string> = {
  roomfeng: 'RoomFeng',
  worthcalc: 'WorthCalc',
  funnytools: 'FunnyTools',
};

const listEnvBySite: Record<SiteKey, keyof Env> = {
  roomfeng: 'BREVO_ROOMFENG_LIST_ID',
  worthcalc: 'BREVO_WORTHCALC_LIST_ID',
  funnytools: 'BREVO_FUNNYTOOLS_LIST_ID',
};

// Brevo transactional attachments are limited well below typical mail caps;
// anything larger falls back to a local download after the email is captured.
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bot Fight Mode 關閉後的端點自我防護：per-IP 限流（Cache API，逐 colo 軟限制）。
// 正常使用者一小時內下載多個工具檔案也用不到上限；超過視為機器人灌注。
const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

async function isRateLimited(request: Request): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return false;

  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const key = new Request(`https://rate-limit.download-gate.invalid/${encodeURIComponent(ip)}`);
    const hit = await cache.match(key);
    const count = hit ? Number(await hit.text()) || 0 : 0;

    if (count >= RATE_LIMIT_MAX) return true;

    await cache.put(key, new Response(String(count + 1), {
      headers: { 'cache-control': `max-age=${RATE_LIMIT_WINDOW_SECONDS}` },
    }));
    return false;
  } catch {
    // 快取層故障不能擋住正常使用者
    return false;
  }
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin');

  if (!origin || !allowedOrigins.has(origin)) {
    return { vary: 'Origin' };
  }

  return {
    vary: 'Origin',
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  };
}

function isDisallowedCorsRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  return Boolean(origin && !allowedOrigins.has(origin));
}

function jsonResponse(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      ...corsHeaders(request),
    },
  });
}

function normalizeSite(value: unknown): SiteKey | undefined {
  const site = String(value ?? '').trim().toLowerCase();

  if (site === 'roomfeng' || site === 'worthcalc' || site === 'funnytools') {
    return site;
  }

  return undefined;
}

function normalizeLang(value: unknown): Lang {
  return String(value ?? '').trim().toLowerCase() === 'zh' ? 'zh' : 'en';
}

function normalizeTool(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 80);
}

function sanitizeFilename(value: string): string {
  let cleaned = '';

  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32) continue;
    if ('/\\"<>|:*?'.includes(char)) {
      cleaned += '_';
      continue;
    }
    cleaned += char;
  }

  cleaned = cleaned.trim().slice(0, 120);
  return cleaned || 'result.bin';
}

function normalizeToolUrl(value: unknown, site: SiteKey): string {
  const url = String(value ?? '').trim();
  return url.startsWith(`${siteDomains[site]}/`) ? url : siteDomains[site];
}

function listIdForSite(env: Env, site: SiteKey): string | undefined {
  if (site === 'roomfeng') {
    return env.BREVO_ROOMFENG_LIST_ID ?? env.BREVO_LIST_ID;
  }

  return env[listEnvBySite[site]];
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function emailSubject(lang: Lang, tool: string, site: SiteKey): string {
  const toolLabel = tool || (lang === 'zh' ? '工具' : 'tool');

  return lang === 'zh'
    ? `你的 ${toolLabel} 結果檔案 — ${siteNames[site]}`
    : `Your ${toolLabel} result file from ${siteNames[site]}`;
}

function emailHtml(lang: Lang, tool: string, site: SiteKey, toolUrl: string): string {
  const siteName = siteNames[site];
  const toolLabel = tool || (lang === 'zh' ? '工具' : 'the tool');

  if (lang === 'zh') {
    return [
      `<p>你好！</p>`,
      `<p>你在 ${siteName} 使用 ${toolLabel} 產生的結果檔案在附件中。</p>`,
      `<p>想再處理一次？<a href="${toolUrl}">回到工具頁</a>。</p>`,
      `<p style="color:#888;font-size:12px">你會收到這封信是因為你在 ${siteName} 要求寄送檔案。我們偶爾會通知你新工具上線；不想收到可直接回覆告訴我們。</p>`,
    ].join('\n');
  }

  return [
    `<p>Hi!</p>`,
    `<p>The file you generated with ${toolLabel} on ${siteName} is attached.</p>`,
    `<p>Need to run it again? <a href="${toolUrl}">Back to the tool</a>.</p>`,
    `<p style="color:#888;font-size:12px">You received this email because you requested a file from ${siteName}. We may occasionally let you know about new tools; reply to opt out.</p>`,
  ].join('\n');
}

async function addContact(
  apiKey: string,
  email: string,
  listId: number,
  site: SiteKey,
  tool: string,
  lang: Lang,
): Promise<boolean> {
  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
      attributes: {
        SOURCE: 'download_gate',
        GATE_SITE: site,
        GATE_TOOL: tool,
        GATE_LANG: lang,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Brevo download-gate contact failed', site, tool, response.status, errorText.slice(0, 500));
  }

  return response.ok;
}

async function sendFileEmail(
  env: Env,
  email: string,
  site: SiteKey,
  tool: string,
  lang: Lang,
  toolUrl: string,
  file: File,
): Promise<boolean> {
  const senderEmail = env.BREVO_SENDER_EMAIL;

  if (!env.BREVO_API_KEY || !senderEmail) {
    return false;
  }

  const attachmentContent = toBase64(await file.arrayBuffer());

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: env.BREVO_SENDER_NAME ?? siteNames[site],
      },
      to: [{ email }],
      subject: emailSubject(lang, tool, site),
      htmlContent: emailHtml(lang, tool, site, toolUrl),
      attachment: [
        {
          name: sanitizeFilename(file.name),
          content: attachmentContent,
        },
      ],
      tags: ['download_gate', site, tool].filter(Boolean),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Brevo download-gate send failed', site, tool, response.status, errorText.slice(0, 500));
  }

  return response.ok;
}

export function onRequestOptions({ request }: PagesContext) {
  if (isDisallowedCorsRequest(request)) {
    return jsonResponse(request, { ok: false, code: 'forbidden_origin' }, 403);
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function onRequestPost({ request, env }: PagesContext) {
  if (isDisallowedCorsRequest(request)) {
    return jsonResponse(request, { ok: false, code: 'forbidden_origin' }, 403);
  }

  if (await isRateLimited(request)) {
    return jsonResponse(request, { ok: false, code: 'rate_limited', message: 'Too many requests. Please try again later.' }, 429);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(request, { ok: false, code: 'invalid_payload', message: 'Invalid download-gate payload.' }, 400);
  }

  const site = normalizeSite(formData.get('site'));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const honeypot = String(formData.get('website') ?? '').trim();
  const lang = normalizeLang(formData.get('lang'));
  const tool = normalizeTool(formData.get('tool'));

  if (!site) {
    return jsonResponse(request, { ok: false, code: 'invalid_site', message: 'Unsupported site.' }, 400);
  }

  if (honeypot) {
    return jsonResponse(request, { ok: true, delivery: 'email' });
  }

  if (!emailPattern.test(email)) {
    return jsonResponse(request, { ok: false, code: 'invalid_email', message: 'Please enter a valid email.' }, 400);
  }

  const apiKey = env.BREVO_API_KEY;
  const listIdRaw = listIdForSite(env, site);

  if (!apiKey || !listIdRaw) {
    return jsonResponse(request, { ok: false, code: 'coming_soon', message: 'Download gate is not configured yet.' }, 503);
  }

  const listId = Number(listIdRaw);
  if (!Number.isInteger(listId) || listId <= 0) {
    return jsonResponse(request, { ok: false, code: 'config_error', message: 'List is misconfigured.' }, 500);
  }

  const contactAdded = await addContact(apiKey, email, listId, site, tool, lang);
  if (!contactAdded) {
    return jsonResponse(request, { ok: false, code: 'brevo_error', message: 'Signup failed. Please try again later.' }, 502);
  }

  const toolUrl = normalizeToolUrl(formData.get('toolUrl'), site);
  const fileEntry = formData.get('file');
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : undefined;

  if (!file || file.size > MAX_FILE_BYTES) {
    return jsonResponse(request, { ok: true, delivery: 'local' });
  }

  const sent = await sendFileEmail(env, email, site, tool, lang, toolUrl, file);

  return jsonResponse(request, { ok: true, delivery: sent ? 'email' : 'local' });
}

export function onRequestGet({ request }: PagesContext) {
  return jsonResponse(request, { ok: false, message: 'Method not allowed.' }, 405);
}
