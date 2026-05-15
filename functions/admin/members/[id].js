/**
 * /admin/members/[id]  —  会員詳細
 * GET:  詳細表示
 * POST: _action = 'update' | 'revoke' | 'reactivate'
 */
import { renderShell, esc, escAttr, memberStatusBadge } from '../_shared.js';

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return new Response('bad id', { status: 400 });
  const url = new URL(request.url);
  const flash = url.searchParams.get('flash') || '';

  const m = await env.DB.prepare(`SELECT * FROM members WHERE id = ?`).bind(id).first();
  if (!m) {
    return new Response(renderShell({
      title: '会員が見つかりません',
      activeNav: 'members',
      body: `<p class="adm-no-data">ID ${id} の会員は存在しません。</p>
             <p><a class="btn btn-ghost btn-sm" href="/admin/members/">← 一覧に戻る</a></p>`,
    }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 最近のセッション
  const { results: sessions } = await env.DB.prepare(
    `SELECT created_at, expires_at, user_agent FROM member_sessions WHERE email = ?
     ORDER BY created_at DESC LIMIT 5`
  ).bind(m.email).all();

  const sessionRows = sessions.length
    ? sessions.map(s => `
        <tr>
          <td class="adm-date">${esc(s.created_at)}</td>
          <td class="adm-date">${esc(s.expires_at)}</td>
          <td style="font-size:0.82rem;color:var(--adm-text-light)">${esc((s.user_agent || '').slice(0, 90))}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" class="adm-empty" style="padding:1.5rem">セッションはありません</td></tr>';

  const body = `
    <a href="/admin/members/" class="adm-back-link">← 会員一覧</a>
    ${flash ? `<div class="adm-flash">${esc(flash)}</div>` : ''}

    <section class="adm-card">
      <h2 class="adm-card-title">基本情報</h2>
      <dl class="adm-meta">
        <dt>ID</dt><dd>${m.id}</dd>
        <dt>状態</dt><dd>${memberStatusBadge(m.status)}</dd>
        <dt>メール</dt><dd><a href="mailto:${escAttr(m.email)}">${esc(m.email)}</a></dd>
        <dt>氏名</dt><dd>${esc(m.name)}</dd>
        <dt>会社・所属</dt><dd>${esc(m.company || '—')}</dd>
        <dt>役職</dt><dd>${esc(m.position || '—')}</dd>
        <dt>登録日時</dt><dd>${esc(m.registered_at)}</dd>
        <dt>最終ログイン</dt><dd>${esc(m.last_login_at || '—')}</dd>
        <dt>ログイン回数</dt><dd>${m.login_count}回</dd>
      </dl>
    </section>

    <section class="adm-card">
      <h2 class="adm-card-title">基本情報の編集</h2>
      <form method="POST" style="max-width:540px">
        <input type="hidden" name="_action" value="update">
        <label class="adm-label">氏名 <input class="adm-input" name="name" value="${escAttr(m.name)}" required></label>
        <label class="adm-label">会社・所属 <input class="adm-input" name="company" value="${escAttr(m.company || '')}"></label>
        <label class="adm-label">役職 <input class="adm-input" name="position" value="${escAttr(m.position || '')}"></label>
        <div style="text-align:right;margin-top:0.5rem">
          <button type="submit" class="btn btn-navy btn-sm">保存</button>
        </div>
      </form>
    </section>

    <section class="adm-card">
      <h2 class="adm-card-title">最近のセッション</h2>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th>ログイン日時</th><th>有効期限</th><th>User-Agent</th></tr></thead>
          <tbody>${sessionRows}</tbody>
        </table>
      </div>
    </section>

    <section class="adm-card">
      <h2 class="adm-card-title">操作</h2>
      ${m.status === 'active' ? `
        <form method="POST" onsubmit="return confirm('この会員を無効化しますか？\\n（既存セッションは即時失効します）')">
          <input type="hidden" name="_action" value="revoke">
          <button type="submit" class="btn btn-danger btn-sm">この会員を無効化する</button>
        </form>
      ` : `
        <form method="POST">
          <input type="hidden" name="_action" value="reactivate">
          <button type="submit" class="btn btn-navy btn-sm">会員を再アクティブ化</button>
        </form>
      `}
    </section>
  `;

  return new Response(renderShell({ title: `会員 ${m.email}`, body, activeNav: 'members' }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return new Response('bad id', { status: 400 });

  const form = await request.formData();
  const action = form.get('_action');

  try {
    if (action === 'update') {
      const name = (form.get('name') || '').toString().trim();
      const company = (form.get('company') || '').toString().trim() || null;
      const position = (form.get('position') || '').toString().trim() || null;
      if (!name) return new Response('name is required', { status: 400 });
      await env.DB.prepare(
        `UPDATE members SET name = ?, company = ?, position = ? WHERE id = ?`
      ).bind(name, company, position, id).run();
      return redirect(`/admin/members/${id}?flash=${encodeURIComponent('更新しました')}`);
    }

    if (action === 'revoke') {
      const m = await env.DB.prepare(`SELECT email FROM members WHERE id = ?`).bind(id).first();
      if (m) {
        await env.DB.prepare(`UPDATE members SET status = 'revoked' WHERE id = ?`).bind(id).run();
        // 既存セッションも失効
        await env.DB.prepare(`DELETE FROM member_sessions WHERE email = ?`).bind(m.email).run();
      }
      return redirect(`/admin/members/${id}?flash=${encodeURIComponent('会員を無効化しました')}`);
    }

    if (action === 'reactivate') {
      await env.DB.prepare(`UPDATE members SET status = 'active' WHERE id = ?`).bind(id).run();
      return redirect(`/admin/members/${id}?flash=${encodeURIComponent('会員を再アクティブ化しました')}`);
    }

    return new Response('unknown action', { status: 400 });
  } catch (err) {
    console.error('member detail POST error:', err);
    return new Response(`error: ${err.message}`, { status: 500 });
  }
}

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}
