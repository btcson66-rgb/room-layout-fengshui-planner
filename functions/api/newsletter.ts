interface Env {
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  BREVO_ROOMFENG_LIST_ID?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

type Payload = {
  email?: unknown;
  website?: unknown;
};

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
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
    website: formData.get('website'),
  };
}

export async function onRequestPost({ request, env }: PagesContext) {
  const payload = await readPayload(request);
  const email = String(payload.email ?? '').trim().toLowerCase();
  const honeypot = String(payload.website ?? '').trim();

  if (honeypot) {
    return jsonResponse({ ok: true, message: '訂閱申請已送出。' });
  }

  if (!emailPattern.test(email)) {
    return jsonResponse({ ok: false, code: 'invalid_email', message: '請輸入有效的 Email。' }, 400);
  }

  const apiKey = env.BREVO_API_KEY;
  const listIdRaw = env.BREVO_ROOMFENG_LIST_ID ?? env.BREVO_LIST_ID;

  if (!apiKey || !listIdRaw) {
    return jsonResponse(
      {
        ok: false,
        code: 'coming_soon',
        message: '訂閱功能即將開放，請稍後再試。',
      },
      503,
    );
  }

  const listId = Number(listIdRaw);
  if (!Number.isInteger(listId) || listId <= 0) {
    return jsonResponse({ ok: false, code: 'config_error', message: '訂閱設定尚未完成。' }, 500);
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
    return jsonResponse({
      ok: true,
      message: '訂閱申請已送出，請留意信箱後續通知。',
    });
  }

  const errorText = await brevoResponse.text();
  console.error('Brevo newsletter signup failed', brevoResponse.status, errorText.slice(0, 500));

  return jsonResponse(
    {
      ok: false,
      code: 'brevo_error',
      message: '訂閱暫時無法送出，請稍後再試。',
    },
    502,
  );
}

export function onRequestGet() {
  return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405);
}
