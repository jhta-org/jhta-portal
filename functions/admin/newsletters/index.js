/**
 * /admin/newsletters/  —  バックナンバー管理画面
 * GET:  一覧
 * POST: _action = 'create' で空の下書きを作成し、編集ページへリダイレクト
 */
import { renderShell, esc, escAttr, newsletterStatusBadge, visibilityBadge } from '../_shared.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status') || '';
  const visFilter = url.searchParams.get('visibility') || '';
  const flash = url.searchParams.get('flash') || '';

  const whereParts = [];
  const params = [];
  if (['draft', 'scheduled', 'published'].includes(statusFilter)) {
    whereParts.push('status = ?'); params.push(statusFilter);
  }
  if (['public', 'members'].includes(visFilter)) {
    whereParts.push('visibility = ?'); params.push(visFilter);
  }
  const where = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

  const { results } = await env.DB.prepare(
    `SELECT id, slug, title, visibility, status, published_at, created_at, updated_at
     FROM newsletters ${where}
     ORDER BY COALESCE(published_at, updated_at) DESC, id DESC
     LIMIT 500`
  ).bind(...params).all();

  const stats = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM newsletters WHERE status = 'published') AS published_count,
       (SELECT COUNT(*) FROM newsletters WHERE status = 'scheduled') AS scheduled_count,
       (SELECT COUNT(*) FROM newsletters WHERE status = 'draft')     AS draft_count,
       (SELECT COUNT(*) FROM newsletters WHERE visibility = 'members') AS members_count`
  ).first();

  const statusChips = [
    ['', 'すべて'],
    ['published', `公開済 (${stats.published_count})`],
    ['scheduled', `公開予約 (${stats.scheduled_count})`],
    ['draft',     `下書き (${stats.draft_count})`],
  ].map(([key, label]) => {
    const active = statusFilter === key ? ' active' : '';
    const params = new URLSearchParams();
    if (key) params.set('status', key);
    if (visFilter) params.set('visibility', visFilter);
    return `<a class="adm-chip${active}" href="?${params.toString()}">${esc(label)}</a>`;
  }).join('');

  const visChips = [
    ['', 'すべて'],
    ['public', '公開'],
    ['members', `🔒 会員限定 (${stats.members_count})`],
  ].map(([key, label]) => {
    const active = visFilter === key ? ' active' : '';
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (key) params.set('visibility', key);
    return `<a class="adm-chip${active}" href="?${params.toString()}">${esc(label)}</a>`;
  }).join('');

  const rows = results.map(r => `
    <tr>
      <td>${esc(r.id)}</td>
      <td><a href="/admin/newsletters/${r.id}" class="adm-link">${esc(r.title || '(無題)')}</a></td>
      <td>${visibilityBadge(r.visibility)}</td>
      <td>${newsletterStatusBadge(r.status)}</td>
      <td class="adm-date">${esc(r.published_at || '—')}</td>
      <td class="adm-date">${esc(r.updated_at)}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="adm-empty">該当するバックナンバーはありません</td></tr>';

  const body = `
    ${flash ? `<div class="adm-flash">${esc(flash)}</div>` : ''}

    <div class="adm-stat-row">
      <div class="adm-stat">
        <div class="adm-stat-label">公開済</div>
        <div class="adm-stat-value">${stats.published_count}</div>
      </div>
      <div class="adm-stat">
        <div class="adm-stat-label">公開予約</div>
        <div class="adm-stat-value">${stats.scheduled_count}</div>
      </div>
      <div class="adm-stat">
        <div class="adm-stat-label">下書き</div>
        <div class="adm-stat-value">${stats.draft_count}</div>
      </div>
      <div class="adm-stat">
        <div class="adm-stat-label">うち会員限定</div>
        <div class="adm-stat-value">${stats.members_count}</div>
      </div>
    </div>

    <section class="adm-section">
      <div class="adm-toolbar">
        <div>
          <div style="font-size:0.78rem;font-weight:700;color:var(--adm-text-light);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.04em">状態</div>
          <div class="adm-chips">${statusChips}</div>
        </div>
        <div>
          <div style="font-size:0.78rem;font-weight:700;color:var(--adm-text-light);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.04em">公開範囲</div>
          <div class="adm-chips">${visChips}</div>
        </div>
        <form method="POST" style="margin:0">
          <input type="hidden" name="_action" value="create">
          <button type="submit" class="btn btn-navy btn-sm">+ 新規作成</button>
        </form>
      </div>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>ID</th><th>タイトル</th><th>公開範囲</th><th>状態</th><th>公開日時</th><th>最終更新</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;

  return new Response(renderShell({ title: 'バックナンバー管理', body, activeNav: 'newsletters' }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const form = await request.formData();
  const action = form.get('_action');

  if (action === 'create') {
    // 空の下書きを作成
    const slug = 'draft-' + Date.now().toString(36);
    const title = '無題のバックナンバー';
    const body = '';
    const result = await env.DB.prepare(
      `INSERT INTO newsletters (slug, title, body) VALUES (?, ?, ?) RETURNING id`
    ).bind(slug, title, body).first();
    return redirect(`/admin/newsletters/${result.id}`);
  }

  return new Response('unknown action', { status: 400 });
}

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}
