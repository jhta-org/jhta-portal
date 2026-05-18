/**
 * 公開ニュースレターページ共通ヘルパー
 */

export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escAttr(s) { return esc(s); }

/**
 * 簡易 Markdown → HTML 変換
 * サポート: 見出し(h2/h3) / 太字 / 斜体 / リンク / 箇条書き / 順序リスト / 段落
 */
export function md2html(md) {
  if (!md) return '';
  // 改行正規化＋エスケープ
  let text = md.replace(/\r\n?/g, '\n');
  // ブロック分割
  const blocks = text.split(/\n\s*\n/);
  return blocks.map(block => renderBlock(block.trim())).filter(Boolean).join('\n');
}

function renderBlock(block) {
  if (!block) return '';
  // 見出し
  if (block.startsWith('### ')) return `<h3>${inline(escBlock(block.slice(4)))}</h3>`;
  if (block.startsWith('## ')) return `<h2>${inline(escBlock(block.slice(3)))}</h2>`;

  // 箇条書き
  const lines = block.split('\n');
  if (lines.every(l => /^[-*]\s/.test(l.trim()))) {
    const items = lines.map(l => `<li>${inline(escBlock(l.trim().replace(/^[-*]\s/, '')))}</li>`).join('');
    return `<ul>${items}</ul>`;
  }
  if (lines.every(l => /^\d+\.\s/.test(l.trim()))) {
    const items = lines.map(l => `<li>${inline(escBlock(l.trim().replace(/^\d+\.\s/, '')))}</li>`).join('');
    return `<ol>${items}</ol>`;
  }
  // 段落
  return `<p>${inline(escBlock(block)).replace(/\n/g, '<br>')}</p>`;
}

function escBlock(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(text) {
  // ![alt](src) — 画像（リンクより先）
  text = text.replace(/!\[([^\]]*?)\]\(([^)]+?)\)/g, (m, alt, src) => {
    const safeSrc = String(src).replace(/[<>"']/g, '');
    const safeAlt = String(alt).replace(/[<>"']/g, '');
    return `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy">`;
  });
  // **bold**
  text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  text = text.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  // _italic_ — 単語の途中（snake_case）は無視
  text = text.replace(/(^|[^A-Za-z0-9_])_([^_\n]+?)_(?![A-Za-z0-9_])/g, '$1<em>$2</em>');
  // [text](url)
  text = text.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, (m, t, u) => {
    const safe = String(u).replace(/[<>"']/g, '');
    return `<a href="${safe}" target="_blank" rel="noopener">${t}</a>`;
  });
  return text;
}

/**
 * 会員限定記事のティザー：概ね本文の半分（最低3／最大8ブロック）を返す。
 * 文末の出典・注釈ブロック（"_出典：_" や "（注）"）は前段カウントから除外し、
 * 「実本文の中盤」でゲートがかかるようにする。
 */
export function getTeaser(md) {
  if (!md) return '';
  const allBlocks = md.replace(/\r\n?/g, '\n').split(/\n\s*\n/).filter(b => b.trim());
  // クロージング系を除外して「実本文ブロック数」を見積もる
  const isClosing = (b) => /^_?出典/.test(b.trim()) || /^_?（注）/.test(b.trim()) || /^_?Note[:：]/i.test(b.trim());
  let bodyEnd = allBlocks.length;
  for (let i = 0; i < allBlocks.length; i++) {
    if (isClosing(allBlocks[i])) { bodyEnd = i; break; }
  }
  const bodyCount = bodyEnd;
  const n = Math.min(8, Math.max(3, Math.ceil(bodyCount / 2)));
  return allBlocks.slice(0, n).join('\n\n');
}

export function renderShell({ title, description, body, breadcrumb }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | JHTA Tech Portal</title>
${description ? `<meta name="description" content="${escAttr(description)}">` : ''}
<link rel="icon" href="/favicon.ico">
<style>${SITE_CSS}</style>
</head>
<body class="list" id="top">
<header class="header">
  <nav class="nav">
    <div class="logo">
      <a href="/" title="JHTA Tech Portal">
        <img src="/images/logo.png" alt="JHTA" height="36" class="logo-img">
        <span class="logo-text">JHTA Tech Portal</span>
      </a>
    </div>
    <ul id="menu">
      <li><a href="/about/"><span>概要</span></a></li>
      <li><a href="/workgroups/"><span>ワーキンググループ</span></a></li>
      <li><a href="/documents/"><span>ドキュメント</span></a></li>
      <li><a href="/news/"><span>ニュース</span></a></li>
      <li><a href="/newsletter/" class="active"><span>ニュースレター</span></a></li>
      <li><a href="https://j-hta.org/" target="_blank" rel="noopener"><span>公式サイト</span>&nbsp;<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24" height="12" width="12"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg></a></li>
    </ul>
  </nav>
</header>
<main class="main">
  <section class="section">
    <div class="section-inner">
      ${breadcrumb ? `<nav class="breadcrumb">${breadcrumb}</nav>` : ''}
      ${body}
    </div>
  </section>
</main>
<footer class="footer-outer">
  <div class="footer">
    <span>© 2026 日本ホスピタリティテクノロジー協会（JHTA）</span>
    <span class="footer-member-status" id="footer-member-status" hidden>
      🔓 会員ログイン中 <a href="/members/logout/">ログアウト</a>
    </span>
    <a href="/admin/proposals/" class="footer-admin-link" id="footer-admin-link" hidden>🔧 管理画面</a>
  </div>
</footer>
<script>
  (function() {
    var cookies = document.cookie.split(';').map(function(c){ return c.trim(); });
    if (cookies.some(function(c){ return c.startsWith('jhta_member_status='); })) {
      var m = document.getElementById('footer-member-status');
      if (m) m.hidden = false;
    }
    if (cookies.some(function(c){ return c.startsWith('jhta_admin='); })) {
      var a = document.getElementById('footer-admin-link');
      if (a) a.hidden = false;
    }
  })();
</script>
</body>
</html>`;
}

const SITE_CSS = `
:root {
  --jhta-navy: #1b2d5b;
  --jhta-navy-light: #243a6e;
  --jhta-navy-dark: #111d3a;
  --jhta-gold: #c49a3c;
  --jhta-text: #2a3342;
  --jhta-text-light: #5e6a7b;
  --jhta-text-heading: #101721;
  --jhta-border: #e1e1e1;
  --jhta-border-light: #eef1f5;
  --jhta-bg-alt: #f6f7f9;
  --jhta-radius: 8px;
  --jhta-max-width: 1100px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Yu Gothic', 'Hiragino Sans', sans-serif;
  color: var(--jhta-text);
  background: #fff;
  font-size: 16px;
  line-height: 1.75;
}
a { color: var(--jhta-navy); }
/* Header — Hugo (PaperMod + custom) と同じ構造に揃え */
header.header { background: var(--jhta-navy); }
.nav {
  background: var(--jhta-navy);
  max-width: var(--jhta-max-width);
  margin: 0 auto;
  padding: 0.6rem 2rem;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
}
.logo a {
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
}
.logo-img {
  height: 36px;
  width: auto;
  max-width: none;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
  background: #fff;
  padding: 3px 6px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}
.logo-text {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
#menu {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
#menu li { display: inline-block; }
#menu a {
  color: rgba(255,255,255,0.80);
  font-weight: 500;
  font-size: 0.88rem;
  padding: 0.5rem 1rem;
  border-bottom: 3px solid transparent;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}
#menu a:hover {
  color: #fff;
  border-bottom-color: var(--jhta-gold);
}
#menu a.active {
  color: #fff;
  border-bottom-color: var(--jhta-gold);
}
main.main { display: block; }
.section { padding: 2rem 0; }
.section-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.section:has(.nl-layout) .section-inner { max-width: 1100px; }
.footer-outer {
  background: var(--jhta-navy-dark);
  width: 100%;
}
.footer {
  color: rgba(255,255,255,0.45);
  font-size: 0.82rem;
  padding: 2rem 2rem;
  max-width: var(--jhta-max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.footer a { color: rgba(255,255,255,0.65); }
.footer a:hover { color: var(--jhta-gold); }
@media (max-width: 720px) {
  .nav { padding: 0.55rem 1rem; gap: 1rem; }
  #menu { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  #menu a { padding: 0.45rem 0.7rem; font-size: 0.85rem; }
  .logo-text { display: none; }
}
.footer-admin-link {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6) !important;
  text-decoration: none;
}
.footer-admin-link:hover {
  border-color: var(--jhta-gold);
  color: var(--jhta-gold) !important;
}
.breadcrumb {
  font-size: 0.85rem;
  color: var(--jhta-text-light);
  margin-bottom: 2rem;
}
.breadcrumb a { color: var(--jhta-text-light); text-decoration: none; }
.breadcrumb a:hover { color: var(--jhta-navy); }
.section-label {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--jhta-gold);
}
.page-title {
  font-size: 1.9rem;
  color: var(--jhta-text-heading);
  margin: 0.4rem 0 2rem;
  line-height: 1.35;
}
/* List */
.nl-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--jhta-border);
}
.nl-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 0.5rem;
  border-bottom: 1px solid var(--jhta-border-light);
  text-decoration: none;
  color: inherit;
  transition: background 0.15s, padding 0.2s;
}
.nl-item:hover {
  padding-left: 1rem;
  background: var(--jhta-bg-alt);
}
.nl-item time {
  font-size: 0.85rem;
  color: var(--jhta-text-light);
  min-width: 95px;
  align-self: flex-start;
  margin-top: 0.18rem;
}
.nl-item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.nl-item-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--jhta-text-heading);
  line-height: 1.5;
}
.nl-item-subtitle {
  font-size: 0.78rem;
  color: var(--jhta-text-light);
}
.nl-item:hover .nl-item-title { color: var(--jhta-navy); }
.nl-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #fef3c7;
  color: #854d0e;
  margin-left: 0.5rem;
}
/* Article */
.nl-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--jhta-text-light);
  font-size: 0.88rem;
  margin-bottom: 1rem;
}
.nl-body { font-size: 1rem; line-height: 1.95; }
.nl-body h2 {
  font-size: 1.3rem;
  color: var(--jhta-text-heading);
  margin: 2.5rem 0 0.85rem;
  padding-left: 0.7rem;
  border-left: 4px solid var(--jhta-navy);
}
.nl-body h3 {
  font-size: 1.1rem;
  color: var(--jhta-text-heading);
  margin: 1.8rem 0 0.6rem;
}
.nl-body p { margin: 0 0 1.1rem; }
.nl-body ul, .nl-body ol { margin: 0 0 1.3rem; padding-left: 1.4rem; }
.nl-body li { margin-bottom: 0.4rem; }
.nl-body strong { color: var(--jhta-text-heading); }
.nl-body em { color: var(--jhta-text-light); font-style: normal; font-size: 0.92rem; }
.nl-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.2rem auto;
  border-radius: 6px;
  border: 1px solid var(--jhta-border-light);
}
.nl-gate {
  margin: 2rem 0;
  padding: 1.75rem 1.75rem 1.5rem;
  border-radius: var(--jhta-radius);
  background: linear-gradient(180deg, rgba(196,154,60,0.06), rgba(27,45,91,0.06));
  border: 1.5px solid var(--jhta-gold);
  text-align: center;
}
.nl-gate-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--jhta-text-heading);
  margin-bottom: 0.5rem;
}
.nl-gate-desc {
  color: var(--jhta-text-light);
  margin-bottom: 1.25rem;
  font-size: 0.95rem;
}
.nl-gate-actions {
  display: flex;
  gap: 0.7rem;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border: 2px solid transparent;
  transition: all 0.15s ease;
}
.btn-primary {
  background: var(--jhta-gold);
  color: #fff;
  border-color: var(--jhta-gold);
}
.btn-primary:hover { filter: brightness(1.05); }
.btn-outline {
  background: transparent;
  color: var(--jhta-navy);
  border-color: var(--jhta-navy);
}
.btn-outline:hover {
  background: var(--jhta-navy);
  color: #fff;
}
.section-back { margin-top: 2.5rem; }
.section-empty {
  text-align: center;
  color: var(--jhta-text-light);
  padding: 3rem 1rem;
}

/* Newsletter layout (sidebar + main) */
.nl-layout {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
}
.nl-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
}
.nl-main { flex: 1; min-width: 0; }
.nl-arch-title {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--jhta-text-light);
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--jhta-border);
}
.nl-arch-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.88rem;
}
.nl-arch-all,
.nl-arch-month {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  text-decoration: none;
  color: var(--jhta-text);
}
.nl-arch-all:hover,
.nl-arch-month:hover {
  background: var(--jhta-bg-alt);
  color: var(--jhta-navy);
}
.nl-arch-active {
  background: var(--jhta-navy) !important;
  color: #fff !important;
}
.nl-arch-active .nl-arch-count {
  background: rgba(255,255,255,0.2) !important;
  color: #fff !important;
}
.nl-arch-year-group { margin: 0.85rem 0 0.4rem; }
.nl-arch-year {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0.6rem;
  font-weight: 700;
  font-size: 0.86rem;
  color: var(--jhta-text-heading);
}
.nl-arch-month-list {
  list-style: none;
  padding: 0 0 0 0.7rem;
  margin: 0.1rem 0 0;
  font-size: 0.85rem;
}
.nl-arch-month-list li { margin: 0.08rem 0; }
.nl-arch-count {
  display: inline-block;
  min-width: 1.8rem;
  text-align: right;
  font-size: 0.75rem;
  color: var(--jhta-text-light);
  background: var(--jhta-bg-alt);
  padding: 0.05rem 0.45rem;
  border-radius: 10px;
}

/* Pagination */
.nl-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 2rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid var(--jhta-border);
}
.nl-page-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid var(--jhta-border);
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.88rem;
  color: var(--jhta-navy);
  background: #fff;
}
.nl-page-btn:hover {
  border-color: var(--jhta-navy);
  background: var(--jhta-bg-alt);
}
.nl-page-disabled {
  color: var(--jhta-text-light);
  background: var(--jhta-bg-alt);
  cursor: default;
}
.nl-page-info {
  font-size: 0.85rem;
  color: var(--jhta-text-light);
}

/* Active filter notice */
.nl-filter-active {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(196,154,60,0.08);
  border: 1px solid rgba(196,154,60,0.3);
  padding: 0.6rem 0.95rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.nl-filter-clear {
  font-size: 0.82rem;
  color: var(--jhta-text-light);
  text-decoration: none;
}
.nl-filter-clear:hover { color: var(--jhta-navy); }

@media (max-width: 760px) {
  .nl-layout { flex-direction: column; gap: 1.5rem; }
  .nl-sidebar { width: 100%; position: static; }
  .nl-arch-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .nl-arch-year-group {
    margin: 0;
    width: 100%;
  }
  .nl-arch-month-list {
    display: flex;
    flex-wrap: wrap;
    padding-left: 0.5rem;
  }
  .nl-arch-month-list li { flex: 0 0 auto; }
  .nl-arch-all, .nl-arch-month {
    padding: 0.25rem 0.55rem;
    font-size: 0.82rem;
  }
}
`;
