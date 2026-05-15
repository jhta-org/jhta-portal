---
title: "ログアウト"
date: 2026-04-01
draft: false
type: "members"
ShowBreadCrumbs: true
hiddenInHomeList: true
---

<div id="logout-msg" style="padding:1rem;text-align:center;color:var(--jhta-text-light)">ログアウト処理中…</div>

<script>
(async function() {
  const msg = document.getElementById('logout-msg');
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    msg.innerHTML = '✅ ログアウトしました。<br><br><a href="/" class="btn btn-outline">トップへ戻る</a>';
  } catch {
    msg.innerHTML = '⚠️ ログアウト処理中にエラーが発生しました。';
  }
})();
</script>
