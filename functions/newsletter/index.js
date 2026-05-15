/**
 * /newsletter/  —  バックナンバー一覧（公開済みのみ表示）
 */
import { renderShell, esc, escAttr } from './_shared.js';

export async function onRequestGet(context) {
  const { env } = context;

  // 公開予約済で公開時刻が過ぎているものを自動公開
  await env.DB.prepare(
    `UPDATE newsletters
     SET status = 'published', updated_at = datetime('now', '+9 hours')
     WHERE status = 'scheduled'
       AND published_at IS NOT NULL
       AND published_at <= datetime('now', '+9 hours')`
  ).run();

  const { results } = await env.DB.prepare(
    `SELECT slug, title, summary, visibility, published_at
     FROM newsletters
     WHERE status = 'published'
     ORDER BY published_at DESC
     LIMIT 100`
  ).all();

  const items = results.map(r => {
    const date = (r.published_at || '').slice(0, 10).replace(/-/g, '.');
    const badge = r.visibility === 'members' ? `<span class="nl-badge">🔒 会員限定</span>` : '';
    return `
      <a href="/newsletter/${escAttr(r.slug)}" class="nl-item">
        <time datetime="${escAttr((r.published_at || '').slice(0, 10))}">${esc(date)}</time>
        <span class="nl-item-title">${esc(r.title)}${badge}</span>
      </a>
    `;
  }).join('') || '<div class="section-empty">まだ公開されているバックナンバーはありません</div>';

  const body = `
    <span class="section-label">Newsletter</span>
    <h1 class="page-title">バックナンバー</h1>
    <p style="color:var(--jhta-text-light);margin:0 0 2rem">
      JHTA が毎週配信している業界 DX に関するニュースのバックナンバーです。
      <span class="nl-badge" style="margin-left:0">🔒 会員限定</span> のついた記事は冒頭のみ公開、続きは会員ログインで閲覧できます。
    </p>
    <div class="nl-list">${items}</div>
  `;

  return new Response(renderShell({
    title: 'バックナンバー',
    description: 'JHTA Tech Portal のバックナンバー一覧。業界DXに関する週次配信ニュースを公開しています。',
    breadcrumb: '<a href="/">ホーム</a> <span>/</span> <span>バックナンバー</span>',
    body,
  }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
