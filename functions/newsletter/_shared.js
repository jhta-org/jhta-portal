/**
 * 公開バックナンバーページ共通ヘルパー
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
  // **bold**
  text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  text = text.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  // [text](url)
  text = text.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, (m, t, u) => {
    const safe = String(u).replace(/[<>"']/g, '');
    return `<a href="${safe}" target="_blank" rel="noopener">${t}</a>`;
  });
  return text;
}

/**
 * 会員限定記事のティザー：最初の N ブロック（段落／見出し／リスト）を返す
 */
export function getTeaser(md, n = 2) {
  if (!md) return '';
  const blocks = md.replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  return blocks.slice(0, n).join('\n\n');
}

export function renderShell({ title, description, body, breadcrumb }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | JHTA Tech Portal</title>
${description ? `<meta name="description" content="${escAttr(description)}">` : ''}
<style>${SITE_CSS}</style>
</head>
<body>
<header class="site-header">
  <div class="site-header-inner">
    <a class="site-logo" href="/">JHTA Tech Portal</a>
    <nav class="site-nav">
      <a href="/documents/">成果物</a>
      <a href="/workgroups/">ワーキンググループ</a>
      <a href="/newsletter/">バックナンバー</a>
      <a href="/news/">ニュース</a>
      <a href="/about/">JHTAについて</a>
    </nav>
  </div>
</header>
<main class="site-main">
  ${breadcrumb ? `<nav class="breadcrumb">${breadcrumb}</nav>` : ''}
  ${body}
</main>
<footer class="site-footer">
  <div class="site-footer-inner">
    <span>© 2026 日本ホスピタリティテクノロジー協会（JHTA）</span>
    <a href="/admin/proposals/" class="footer-admin-link" id="footer-admin-link" hidden>🔧 管理画面</a>
  </div>
</footer>
<script>
  if (document.cookie.split(';').some(c => c.trim().startsWith('jhta_admin='))) {
    var el = document.getElementById('footer-admin-link');
    if (el) el.hidden = false;
  }
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
.site-header {
  background: var(--jhta-navy);
  color: #fff;
  border-bottom: 3px solid var(--jhta-gold);
}
.site-header-inner {
  max-width: var(--jhta-max-width);
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}
.site-logo {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  text-decoration: none;
}
.site-nav { display: flex; gap: 1.5rem; flex: 1; }
.site-nav a { color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 500; font-size: 0.92rem; }
.site-nav a:hover { color: #fff; }
.site-main {
  max-width: 860px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}
.site-footer {
  background: var(--jhta-navy-dark);
  color: rgba(255,255,255,0.5);
  padding: 2rem 1.5rem;
  font-size: 0.82rem;
}
.site-footer-inner {
  max-width: var(--jhta-max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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
}
.nl-item-title {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: var(--jhta-text-heading);
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
`;
