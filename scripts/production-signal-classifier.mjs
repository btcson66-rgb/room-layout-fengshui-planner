const thirdPartyHostRoots = [
  'googletagmanager.com',
  'google-analytics.com',
  'googlesyndication.com',
  'doubleclick.net',
  'adsbygoogle.com',
  'cloudflareinsights.com',
  'static.cloudflareinsights.com',
];

export const DEFAULT_PRODUCTION_ORIGIN = 'https://roomfeng.win';

function hostnameMatchesRoot(hostname, root) {
  return hostname === root || hostname.endsWith(`.${root}`);
}

export function urlsFromText(value) {
  return [...String(value ?? '').matchAll(/https?:\/\/[^\s)\]}>'"]+/g)].map((match) => match[0].replace(/[.,;]+$/, ''));
}

export function isThirdPartyUrl(value, firstPartyOrigin = DEFAULT_PRODUCTION_ORIGIN) {
  if (!value) return false;
  let parsed;
  let firstParty;
  try {
    firstParty = new URL(firstPartyOrigin);
    parsed = new URL(value, firstPartyOrigin);
  } catch {
    return false;
  }
  if (parsed.hostname === firstParty.hostname) return false;
  return thirdPartyHostRoots.some((root) => hostnameMatchesRoot(parsed.hostname, root));
}

export function classifyUrl(value, firstPartyOrigin = DEFAULT_PRODUCTION_ORIGIN) {
  return {
    sourceUrl: value ?? '',
    external: isThirdPartyUrl(value, firstPartyOrigin),
  };
}

export function classifyConsoleMessage(message, firstPartyOrigin = DEFAULT_PRODUCTION_ORIGIN) {
  const location = typeof message?.location === 'function' ? message.location() : {};
  return {
    message: typeof message?.text === 'function' ? message.text() : String(message?.message ?? ''),
    sourceUrl: location.url ?? '',
    external: isThirdPartyUrl(location.url, firstPartyOrigin),
  };
}

export function classifyPageError(error, firstPartyOrigin = DEFAULT_PRODUCTION_ORIGIN) {
  const message = String(error?.message ?? '');
  const stack = String(error?.stack ?? '');
  const explicitSourceUrl = String(error?.sourceUrl ?? '');
  const sourceUrls = urlsFromText(stack);
  return {
    message,
    stack,
    sourceUrl: explicitSourceUrl || sourceUrls[0] || '',
    external: [explicitSourceUrl, ...sourceUrls].some((url) => isThirdPartyUrl(url, firstPartyOrigin)),
  };
}
