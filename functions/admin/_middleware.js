/**
 * Basic Auth for /admin/* — secrets ADMIN_USER / ADMIN_PASSWORD bound via Cloudflare Pages.
 * 認証成功時に jhta_admin=1 Cookie を発行（公開ページのフッターから管理画面リンクを出すため）。
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
        const response = await context.next();
        // Cookie は HttpOnly にしない（公開ページの JS から読み取る必要があるため）
        const cookie = 'jhta_admin=1; Path=/; Max-Age=2592000; SameSite=Lax; Secure';
        const headers = new Headers(response.headers);
        headers.append('Set-Cookie', cookie);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="JHTA Admin"' },
  });
}
