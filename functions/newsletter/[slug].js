/**
 * /newsletter/[slug]  —  バックナンバー記事ページ
 * 公開記事：全文表示
 * 会員記事：ログイン済→全文、未ログイン→ティザー＋CTA
 */
import { renderShell, esc, escAttr, md2html, getTeaser } from './_shared.js';

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const slug = params.slug;

  // 予約公開済を反映
  await env.DB.prepare(
    `UPDATE newsletters
     SET status = 'published', updated_at = datetime('now', '+9 hours')
     WHERE status = 'scheduled' AND published_at IS NOT NULL
       AND published_at <= datetime('now', '+9 hours')`
  ).run();

  const n = await env.DB.prepare(
    `SELECT slug, title, summary, body, visibility, published_at
     FROM newsletters WHERE slug = ? AND status = 'published'`
  ).bind(slug).first();

  if (!n) {
    return new Response(renderShell({
      title: '記事が見つかりません',
      breadcrumb: '<a href="/">ホーム</a> <span>/</span> <a href="/newsletter/">バックナンバー</a>',
      body: `
        <h1 class="page-title">記事が見つかりません</h1>
        <p>指定されたバックナンバーは存在しないか、まだ公開されていません。</p>
        <p class="section-back"><a href="/newsletter/" class="btn btn-outline">← バックナンバー一覧へ</a></p>
      `,
    }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const isMember = await isLoggedInMember(env, request);
  const fullAccess = n.visibility === 'public' || isMember;

  const renderedBody = fullAccess
    ? md2html(n.body)
    : md2html(getTeaser(n.body)) + renderGate();

  const date = (n.published_at || '').slice(0, 10);
  const badge = n.visibility === 'members' ? `<span class="nl-badge">🔒 会員限定</span>` : '';

  const body = `
    <span class="section-label">Newsletter</span>
    <h1 class="page-title">${esc(n.title)}${badge}</h1>
    <div class="nl-meta">
      <time datetime="${escAttr(date)}">公開日: ${esc(date.replace(/-/g, '.'))}</time>
    </div>
    <div class="nl-body">${renderedBody}</div>
    <p class="section-back"><a href="/newsletter/" class="btn btn-outline">← バックナンバー一覧へ</a></p>
  `;

  return new Response(renderShell({
    title: n.title,
    description: n.summary || undefined,
    breadcrumb: `<a href="/">ホーム</a> <span>/</span> <a href="/newsletter/">バックナンバー</a> <span>/</span> <span>${esc(n.title)}</span>`,
    body,
  }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * セッションCookieから会員ログイン状態を判定（auth未実装時はfalse）
 */
async function isLoggedInMember(env, request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const token = cookieHeader.split(';').map(c => c.trim())
    .find(c => c.startsWith('jhta_member='))?.split('=')[1];
  if (!token) return false;

  const session = await env.DB.prepare(
    `SELECT email, expires_at FROM member_sessions WHERE token = ?`
  ).bind(token).first();
  if (!session) return false;

  // 有効期限チェック
  const expiresAt = new Date(session.expires_at.replace(' ', 'T') + '+09:00');
  if (expiresAt < new Date()) return false;

  // 会員ステータスがactiveか
  const member = await env.DB.prepare(
    `SELECT status FROM members WHERE email = ?`
  ).bind(session.email).first();
  return member?.status === 'active';
}

function renderGate() {
  return `
    <div class="nl-gate">
      <div class="nl-gate-title">この続きは JHTA 会員のみ閲覧いただけます</div>
      <div class="nl-gate-desc">
        JHTA 会員になると、業界 DX に関する週次配信ニュースのバックナンバーをすべて閲覧できます。<br>
        既に会員の方はログインしてください。
      </div>
      <div class="nl-gate-actions">
        <a href="/members/login" class="btn btn-outline">会員ログイン</a>
        <a href="https://www.j-hta.org/" target="_blank" rel="noopener" class="btn btn-primary">会員登録のご案内 →</a>
      </div>
    </div>
  `;
}
