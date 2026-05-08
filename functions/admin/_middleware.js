/**
 * Basic Auth for /admin/* — secrets ADMIN_USER / ADMIN_PASSWORD bound via Cloudflare Pages
 */
export const onRequest = [authenticate];

async function authenticate(context) {
  const user = context.env.ADMIN_USER;
  const pass = context.env.ADMIN_PASSWORD;
  if (!user || !pass) {
    return new Response('Admin credentials not configured', { status: 500 });
  }

  const authorization = context.request.headers.get('Authorization') || '';
  const [scheme, encoded] = authorization.split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded;
    try { decoded = atob(encoded); } catch { decoded = ''; }
    const idx = decoded.indexOf(':');
    if (idx >= 0) {
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === pass) {
        return await context.next();
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="JHTA Admin"' },
  });
}
