/**
 * /admin/proposals/[id]  —  提案詳細
 * GET: 詳細表示
 * POST: _action = 'update_status' | 'update_notes' で分岐
 */
import { renderShell, esc, escAttr, nl2br, statuses, statusBadge } from '../_shared.js';

const STATUSES = statuses();

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const id = params.id;
  const url = new URL(request.url);
  const flash = url.searchParams.get('flash') || '';

  const proposal = await env.DB.prepare(
    `SELECT * FROM proposals WHERE id = ?`
  ).bind(id).first();

  if (!proposal) {
    return new Response(renderShell({
      title: '提案が見つかりません',
      activeNav: 'proposals',
      body: `<p class="adm-no-data">受付番号 ${esc(id)} は存在しません。</p>
             <p><a class="btn btn-ghost btn-sm" href="/admin/proposals/">← 一覧に戻る</a></p>`,
    }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const detail = await env.DB.prepare(
    `SELECT * FROM proposal_details WHERE proposal_id = ?`
  ).bind(id).first();

  const detailsUrl = `https://tech.j-hta.org/workgroups/proposals/details/?id=${id}`;

  const body = `
    <a href="/admin/proposals/" class="adm-back-link">← 提案一覧</a>
    ${flash ? `<div class="adm-flash">${esc(flash)}</div>` : ''}

    <section class="adm-card">
      <h2 class="adm-card-title">基本情報</h2>
      <dl class="adm-meta">
        <dt>受付番号</dt><dd><strong>${esc(proposal.id)}</strong></dd>
        <dt>状態</dt><dd>${statusBadge(proposal.status)}</dd>
        <dt>経路</dt><dd>${proposal.source === 'manual' ? '手動登録（メール／対面など）' : '公開フォーム'}</dd>
        <dt>受付日時</dt><dd>${esc(proposal.created_at)}</dd>
        <dt>最終更新</dt><dd>${esc(proposal.updated_at)}</dd>
        <dt>氏名</dt><dd>${esc(proposal.name)}</dd>
        <dt>会社・所属</dt><dd>${esc(proposal.company)}</dd>
        <dt>メール</dt><dd><a href="mailto:${escAttr(proposal.email)}">${esc(proposal.email)}</a></dd>
        <dt>課題テーマ</dt><dd>${esc(proposal.theme)}</dd>
        <dt>課題</dt><dd>${nl2br(proposal.summary)}</dd>
      </dl>
    </section>

    <section class="adm-card">
      <h2 class="adm-card-title">操作</h2>
      <form method="POST" class="adm-detail-actions">
        <input type="hidden" name="_action" value="update_status">
        <label style="font-size:0.86rem;color:var(--adm-text-light);font-weight:600">ステータス変更</label>
        <select name="status" class="adm-select-sm">
          ${STATUSES.map(s => `<option value="${escAttr(s)}"${s === proposal.status ? ' selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
        <button type="submit" class="btn btn-navy btn-sm">更新</button>
      </form>

      <div style="margin-top:1.25rem">
        <label style="font-size:0.86rem;color:var(--adm-text-light);font-weight:600">Step 2 詳細フォーム URL（コピーしてメールに貼り付け）</label>
        <div class="adm-detail-actions" style="margin-top:0.4rem">
          <code class="adm-copy-url" id="copy-url">${esc(detailsUrl)}</code>
          <button type="button" class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('copy-url').textContent).then(()=>{this.textContent='コピー済 ✓';setTimeout(()=>this.textContent='URLをコピー',2000)})">URLをコピー</button>
        </div>
      </div>
    </section>

    <section class="adm-card">
      <h2 class="adm-card-title">事務局メモ</h2>
      <form method="POST">
        <input type="hidden" name="_action" value="update_notes">
        <textarea name="internal_notes" class="adm-textarea" rows="4" placeholder="事務局向けの内部メモ">${esc(proposal.internal_notes || '')}</textarea>
        <div style="margin-top:0.65rem;text-align:right">
          <button type="submit" class="btn btn-navy btn-sm">メモを保存</button>
        </div>
      </form>
    </section>

    ${detail ? renderDetailCard(detail) : `
    <section class="adm-card">
      <h2 class="adm-card-title">Step 2 詳細記入</h2>
      <p class="adm-no-data">まだ詳細フォームの記入はありません。上記URLをメールでお送りしてご記入を依頼してください。</p>
    </section>
    `}
  `;

  return new Response(renderShell({ title: `提案 ${proposal.id}`, body, activeNav: 'proposals' }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function renderDetailCard(d) {
  const outcomes = JSON.parse(d.expected_outcomes || '[]');
  const stakeholders = JSON.parse(d.stakeholders || '[]');
  const refs = JSON.parse(d.reference_urls || '[]');
  const scopeLabel = { industry: '業界全体', specific: '特定領域' }[d.scope_type] || '—';
  const renderTags = arr => arr.length ? arr.map(x => `<span class="adm-tag">${esc(x)}</span>`).join('') : '<span class="adm-no-data">—</span>';
  const renderText = s => s ? nl2br(s) : '<span class="adm-no-data">—</span>';
  const renderUrls = urls => urls.length
    ? urls.map(u => `<div><a href="${escAttr(u)}" target="_blank" rel="noopener">${esc(u)}</a></div>`).join('')
    : '<span class="adm-no-data">—</span>';

  return `
    <section class="adm-card">
      <h2 class="adm-card-title">Step 2 詳細記入（${esc(d.created_at)}）</h2>
      <dl class="adm-meta">
        <dt>背景・現状の問題</dt><dd>${renderText(d.background)}</dd>
        <dt>影響範囲</dt><dd>${esc(scopeLabel)}<br>${renderText(d.scope_text)}</dd>
        <dt>期待する成果</dt><dd>${renderTags(outcomes)}<div style="margin-top:0.4rem">${renderText(d.expected_outcomes_text)}</div></dd>
        <dt>期待する効果</dt><dd>${renderText(d.expected_effects)}</dd>
        <dt>ステークホルダー</dt><dd>${renderTags(stakeholders)}</dd>
        <dt>参考URL</dt><dd>${renderUrls(refs)}</dd>
        <dt>ホワイトペーパー</dt><dd>${d.whitepaper_url ? `<a href="${escAttr(d.whitepaper_url)}" target="_blank" rel="noopener">${esc(d.whitepaper_url)}</a>` : '<span class="adm-no-data">—</span>'}</dd>
        <dt>その他補足</dt><dd>${renderText(d.additional_notes)}</dd>
      </dl>
    </section>
  `;
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const id = params.id;
  const form = await request.formData();
  const action = form.get('_action');

  try {
    if (action === 'update_status') {
      const status = form.get('status');
      if (!STATUSES.includes(status)) return new Response('bad request', { status: 400 });
      await env.DB.prepare(
        `UPDATE proposals SET status = ?, updated_at = datetime('now', '+9 hours') WHERE id = ?`
      ).bind(status, id).run();
      return redirect(`/admin/proposals/${encodeURIComponent(id)}?flash=${encodeURIComponent(`ステータスを「${status}」に更新しました`)}`);
    }
    if (action === 'update_notes') {
      const notes = form.get('internal_notes')?.toString().slice(0, 4000) || null;
      await env.DB.prepare(
        `UPDATE proposals SET internal_notes = ?, updated_at = datetime('now', '+9 hours') WHERE id = ?`
      ).bind(notes, id).run();
      return redirect(`/admin/proposals/${encodeURIComponent(id)}?flash=${encodeURIComponent('事務局メモを保存しました')}`);
    }
    return new Response('unknown action', { status: 400 });
  } catch (err) {
    console.error('admin detail POST error:', err);
    return new Response(`error: ${err.message}`, { status: 500 });
  }
}

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}
