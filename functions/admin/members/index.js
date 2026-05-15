/**
 * /admin/members/  —  会員管理画面
 * GET:  一覧表示（検索・ステータスフィルタ）
 * POST: _action = 'create' | 'import_csv' | 'update_status'
 */
import { renderShell, esc, escAttr, memberStatusBadge } from '../_shared.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const filter = url.searchParams.get('status') || 'active';
  const flash = url.searchParams.get('flash') || '';
  const flashType = url.searchParams.get('flash_type') || 'ok';

  // クエリ組み立て
  const whereParts = [];
  const params = [];
  if (filter && filter !== 'all') {
    whereParts.push('status = ?');
    params.push(filter);
  }
  if (q) {
    whereParts.push('(email LIKE ? OR name LIKE ? OR company LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const where = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

  const { results } = await env.DB.prepare(
    `SELECT id, email, name, company, position, status, registered_at, last_login_at, login_count
     FROM members ${where}
     ORDER BY registered_at DESC
     LIMIT 1000`
  ).bind(...params).all();

  // 統計
  const stats = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM members WHERE status = 'active') AS active_count,
       (SELECT COUNT(*) FROM members WHERE status = 'revoked') AS revoked_count,
       (SELECT COUNT(*) FROM members) AS total_count`
  ).first();

  const filterChips = [
    ['active',  `アクティブ (${stats.active_count})`],
    ['revoked', `無効 (${stats.revoked_count})`],
    ['all',     `全件 (${stats.total_count})`],
  ].map(([key, label]) => {
    const active = filter === key ? ' active' : '';
    return `<a class="adm-chip${active}" href="?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ''}">${esc(label)}</a>`;
  }).join('');

  const rows = results.map(r => `
    <tr>
      <td><a href="/admin/members/${r.id}" class="adm-link">${esc(r.email)}</a></td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.company || '')}</td>
      <td>${esc(r.position || '')}</td>
      <td>${memberStatusBadge(r.status)}</td>
      <td class="adm-date">${esc(r.last_login_at || '—')}</td>
      <td class="adm-date">${r.login_count}回</td>
      <td class="adm-date">${esc(r.registered_at)}</td>
    </tr>
  `).join('') || '<tr><td colspan="8" class="adm-empty">該当する会員はいません</td></tr>';

  const flashClass = flashType === 'error' ? 'adm-flash adm-flash-error' : 'adm-flash';
  const body = `
    ${flash ? `<div class="${flashClass}">${esc(flash)}</div>` : ''}

    <div class="adm-stat-row">
      <div class="adm-stat">
        <div class="adm-stat-label">アクティブ会員</div>
        <div class="adm-stat-value">${stats.active_count}</div>
      </div>
      <div class="adm-stat">
        <div class="adm-stat-label">無効</div>
        <div class="adm-stat-value">${stats.revoked_count}</div>
      </div>
      <div class="adm-stat">
        <div class="adm-stat-label">合計</div>
        <div class="adm-stat-value">${stats.total_count}</div>
      </div>
    </div>

    <section class="adm-section">
      <div class="adm-toolbar">
        <div class="adm-chips">${filterChips}</div>
        <form method="GET" style="display:flex;gap:0.4rem;align-items:center;">
          ${filter ? `<input type="hidden" name="status" value="${escAttr(filter)}">` : ''}
          <input type="search" name="q" value="${escAttr(q)}" placeholder="メアド／氏名／会社で検索" class="adm-input" style="width:280px;margin-top:0;">
          <button type="submit" class="btn btn-ghost btn-sm">検索</button>
        </form>
        <div class="adm-toolbar-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('import-modal').showModal()">📊 CSVインポート</button>
          <button type="button" class="btn btn-navy btn-sm" onclick="document.getElementById('create-modal').showModal()">+ 新規追加</button>
        </div>
      </div>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>メールアドレス</th><th>氏名</th><th>会社・所属</th><th>役職</th><th>状態</th>
              <th>最終ログイン</th><th>ログイン</th><th>登録日時</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    <dialog id="create-modal" class="adm-modal">
      <form method="POST" class="adm-form">
        <input type="hidden" name="_action" value="create">
        <h2 class="adm-modal-title">会員を新規追加</h2>
        <p class="adm-modal-desc">手動で会員を1名追加します。</p>
        <label class="adm-label">メールアドレス <input class="adm-input" type="email" name="email" required></label>
        <label class="adm-label">氏名 <input class="adm-input" name="name" required></label>
        <label class="adm-label">会社・所属 <input class="adm-input" name="company"></label>
        <label class="adm-label">役職 <input class="adm-input" name="position"></label>
        <div class="adm-modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('create-modal').close()">キャンセル</button>
          <button type="submit" class="btn btn-navy btn-sm">追加する</button>
        </div>
      </form>
    </dialog>

    <dialog id="import-modal" class="adm-modal adm-modal-wide">
      <form method="POST" class="adm-form">
        <input type="hidden" name="_action" value="import_csv">
        <h2 class="adm-modal-title">会員CSVをインポート</h2>
        <p class="adm-modal-desc">
          CSV／Excelからコピペしてください。1行目はヘッダー（<code>email,name,company,position</code>）。<br>
          既存メアドはスキップされます（更新はされません）。
        </p>
        <label class="adm-label">CSV データ
          <textarea class="adm-textarea" name="csv" rows="12" required style="font-family:'SF Mono',Menlo,monospace;font-size:0.85rem;" placeholder="email,name,company,position
yamada@example.com,山田 太郎,株式会社○○,部長
sato@example.com,佐藤 花子,株式会社△△,"></textarea>
        </label>
        <div class="adm-modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('import-modal').close()">キャンセル</button>
          <button type="submit" class="btn btn-navy btn-sm">インポート実行</button>
        </div>
      </form>
    </dialog>
  `;

  return new Response(renderShell({ title: '会員管理', body, activeNav: 'members' }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const form = await request.formData();
  const action = form.get('_action');

  try {
    if (action === 'create') {
      const data = {
        email: (form.get('email') || '').toString().trim().toLowerCase(),
        name: (form.get('name') || '').toString().trim(),
        company: (form.get('company') || '').toString().trim() || null,
        position: (form.get('position') || '').toString().trim() || null,
      };
      if (!data.email || !data.name) {
        return redirect(`/admin/members/?flash=${encodeURIComponent('メールアドレスと氏名は必須です')}&flash_type=error`);
      }
      try {
        await env.DB.prepare(
          `INSERT INTO members (email, name, company, position) VALUES (?, ?, ?, ?)`
        ).bind(data.email, data.name, data.company, data.position).run();
      } catch (err) {
        if (String(err).includes('UNIQUE')) {
          return redirect(`/admin/members/?flash=${encodeURIComponent(`${data.email} は既に登録済みです`)}&flash_type=error`);
        }
        throw err;
      }
      return redirect(`/admin/members/?flash=${encodeURIComponent(`${data.email} を登録しました`)}`);
    }

    if (action === 'import_csv') {
      const csv = (form.get('csv') || '').toString();
      const result = await importCsv(env.DB, csv);
      const msg = `インポート完了: 追加=${result.inserted}件、スキップ=${result.skipped}件、エラー=${result.errors}件`;
      return redirect(`/admin/members/?flash=${encodeURIComponent(msg)}`);
    }

    return new Response('unknown action', { status: 400 });
  } catch (err) {
    console.error('members POST error:', err);
    return redirect(`/admin/members/?flash=${encodeURIComponent(`エラー: ${err.message}`)}&flash_type=error`);
  }
}

async function importCsv(db, csv) {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { inserted: 0, skipped: 0, errors: 0 };

  // 1行目がヘッダーか判定
  const firstLine = lines[0].toLowerCase();
  const startIdx = firstLine.includes('email') || firstLine.includes('mail') ? 1 : 0;

  let inserted = 0, skipped = 0, errors = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const email = (cols[0] || '').trim().toLowerCase();
    const name = (cols[1] || '').trim();
    const company = (cols[2] || '').trim() || null;
    const position = (cols[3] || '').trim() || null;
    if (!email || !name) { errors++; continue; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors++; continue; }
    try {
      await db.prepare(
        `INSERT OR IGNORE INTO members (email, name, company, position) VALUES (?, ?, ?, ?)`
      ).bind(email, name, company, position).run();
      // INSERT OR IGNORE で重複時は0行影響なので、影響行数で判定
      const check = await db.prepare(`SELECT changes() AS c`).first();
      if (check.c > 0) inserted++; else skipped++;
    } catch (err) {
      console.error('CSV row error:', err);
      errors++;
    }
  }
  return { inserted, skipped, errors };
}

function parseCsvLine(line) {
  // 簡易CSV: クォート対応、カンマ区切り
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"' && cur === '') inQ = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}
