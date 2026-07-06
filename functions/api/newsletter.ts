interface Env {
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  BREVO_ROOMFENG_LIST_ID?: string;
  BREVO_WORTHCALC_LIST_ID?: string;
  BREVO_FUNNYTOOLS_LIST_ID?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

type SiteKey = 'roomfeng' | 'worthcalc' | 'funnytools';

type Payload = {
  email?: unknown;
  site?: unknown;
  website?: unknown;
};

const allowedOrigins = new Set([
  'https://roomfeng.win',
  'https://worthcalc.win',
  'https://funnytools.win',
]);

const listEnvBySite: Record<SiteKey, keyof Env> = {
  roomfeng: 'BREVO_ROOMFENG_LIST_ID',
  worthcalc: 'BREVO_WORTHCALC_LIST_ID',
  funnytools: 'BREVO_FUNNYTOOLS_LIST_ID',
};

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function readPayload(request: Request): Promise<Payload> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await request.json()) as Payload;
  }

  const formData = await request.formData();
  return {
    email: formData.get('email'),
    site: formData.get('site'),
    website: formData.get('website'),
  };
}

function normalizeSite(value: unknown): SiteKey | undefined {
  const site = String(value ?? 'roomfeng').trim().toLowerCase();

  if (site === 'roomfeng' || site === 'worthcalc' || site === 'funnytools') {
    return site;
  }

  return undefined;
}

function listIdForSite(env: Env, site: SiteKey): string | undefined {
  if (site === 'roomfeng') {
    return env.BREVO_ROOMFENG_LIST_ID ?? env.BREVO_LIST_ID;
  }

  return env[listEnvBySite[site]];
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

  let payload: Payload;
  try {
    payload = await readPayload(request);
  } catch {
    return jsonResponse(request, { ok: false, code: 'invalid_payload', message: 'Invalid signup payload.' }, 400);
  }

  const site = normalizeSite(payload.site);
  const email = String(payload.email ?? '').trim().toLowerCase();
  const honeypot = String(payload.website ?? '').trim();

  if (!site) {
    return jsonResponse(request, { ok: false, code: 'invalid_site', message: 'Unsupported newsletter site.' }, 400);
  }

  if (honeypot) {
    return jsonResponse(request, { ok: true, message: 'Signup received.' });
  }

  if (!emailPattern.test(email)) {
    return jsonResponse(request, { ok: false, code: 'invalid_email', message: 'Please enter a valid email.' }, 400);
  }

  const apiKey = env.BREVO_API_KEY;
  const listIdRaw = listIdForSite(env, site);

  if (!apiKey || !listIdRaw) {
    return jsonResponse(
      request,
      {
        ok: false,
        code: 'coming_soon',
        message: 'Newsletter signup is coming soon for this site.',
      },
      503,
    );
  }

  const listId = Number(listIdRaw);
  if (!Number.isInteger(listId) || listId <= 0) {
    return jsonResponse(request, { ok: false, code: 'config_error', message: 'Newsletter list is misconfigured.' }, 500);
  }

  const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
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
    }),
  });

  if (brevoResponse.ok) {
    return jsonResponse(request, {
      ok: true,
      message: 'Signup confirmed.',
    });
  }

  const errorText = await brevoResponse.text();
  console.error('Brevo newsletter signup failed', site, brevoResponse.status, errorText.slice(0, 500));

  return jsonResponse(
    request,
    {
      ok: false,
      code: 'brevo_error',
      message: 'Newsletter signup failed. Please try again later.',
    },
    502,
  );
}

export function onRequestGet({ request }: PagesContext) {
  return jsonResponse(request, { ok: false, message: 'Method not allowed.' }, 405);
}
