/**
 * /admin/newsletters/[id]  —  バックナンバー編集
 * GET:  編集フォーム表示
 * POST: _action = 'save' | 'publish' | 'unpublish' | 'delete'
 */
import { renderShell, esc, escAttr, newsletterStatusBadge, visibilityBadge } from '../_shared.js';

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return new Response('bad id', { status: 400 });
  const url = new URL(request.url);
  const flash = url.searchParams.get('flash') || '';

  const n = await env.DB.prepare(`SELECT * FROM newsletters WHERE id = ?`).bind(id).first();
  if (!n) {
    return new Response(renderShell({
      title: 'バックナンバーが見つかりません',
      activeNav: 'newsletters',
      body: `<p class="adm-no-data">ID ${id} のバックナンバーは存在しません。</p>
             <p><a class="btn btn-ghost btn-sm" href="/admin/newsletters/">← 一覧に戻る</a></p>`,
    }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const publicUrl = `https://tech.j-hta.org/newsletter/${n.slug}`;

  const body = `
    <a href="/admin/newsletters/" class="adm-back-link">← バックナンバー一覧</a>
    ${flash ? `<div class="adm-flash">${esc(flash)}</div>` : ''}

    <section class="adm-card">
      <h2 class="adm-card-title">メタ情報</h2>
      <dl class="adm-meta" style="margin-bottom:1rem">
        <dt>ID</dt><dd>${n.id}</dd>
        <dt>状態</dt><dd>${newsletterStatusBadge(n.status)}</dd>
        <dt>公開範囲</dt><dd>${visibilityBadge(n.visibility)}</dd>
        <dt>公開URL</dt><dd>${n.status === 'published' ? `<a href="${escAttr(publicUrl)}" target="_blank" rel="noopener">${esc(publicUrl)}</a>` : '<span class="adm-no-data">未公開</span>'}</dd>
        <dt>作成</dt><dd>${esc(n.created_at)}</dd>
        <dt>最終更新</dt><dd>${esc(n.updated_at)}</dd>
      </dl>
    </section>

    <section class="adm-card">
      <h2 class="adm-card-title">編集</h2>
      <form method="POST">
        <label class="adm-label">タイトル
          <input class="adm-input" name="title" value="${escAttr(n.title)}" required>
        </label>
        <label class="adm-label">スラッグ（URL末尾）
          <input class="adm-input" name="slug" value="${escAttr(n.slug)}" required pattern="^[a-z0-9-]+$" style="font-family:'SF Mono',Menlo,monospace">
          <small style="display:block;color:var(--adm-text-light);font-size:0.8rem;margin-top:0.25rem">/newsletter/{この値} で公開されます。半角英数字とハイフンのみ。</small>
        </label>
        <label class="adm-label">サマリー（一覧表示用、任意）
          <textarea class="adm-textarea" name="summary" rows="2">${esc(n.summary || '')}</textarea>
        </label>
        <label class="adm-label">本文（Markdown）
          <textarea class="adm-textarea adm-textarea-large" name="body" required>${esc(n.body)}</textarea>
        </label>

        <label class="adm-label">公開範囲
          <div class="adm-radio-group">
            <label class="adm-radio"><input type="radio" name="visibility" value="public"${n.visibility === 'public' ? ' checked' : ''}> 公開（誰でも全文閲覧可）</label>
            <label class="adm-radio"><input type="radio" name="visibility" value="members"${n.visibility === 'members' ? ' checked' : ''}> 🔒 会員限定（冒頭のみ公開、続きは会員のみ）</label>
          </div>
        </label>

        <label class="adm-label">公開予約日時（任意・予約公開する場合のみ）
          <input class="adm-input" type="datetime-local" name="published_at" value="${formatForInput(n.published_at)}">
          <small style="display:block;color:var(--adm-text-light);font-size:0.8rem;margin-top:0.25rem">入力すると公開時刻として扱われます。即時公開する場合は空のままで OK。</small>
        </label>

        <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <button type="submit" name="_action" value="save" class="btn btn-ghost btn-sm">下書き保存</button>
            ${n.status !== 'published' ? `
              <button type="submit" name="_action" value="publish" class="btn btn-navy btn-sm" onclick="return confirm('このバックナンバーを公開しますか？')">公開する</button>
            ` : `
              <button type="submit" name="_action" value="unpublish" class="btn btn-ghost btn-sm" onclick="return confirm('公開を取り下げ下書きに戻しますか？')">公開取り下げ</button>
            `}
          </div>
          <button type="submit" name="_action" value="delete" formnovalidate class="btn btn-danger btn-sm" onclick="return confirm('このバックナンバーを完全に削除しますか？復元できません。')">削除</button>
        </div>
      </form>
    </section>
  `;

  return new Response(renderShell({ title: `バックナンバー: ${n.title}`, body, activeNav: 'newsletters' }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function formatForInput(s) {
  if (!s) return '';
  // SQLite の datetime("now", "+9 hours") は "YYYY-MM-DD HH:MM:SS" 形式
  return s.replace(' ', 'T').slice(0, 16);
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return new Response('bad id', { status: 400 });

  const form = await request.formData();
  const action = form.get('_action');

  try {
    if (action === 'delete') {
      await env.DB.prepare(`DELETE FROM newsletters WHERE id = ?`).bind(id).run();
      return redirect(`/admin/newsletters/?flash=${encodeURIComponent(`ID ${id} を削除しました`)}`);
    }

    // save / publish / unpublish はフォーム入力を反映
    const title = (form.get('title') || '').toString().trim();
    let slug = (form.get('slug') || '').toString().trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) slug = 'draft-' + Date.now().toString(36);
    const summary = (form.get('summary') || '').toString().trim() || null;
    const body = (form.get('body') || '').toString();
    const visibility = ['public', 'members'].includes(form.get('visibility'))
      ? form.get('visibility') : 'public';
    const publishedAtInput = (form.get('published_at') || '').toString().trim();
    const publishedAt = publishedAtInput
      ? publishedAtInput.replace('T', ' ') + ':00'
      : null;

    let status;
    let publishedAtFinal = publishedAt;
    if (action === 'publish') {
      // 公開予約日時が未来なら scheduled、即時または過去なら published
      const now = new Date();
      const ts = publishedAt ? new Date(publishedAt.replace(' ', 'T') + '+09:00') : now;
      if (ts > now) {
        status = 'scheduled';
        publishedAtFinal = publishedAt;
      } else {
        status = 'published';
        publishedAtFinal = publishedAt || new Date(now.getTime() + 9 * 3600 * 1000)
          .toISOString().replace('T', ' ').slice(0, 19);
      }
    } else if (action === 'unpublish') {
      status = 'draft';
    } else {
      // save: 既存の status は維持
      const cur = await env.DB.prepare(`SELECT status FROM newsletters WHERE id = ?`).bind(id).first();
      status = cur?.status || 'draft';
    }

    try {
      await env.DB.prepare(
        `UPDATE newsletters
         SET title = ?, slug = ?, summary = ?, body = ?, visibility = ?,
             status = ?, published_at = ?, updated_at = datetime('now', '+9 hours')
         WHERE id = ?`
      ).bind(title, slug, summary, body, visibility, status, publishedAtFinal, id).run();
    } catch (err) {
      if (String(err).includes('UNIQUE')) {
        return redirect(`/admin/newsletters/${id}?flash=${encodeURIComponent('そのスラッグは既に使われています')}`);
      }
      throw err;
    }

    const flashMsg = action === 'publish' ? (status === 'scheduled' ? '公開予約しました' : '公開しました')
                    : action === 'unpublish' ? '下書きに戻しました'
                    : '保存しました';
    return redirect(`/admin/newsletters/${id}?flash=${encodeURIComponent(flashMsg)}`);
  } catch (err) {
    console.error('newsletter POST error:', err);
    return new Response(`error: ${err.message}`, { status: 500 });
  }
}

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}
