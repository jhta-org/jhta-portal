/**
 * 管理画面共通ヘルパー（HTMLレンダ／エスケープ／ステータス／フォーマッタ）
 */

export function statuses() {
  return ['受付中', '検討中', '詳細送付済', 'PreWG化', 'クローズ'];
}

export function statusBadge(s) {
  const cls = {
    '受付中': 'adm-status-new',
    '検討中': 'adm-status-review',
    '詳細送付済': 'adm-status-sent',
    'PreWG化': 'adm-status-prewg',
    'クローズ': 'adm-status-closed',
  }[s] || 'adm-status-default';
  return `<span class="adm-status ${cls}">${esc(s || '—')}</span>`;
}

export function newsletterStatusBadge(s) {
  const cls = {
    'draft': 'adm-status-draft',
    'scheduled': 'adm-status-scheduled',
    'published': 'adm-status-published',
  }[s] || 'adm-status-default';
  const label = { draft: '下書き', scheduled: '公開予約', published: '公開済' }[s] || s;
  return `<span class="adm-status ${cls}">${esc(label)}</span>`;
}

export function visibilityBadge(v) {
  const cls = v === 'members' ? 'adm-vis-members' : 'adm-vis-public';
  const label = v === 'members' ? '🔒 会員限定' : '公開';
  return `<span class="adm-vis ${cls}">${esc(label)}</span>`;
}

export function memberStatusBadge(s) {
  const cls = s === 'active' ? 'adm-status-prewg' : 'adm-status-closed';
  const label = s === 'active' ? 'アクティブ' : '無効';
  return `<span class="adm-status ${cls}">${esc(label)}</span>`;
}

export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escAttr(s) {
  return esc(s);
}

export function nl2br(s) {
  return esc(s).replace(/\r?\n/g, '<br>');
}

const NAV_ITEMS = [
  { key: 'proposals',   label: '提案管理',         href: '/admin/proposals/' },
  { key: 'members',     label: '会員管理',         href: '/admin/members/' },
  { key: 'newsletters', label: 'バックナンバー管理', href: '/admin/newsletters/' },
];

export function renderShell({ title, body, activeNav }) {
  const nav = NAV_ITEMS.map(item => {
    const active = item.key === activeNav ? ' adm-nav-active' : '';
    return `<a href="${item.href}" class="adm-nav-item${active}">${esc(item.label)}</a>`;
  }).join('');
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)} | JHTA 管理画面</title>
<style>${ADMIN_CSS}</style>
</head>
<body>
<header class="adm-header">
  <div class="adm-header-inner">
    <a class="adm-brand" href="/admin/proposals/">JHTA Admin</a>
    <nav class="adm-nav">${nav}</nav>
    <a class="adm-back" href="/" target="_blank" rel="noopener">公開サイトを開く ↗</a>
  </div>
</header>
<main class="adm-main">
  <h1 class="adm-title">${esc(title)}</h1>
  ${body}
</main>
</body>
</html>`;
}

const ADMIN_CSS = `
:root {
  --adm-navy: #1b2d5b;
  --adm-navy-light: #243a6e;
  --adm-gold: #c49a3c;
  --adm-bg: #f6f7f9;
  --adm-border: #e1e1e1;
  --adm-border-light: #eef1f5;
  --adm-text: #2a3342;
  --adm-text-light: #5e6a7b;
  --adm-text-heading: #101721;
  --adm-radius: 8px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Yu Gothic', 'Hiragino Sans', sans-serif;
  background: var(--adm-bg);
  color: var(--adm-text);
  font-size: 14px;
  line-height: 1.6;
}
.adm-header {
  background: var(--adm-navy);
  color: #fff;
  border-bottom: 3px solid var(--adm-gold);
}
.adm-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.adm-brand {
  font-weight: 700;
  font-size: 1.05rem;
  color: #fff;
  text-decoration: none;
  letter-spacing: 0.02em;
}
.adm-nav { flex: 1; display: flex; gap: 1.5rem; }
.adm-nav-item {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-weight: 500;
  padding: 0.4rem 0;
  border-bottom: 2px solid transparent;
}
.adm-nav-item:hover { color: #fff; }
.adm-nav-active {
  color: #fff !important;
  border-bottom-color: var(--adm-gold);
}
.adm-back { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.85rem; }
.adm-back:hover { color: #fff; }
.adm-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 4rem;
}
.adm-title {
  margin: 0 0 1.5rem;
  font-size: 1.6rem;
  color: var(--adm-text-heading);
}
.adm-section {
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 1.25rem 1.25rem 1.5rem;
}
.adm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.adm-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.adm-chip {
  display: inline-block;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  background: var(--adm-bg);
  color: var(--adm-text);
  text-decoration: none;
  font-size: 0.85rem;
  border: 1px solid var(--adm-border);
}
.adm-chip:hover { background: #fff; border-color: var(--adm-navy); color: var(--adm-navy); }
.adm-chip.active {
  background: var(--adm-navy);
  color: #fff;
  border-color: var(--adm-navy);
}
.adm-toolbar-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.adm-table-wrap { overflow-x: auto; }
.adm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.adm-table th, .adm-table td {
  padding: 0.7rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid var(--adm-border-light);
  vertical-align: middle;
}
.adm-table th {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--adm-text-light);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--adm-bg);
  border-bottom: 1.5px solid var(--adm-border);
}
.adm-table tr:hover td { background: #fafbfc; }
.adm-link { color: var(--adm-navy); text-decoration: none; font-weight: 600; }
.adm-link-mono { font-family: 'SF Mono', Menlo, monospace; }
.adm-link:hover { text-decoration: underline; }
.adm-empty { text-align: center; padding: 3rem; color: var(--adm-text-light); }
.adm-date { white-space: nowrap; color: var(--adm-text-light); font-size: 0.82rem; }
.adm-source {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.adm-source-form { background: #e0f2fe; color: #075985; }
.adm-source-manual { background: #fef3c7; color: #854d0e; }
.adm-status {
  display: inline-block;
  padding: 0.22rem 0.65rem;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.adm-status-new { background: #dbeafe; color: #1e40af; }
.adm-status-review { background: #fef3c7; color: #854d0e; }
.adm-status-sent { background: #ede9fe; color: #5b21b6; }
.adm-status-prewg { background: #d1fae5; color: #065f46; }
.adm-status-closed { background: #e5e7eb; color: #374151; }
.adm-status-draft { background: #f3f4f6; color: #6b7280; }
.adm-status-scheduled { background: #fef3c7; color: #92400e; }
.adm-status-published { background: #d1fae5; color: #065f46; }
.adm-status-default { background: var(--adm-bg); color: var(--adm-text-light); }
.adm-vis {
  display: inline-block;
  padding: 0.22rem 0.6rem;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.adm-vis-public { background: #ede9fe; color: #5b21b6; }
.adm-vis-members { background: #fef3c7; color: #854d0e; }
.adm-select-sm {
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--adm-border);
  border-radius: 4px;
  font-size: 0.82rem;
  background: #fff;
  cursor: pointer;
}
.adm-status-form { margin: 0; }
.btn {
  display: inline-block;
  padding: 0.65rem 1.3rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.15s ease;
  font-family: inherit;
}
.btn-sm { padding: 0.4rem 0.95rem; font-size: 0.83rem; }
.btn-navy { background: var(--adm-navy); color: #fff; border-color: var(--adm-navy); }
.btn-navy:hover { background: var(--adm-navy-light); }
.btn-ghost { background: transparent; color: var(--adm-text); border-color: var(--adm-border); }
.btn-ghost:hover { border-color: var(--adm-navy); color: var(--adm-navy); }
.btn-gold { background: var(--adm-gold); color: #fff; border-color: var(--adm-gold); }
.btn-danger { background: transparent; color: #b91c1c; border-color: #fecaca; }
.btn-danger:hover { background: #fef2f2; }
.adm-flash {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.85rem 1rem;
  border-radius: var(--adm-radius);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  word-break: break-all;
}
.adm-flash-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}
.adm-modal {
  border: none;
  border-radius: var(--adm-radius);
  padding: 0;
  max-width: 540px;
  width: 92%;
  background: #fff;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
}
.adm-modal-wide { max-width: 720px; }
.adm-modal::backdrop { background: rgba(0,0,0,0.4); }
.adm-form { padding: 1.5rem; }
.adm-modal-title { margin: 0 0 0.4rem; font-size: 1.2rem; color: var(--adm-text-heading); }
.adm-modal-desc { margin: 0 0 1.25rem; color: var(--adm-text-light); font-size: 0.88rem; }
.adm-label {
  display: block;
  margin-bottom: 0.85rem;
  font-size: 0.86rem;
  color: var(--adm-text-heading);
  font-weight: 600;
}
.adm-input, .adm-textarea, .adm-select {
  display: block;
  width: 100%;
  margin-top: 0.3rem;
  padding: 0.55rem 0.75rem;
  border: 1.2px solid var(--adm-border);
  border-radius: 6px;
  font-size: 0.92rem;
  font-family: inherit;
  font-weight: normal;
  color: var(--adm-text);
  background: #fff;
}
.adm-textarea { resize: vertical; min-height: 60px; }
.adm-textarea-large { min-height: 320px; font-family: 'SF Mono', Menlo, monospace; font-size: 0.88rem; line-height: 1.6; }
.adm-input:focus, .adm-textarea:focus, .adm-select:focus {
  outline: none;
  border-color: var(--adm-navy);
  box-shadow: 0 0 0 3px rgba(27,45,91,0.1);
}
.adm-radio-group, .adm-check-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-top: 0.3rem;
}
.adm-radio, .adm-check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: normal;
  font-size: 0.92rem;
  cursor: pointer;
}
.adm-modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* Detail page */
.adm-card {
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}
.adm-card-title {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  color: var(--adm-text-heading);
  font-weight: 700;
  border-left: 3px solid var(--adm-navy);
  padding-left: 0.65rem;
}
.adm-meta {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem 1.25rem;
  align-items: start;
}
.adm-meta dt {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--adm-text-light);
}
.adm-meta dd {
  margin: 0;
  font-size: 0.95rem;
  color: var(--adm-text);
  word-break: break-word;
}
.adm-detail-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.adm-copy-url {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.82rem;
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  flex: 1;
  word-break: break-all;
  color: var(--adm-text);
}
.adm-back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--adm-text-light);
  text-decoration: none;
  font-size: 0.88rem;
}
.adm-back-link:hover { color: var(--adm-navy); }
.adm-tag {
  display: inline-block;
  padding: 0.18rem 0.6rem;
  border-radius: 4px;
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
  font-size: 0.8rem;
  margin: 0.15rem 0.25rem 0.15rem 0;
}
.adm-no-data { color: var(--adm-text-light); font-style: italic; }
.adm-stat-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.adm-stat {
  flex: 1;
  min-width: 140px;
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 0.9rem 1.1rem;
}
.adm-stat-label {
  font-size: 0.78rem;
  color: var(--adm-text-light);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.adm-stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--adm-text-heading);
  margin-top: 0.2rem;
}

/* Newsletter content preview */
.adm-md-preview {
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 1rem 1.25rem;
  font-size: 0.92rem;
  line-height: 1.7;
}
.adm-md-preview h2 { font-size: 1.05rem; margin: 1.1rem 0 0.5rem; color: var(--adm-text-heading); }
.adm-md-preview h3 { font-size: 0.98rem; margin: 0.9rem 0 0.4rem; }
.adm-md-preview p { margin: 0 0 0.75rem; }
.adm-md-preview ul, .adm-md-preview ol { margin: 0 0 0.85rem; padding-left: 1.5rem; }
.adm-md-preview li { margin-bottom: 0.25rem; }
`;
