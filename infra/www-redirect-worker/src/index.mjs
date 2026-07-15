const CANONICAL_ORIGIN = 'https://roomfeng.win';
const REDIRECT_HOST = 'www.roomfeng.win';

export function canonicalLocation(requestUrl) {
  const source = new URL(requestUrl);
  const destination = new URL(CANONICAL_ORIGIN);
  destination.pathname = source.pathname;
  destination.search = source.search;
  return destination.toString();
}

export default {
  async fetch(request) {
    const source = new URL(request.url);

    // The route is already host-scoped, but keep a fail-closed guard so a
    // future route expansion cannot accidentally redirect unrelated hosts.
    if (source.hostname !== REDIRECT_HOST) {
      return new Response('Not found', { status: 404 });
    }

    return Response.redirect(canonicalLocation(source), 301);
  },
};
