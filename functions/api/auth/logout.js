/**
 * POST /api/auth/logout
 * セッションCookieを失効
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get('Cookie') || '';
  const token = cookieHeader.split(';').map(c => c.trim())
    .find(c => c.startsWith('jhta_member='))?.split('=')[1];
  if (token) {
    await env.DB.prepare(`DELETE FROM member_sessions WHERE token = ?`).bind(token).run();
  }
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', 'jhta_member=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure');
  headers.append('Set-Cookie', 'jhta_member_status=; Path=/; Max-Age=0; SameSite=Lax; Secure');
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
