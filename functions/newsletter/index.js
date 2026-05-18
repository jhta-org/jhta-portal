/**
 * /newsletter/  —  ニュースレター一覧（公開済みのみ、30件/ページ、年月フィルタ可）
 */
import { renderShell, esc, escAttr } from './_shared.js';

const PAGE_SIZE = 30;

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const ymFilter = url.searchParams.get('ym') || '';

  // 公開予約済で公開時刻が過ぎているものを自動公開
  await env.DB.prepare(
    `UPDATE newsletters
     SET status = 'published', updated_at = datetime('now', '+9 hours')
     WHERE status = 'scheduled'
       AND published_at IS NOT NULL
       AND published_at <= datetime('now', '+9 hours')`
  ).run();

  // フィルタ条件
  const whereParts = [`status = 'published'`];
  const params = [];
  if (/^\d{4}-\d{2}$/.test(ymFilter)) {
    whereParts.push(`substr(published_at, 1, 7) = ?`);
    params.push(ymFilter);
  }
  const where = whereParts.join(' AND ');

  // 件数取得
  const cnt = await env.DB.prepare(`SELECT COUNT(*) AS c FROM newsletters WHERE ${where}`)
    .bind(...params).first();
  const total = cnt?.c || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // ページ分の記事
  const { results } = await env.DB.prepare(
    `SELECT slug, title, summary, visibility, published_at
     FROM newsletters
     WHERE ${where}
     ORDER BY published_at DESC
     LIMIT ${PAGE_SIZE} OFFSET ${offset}`
  ).bind(...params).all();

  // アーカイブ：年月別件数（フィルタは無視して全期間集計）
  const { results: ymRows } = await env.DB.prepare(
    `SELECT substr(published_at, 1, 7) AS ym, COUNT(*) AS c
     FROM newsletters
     WHERE status = 'published' AND published_at IS NOT NULL
     GROUP BY ym
     ORDER BY ym DESC`
  ).all();

  // 年ごとにグルーピング
  const byYear = {};
  let allCount = 0;
  for (const r of ymRows) {
    const [y, m] = r.ym.split('-');
    if (!byYear[y]) byYear[y] = { total: 0, months: [] };
    byYear[y].total += r.c;
    byYear[y].months.push({ ym: r.ym, m, count: r.c });
    allCount += r.c;
  }

  // タイトルから号番号だけ抜く
  const issueNo = (title) => {
    if (!title) return '';
    const m = title.match(/No\.\s*[\d-]+/);
    return m ? m[0] : '';
  };

  const items = results.map(r => {
    const date = (r.published_at || '').slice(0, 10).replace(/-/g, '.');
    const badge = r.visibility === 'members' ? `<span class="nl-badge">🔒 会員限定</span>` : '';
    const headline = r.summary || r.title;
    const subhead = r.summary ? issueNo(r.title) : '';
    return `
      <a href="/newsletter/${escAttr(r.slug)}" class="nl-item">
        <time datetime="${escAttr((r.published_at || '').slice(0, 10))}">${esc(date)}</time>
        <span class="nl-item-body">
          <span class="nl-item-title">${esc(headline)}${badge}</span>
          ${subhead ? `<span class="nl-item-subtitle">${esc(subhead)}</span>` : ''}
        </span>
      </a>
    `;
  }).join('') || '<div class="section-empty">該当するニュースレターはありません</div>';

  // ページネーション
  const filterQs = ymFilter ? `ym=${encodeURIComponent(ymFilter)}&` : '';
  let pagination = '';
  if (totalPages > 1) {
    const prev = currentPage > 1 ? `<a href="?${filterQs}page=${currentPage - 1}" class="nl-page-btn">← 前へ</a>` : '<span class="nl-page-btn nl-page-disabled">← 前へ</span>';
    const next = currentPage < totalPages ? `<a href="?${filterQs}page=${currentPage + 1}" class="nl-page-btn">次へ →</a>` : '<span class="nl-page-btn nl-page-disabled">次へ →</span>';
    pagination = `
      <nav class="nl-pagination">
        ${prev}
        <span class="nl-page-info">${currentPage} / ${totalPages} ページ（全 ${total} 件）</span>
        ${next}
      </nav>
    `;
  }

  // サイドバー：アーカイブ
  const years = Object.keys(byYear).sort().reverse();
  const sidebarYears = years.map(y => {
    const months = byYear[y].months.map(m => {
      const active = ymFilter === m.ym ? ' nl-arch-active' : '';
      return `<li><a href="?ym=${m.ym}" class="nl-arch-month${active}"><span>${y}.${m.m}</span><span class="nl-arch-count">${m.count}</span></a></li>`;
    }).join('');
    return `
      <li class="nl-arch-year-group">
        <div class="nl-arch-year">${y}年 <span class="nl-arch-count">${byYear[y].total}</span></div>
        <ul class="nl-arch-month-list">${months}</ul>
      </li>
    `;
  }).join('');

  const filterHeader = ymFilter ? `
    <div class="nl-filter-active">
      <span>📅 ${esc(ymFilter.replace('-', '年') + '月')} の記事を表示中</span>
      <a href="/newsletter/" class="nl-filter-clear">フィルタを解除 ✕</a>
    </div>
  ` : '';

  const body = `
    <span class="section-label">Newsletter</span>
    <h1 class="page-title">ニュースレター</h1>
    <p style="color:var(--jhta-text-light);margin:0 0 1.5rem">
      JHTA が毎週配信している業界 DX に関するニュースレターです。
      <span class="nl-badge" style="margin-left:0">🔒 会員限定</span> のついた記事は冒頭のみ公開、続きは会員ログインで閲覧できます。
    </p>

    <div class="nl-layout">
      <aside class="nl-sidebar">
        <h2 class="nl-arch-title">アーカイブ</h2>
        <ul class="nl-arch-list">
          <li>
            <a href="/newsletter/" class="nl-arch-all${!ymFilter ? ' nl-arch-active' : ''}">
              <span>全期間</span><span class="nl-arch-count">${allCount}</span>
            </a>
          </li>
          ${sidebarYears}
        </ul>
      </aside>

      <div class="nl-main">
        ${filterHeader}
        <div class="nl-list">${items}</div>
        ${pagination}
      </div>
    </div>
  `;

  return new Response(renderShell({
    title: ymFilter ? `ニュースレター（${ymFilter.replace('-', '年')}月）` : 'ニュースレター',
    description: 'JHTA Tech Portal のニュースレター一覧。業界DXに関する週次配信ニュースレターを公開しています。',
    breadcrumb: '<a href="/">ホーム</a> <span>/</span> <span>ニュースレター</span>',
    body,
  }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
