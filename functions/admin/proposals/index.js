/**
 * /admin/proposals/  —  提案管理画面（一覧 + 手動登録 + ステータス更新）
 * GET:   HTMLレンダ
 * POST:  _action = 'create_manual' | 'update_status' で分岐 → 同じURLにリダイレクト
 */
import { renderShell, esc, escAttr, statuses, statusBadge } from '../_shared.js';

const STATUSES = statuses();

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const filter = url.searchParams.get('status') || '';
  const flash = url.searchParams.get('flash') || '';

  const where = filter && STATUSES.includes(filter) ? 'WHERE status = ?' : '';
  const stmt = where
    ? env.DB.prepare(`SELECT id, source, name, company, theme, status, created_at FROM proposals ${where} ORDER BY created_at DESC LIMIT 500`).bind(filter)
    : env.DB.prepare(`SELECT id, source, name, company, theme, status, created_at FROM proposals ORDER BY created_at DESC LIMIT 500`);
  const { results } = await stmt.all();

  // ステータス別件数
  const counts = await env.DB.prepare(
    `SELECT status, COUNT(*) AS c FROM proposals GROUP BY status`
  ).all();
  const countMap = Object.fromEntries(counts.results.map(r => [r.status, r.c]));
  const totalCount = counts.results.reduce((acc, r) => acc + r.c, 0);

  const filterChips = ['', ...STATUSES].map(s => {
    const label = s === '' ? `すべて (${totalCount})` : `${s} (${countMap[s] || 0})`;
    const href = s ? `?status=${encodeURIComponent(s)}` : '?';
    const active = (filter === s) ? ' active' : '';
    return `<a class="adm-chip${active}" href="${href}">${esc(label)}</a>`;
  }).join('');

  const rows = results.map(r => `
    <tr>
      <td><a href="/admin/proposals/${escAttr(r.id)}" class="adm-link">${esc(r.id)}</a></td>
      <td>${statusBadge(r.status)}</td>
      <td>${esc(r.theme)}</td>
      <td>${esc(r.company)}</td>
      <td>${esc(r.name)}</td>
      <td><span class="adm-source adm-source-${r.source}">${r.source === 'manual' ? '手動' : 'フォーム'}</span></td>
      <td class="adm-date">${esc(r.created_at)}</td>
      <td>
        <form method="POST" class="adm-status-form">
          <input type="hidden" name="_action" value="update_status">
          <input type="hidden" name="id" value="${escAttr(r.id)}">
          <select name="status" class="adm-select-sm" onchange="this.form.submit()">
            ${STATUSES.map(s => `<option value="${escAttr(s)}"${s === r.status ? ' selected' : ''}>${esc(s)}</option>`).join('')}
          </select>
        </form>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8" class="adm-empty">該当する提案はありません</td></tr>';

  const body = `
    ${flash ? `<div class="adm-flash">${esc(flash)}</div>` : ''}
    <section class="adm-section">
      <div class="adm-toolbar">
        <div class="adm-chips">${filterChips}</div>
        <button type="button" class="btn btn-navy btn-sm" onclick="document.getElementById('manual-modal').showModal()">+ 手動で新規登録</button>
      </div>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>受付番号</th><th>状態</th><th>テーマ</th><th>会社・所属</th><th>氏名</th><th>経路</th><th>受付日時</th><th>更新</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    <dialog id="manual-modal" class="adm-modal">
      <form method="POST" class="adm-form">
        <input type="hidden" name="_action" value="create_manual">
        <h2 class="adm-modal-title">手動で新規登録</h2>
        <p class="adm-modal-desc">メール／対面で受け付けた提案を登録します。事務局メモも残せます。</p>
        <label class="adm-label">氏名 <input class="adm-input" name="name" required></label>
        <label class="adm-label">会社・所属 <input class="adm-input" name="company" required></label>
        <label class="adm-label">メール <input class="adm-input" name="email" type="email" required></label>
        <label class="adm-label">課題テーマ <input class="adm-input" name="theme" required></label>
        <label class="adm-label">課題 <textarea class="adm-textarea" name="summary" rows="3" required></textarea></label>
        <label class="adm-label">事務局メモ（任意） <textarea class="adm-textarea" name="internal_notes" rows="2" placeholder="例：5月8日 ○○ホテル様より対面でヒアリング"></textarea></label>
        <div class="adm-modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('manual-modal').close()">キャンセル</button>
          <button type="submit" class="btn btn-navy btn-sm">登録する</button>
        </div>
      </form>
    </dialog>
  `;

  return new Response(renderShell({ title: '提案管理', body, activeNav: 'proposals' }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const form = await request.formData();
  const action = form.get('_action');

  try {
    if (action === 'create_manual') {
      const id = await createManualProposal(env.DB, form);
      const flash = `${id} を登録しました。Step 2 詳細フォームURL: https://tech.j-hta.org/workgroups/proposals/details/?id=${id}`;
      return redirect(`/admin/proposals/?flash=${encodeURIComponent(flash)}`);
    }
    if (action === 'update_status') {
      const id = form.get('id');
      const status = form.get('status');
      if (!id || !STATUSES.includes(status)) return new Response('bad request', { status: 400 });
      await env.DB.prepare(
        `UPDATE proposals SET status = ?, updated_at = datetime('now', '+9 hours') WHERE id = ?`
      ).bind(status, id).run();
      return redirect(`/admin/proposals/?flash=${encodeURIComponent(`${id} のステータスを「${status}」に更新しました`)}`);
    }
    return new Response('unknown action', { status: 400 });
  } catch (err) {
    console.error('admin POST error:', err);
    return new Response(`error: ${err.message}`, { status: 500 });
  }
}

async function createManualProposal(db, form) {
  const required = ['name', 'company', 'email', 'theme', 'summary'];
  const data = {};
  for (const k of required) {
    const v = form.get(k);
    if (!v) throw new Error(`missing field: ${k}`);
    data[k] = v.toString().trim().slice(0, 2000);
  }
  const internal_notes = form.get('internal_notes')?.toString().trim().slice(0, 2000) || null;

  const year = new Date().getUTCFullYear();
  await db.prepare('INSERT OR IGNORE INTO proposal_counter (year, last_seq) VALUES (?, 0)').bind(year).run();
  const row = await db.prepare(
    'UPDATE proposal_counter SET last_seq = last_seq + 1 WHERE year = ? RETURNING last_seq'
  ).bind(year).first();
  const id = `JHTA-${year}-${String(row.last_seq).padStart(4, '0')}`;

  await db.prepare(
    `INSERT INTO proposals (id, source, name, company, email, theme, summary, internal_notes)
     VALUES (?, 'manual', ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.name, data.company, data.email, data.theme, data.summary, internal_notes).run();
  return id;
}

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}
